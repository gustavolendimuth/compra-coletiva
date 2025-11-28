const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function consolidateDuplicateOrders() {
  console.log("Finding duplicate orders...");
  
  const duplicates = await prisma.$queryRaw`
    SELECT "campaignId", "userId", COUNT(*) as count, ARRAY_AGG(id ORDER BY "createdAt") as order_ids
    FROM "orders"
    WHERE "userId" IS NOT NULL
    GROUP BY "campaignId", "userId"
    HAVING COUNT(*) > 1
  `;

  console.log(`Found ${duplicates.length} duplicate order groups`);

  for (const dup of duplicates) {
    console.log(`\nConsolidating orders for campaign ${dup.campaignId}, user ${dup.userId}`);
    console.log(`Order IDs: ${dup.order_ids.join(", ")}`);

    const [keepOrderId, ...removeOrderIds] = dup.order_ids;
    
    console.log(`Keeping order: ${keepOrderId}`);
    console.log(`Removing orders: ${removeOrderIds.join(", ")}`);

    const itemsToMove = await prisma.orderItem.findMany({
      where: { orderId: { in: removeOrderIds } },
      include: { product: true }
    });

    console.log(`Found ${itemsToMove.length} items to consolidate`);

    const existingItems = await prisma.orderItem.findMany({
      where: { orderId: keepOrderId }
    });

    for (const item of itemsToMove) {
      const existingItem = existingItems.find(ei => ei.productId === item.productId);
      
      if (existingItem) {
        console.log(`Merging product ${item.productId}: ${existingItem.quantity} + ${item.quantity}`);
        await prisma.orderItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + item.quantity,
            subtotal: (existingItem.quantity + item.quantity) * existingItem.unitPrice
          }
        });
      } else {
        console.log(`Moving item ${item.id} to order ${keepOrderId}`);
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { orderId: keepOrderId }
        });
      }
    }

    console.log(`Deleting duplicate orders...`);
    await prisma.order.deleteMany({
      where: { id: { in: removeOrderIds } }
    });

    const allItems = await prisma.orderItem.findMany({
      where: { orderId: keepOrderId }
    });
    
    const subtotal = allItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    await prisma.order.update({
      where: { id: keepOrderId },
      data: { subtotal }
    });

    console.log(`Consolidated successfully. New subtotal: ${subtotal}`);
  }

  console.log("\nAll duplicates consolidated!");
  await prisma.$disconnect();
}

consolidateDuplicateOrders()
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
