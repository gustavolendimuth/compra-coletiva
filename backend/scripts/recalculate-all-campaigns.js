const { PrismaClient } = require('@prisma/client');
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
    return false;
  }

  const orderWeights = campaign.orders.map(order => {
    return order.items.reduce((sum, item) => {
      return sum + (item.product.weight * item.quantity);
    }, 0);
  });

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
  }

  return true;
}

async function recalculateAll() {
  const campaigns = await prisma.campaign.findMany({
    select: { id: true, name: true }
  });

  console.log(`Found ${campaigns.length} campaigns to recalculate\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const campaign of campaigns) {
    console.log(`Recalculating: ${campaign.name} (${campaign.id})`);

    try {
      const success = await distributeShipping(campaign.id);
      if (success) {
        console.log(`  ✓ Success\n`);
        successCount++;
      } else {
        console.log(`  ✗ Campaign not found\n`);
        errorCount++;
      }
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total Campaigns: ${campaigns.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('\nDone!');

  await prisma.$disconnect();
}

recalculateAll().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
