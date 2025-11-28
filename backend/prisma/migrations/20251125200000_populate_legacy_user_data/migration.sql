-- Migration to populate NULL userId and creatorId before making them NOT NULL

-- Step 1: Create a system user for legacy data (if it doesn't exist)
INSERT INTO "users" (
  "id",
  "email",
  "name",
  "role",
  "password",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-system-user',
  'system@legacy.local',
  'Sistema (Legado)',
  'ADMIN'::"UserRole",
  NULL,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "users" WHERE "id" = 'legacy-system-user'
);

-- Step 2: Update all orders with NULL userId to use the legacy system user
UPDATE "orders"
SET "userId" = 'legacy-system-user'
WHERE "userId" IS NULL;

-- Step 3: Update all campaigns with NULL creatorId to use the legacy system user
UPDATE "campaigns"
SET "creatorId" = 'legacy-system-user'
WHERE "creatorId" IS NULL;

-- Step 4: Update all order messages with NULL senderId to use the legacy system user
UPDATE "order_messages"
SET "senderId" = 'legacy-system-user'
WHERE "senderId" IS NULL;

-- Note: We do NOT make the fields NOT NULL here.
-- That will be done in the next migration (20251125221431_link_orders_to_users_and_unique_names)
-- This ensures data migration happens BEFORE the schema constraint is applied.
