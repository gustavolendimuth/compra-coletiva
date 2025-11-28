const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function validateCampaign(campaignId) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { orders: true }
  });

  if (!campaign) {
    console.log(`Campaign ${campaignId} not found`);
    return false;
  }

  const sumSubtotals = campaign.orders.reduce((sum, o) => sum + o.subtotal, 0);
  const sumShippingFees = campaign.orders.reduce((sum, o) => sum + o.shippingFee, 0);
  const sumTotals = campaign.orders.reduce((sum, o) => sum + o.total, 0);
  const sumPaid = campaign.orders.filter(o => o.isPaid).reduce((sum, o) => sum + o.total, 0);
  const sumUnpaid = campaign.orders.filter(o => !o.isPaid).reduce((sum, o) => sum + o.total, 0);

  const round = (n) => Math.round(n * 100) / 100;

  console.log(`\nCampaign: ${campaign.name} (${campaignId})`);
  console.log(`  Orders: ${campaign.orders.length}`);
  console.log(`  Campaign Shipping Cost: ${campaign.shippingCost.toFixed(2)}`);
  console.log(`  Sum of Order Shipping Fees: ${sumShippingFees.toFixed(2)}`);
  console.log(`  Sum of Subtotals: ${sumSubtotals.toFixed(2)}`);
  console.log(`  Sum of Totals: ${sumTotals.toFixed(2)}`);
  console.log(`  Expected Total: ${round(sumSubtotals + campaign.shippingCost).toFixed(2)}`);
  console.log(`  Sum of Paid: ${sumPaid.toFixed(2)}`);
  console.log(`  Sum of Unpaid: ${sumUnpaid.toFixed(2)}`);
  console.log(`  Paid + Unpaid: ${round(sumPaid + sumUnpaid).toFixed(2)}`);

  const shippingMatch = Math.abs(sumShippingFees - campaign.shippingCost) < 0.01;
  const totalMatch = Math.abs(sumTotals - (sumSubtotals + campaign.shippingCost)) < 0.01;
  const paidUnpaidMatch = Math.abs(sumTotals - (sumPaid + sumUnpaid)) < 0.01;

  console.log(`\n  ✓ Checks:`);
  console.log(`    Shipping Distribution: ${shippingMatch ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`    Total = Subtotals + Shipping: ${totalMatch ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`    Total = Paid + Unpaid: ${paidUnpaidMatch ? '✓ PASS' : '✗ FAIL'}`);

  return shippingMatch && totalMatch && paidUnpaidMatch;
}

async function validateAll() {
  const campaigns = await prisma.campaign.findMany();

  console.log(`Validating ${campaigns.length} campaigns...\n`);

  let passCount = 0;
  let failCount = 0;

  for (const campaign of campaigns) {
    const passed = await validateCampaign(campaign.id);
    if (passed) passCount++;
    else failCount++;
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Total Campaigns: ${campaigns.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);

  await prisma.$disconnect();
}

validateAll().catch(console.error);
