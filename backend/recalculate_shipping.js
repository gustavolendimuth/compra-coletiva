const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Money utility functions (inline for standalone script)
const Money = {
  round: (value) => Math.round(value * 100) / 100,

  distributeProportionally: (total, weights) => {
    if (weights.length === 0) return [];

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return weights.map(() => 0);

    const distributed = [];
    let distributedSum = 0;

    for (let i = 0; i < weights.length; i++) {
      let amount;
      if (i === weights.length - 1) {
        amount = Money.round(total - distributedSum);
      } else {
        amount = Money.round((weights[i] / totalWeight) * total);
        distributedSum = Money.round(distributedSum + amount);
      }
      distributed.push(amount);
    }

    return distributed;
  }
};

async function distributeShipping(campaignId) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      orders: {
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }
    }
  });

  if (!campaign) {
    console.log(`Campaign ${campaignId} not found`);
    return;
  }

  const orderWeights = campaign.orders.map(order => {
    return order.items.reduce((sum, item) => {
      return sum + (item.product.weight * item.quantity);
    }, 0);
  });

  const totalWeight = orderWeights.reduce((sum, w) => sum + w, 0);
  console.log(`Campaign ${campaignId}: Total weight ${totalWeight}, Total shipping ${campaign.shippingCost}`);

  const shippingFees = Money.distributeProportionally(campaign.shippingCost, orderWeights);

  for (let i = 0; i < campaign.orders.length; i++) {
    const order = campaign.orders[i];
    const shippingFee = shippingFees[i];
    const total = Money.round(order.subtotal + shippingFee);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        shippingFee,
        total
      }
    });

    console.log(`  Order ${order.id}: weight ${orderWeights[i]}, shipping ${shippingFee}, total ${total}`);
  }
}

async function recalculateAllShipping() {
  console.log("Recalculating shipping for campaign cmhcmkpfm00006kis5q8opukm...\n");
  await distributeShipping("cmhcmkpfm00006kis5q8opukm");
  console.log("\nDone!");
  await prisma.$disconnect();
}

recalculateAllShipping()
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
