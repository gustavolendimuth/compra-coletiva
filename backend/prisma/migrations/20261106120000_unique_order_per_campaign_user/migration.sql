-- Um pedido por usuário por campanha.
-- Antes do deploy, conferir duplicatas:
--   SELECT "campaignId", "userId", count(*) FROM orders GROUP BY 1, 2 HAVING count(*) > 1;
DROP INDEX IF EXISTS "orders_campaignId_userId_idx";

CREATE UNIQUE INDEX "orders_campaignId_userId_key" ON "orders"("campaignId", "userId");
