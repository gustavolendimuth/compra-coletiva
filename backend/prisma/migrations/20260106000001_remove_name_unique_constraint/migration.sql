-- Remove the partial unique index on name field
-- This allows multiple users to have the same name
DROP INDEX IF EXISTS "users_name_key";
