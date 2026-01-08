-- AlterTable
ALTER TABLE "users" ADD COLUMN "phoneCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Marcar usuários com telefone existente como phoneCompleted = true
UPDATE "users" SET "phoneCompleted" = true WHERE phone IS NOT NULL;

-- Marcar usuários sem telefone mas sem googleId (cadastro email/password) como phoneCompleted = true
-- Isso evita que usuários antigos sejam forçados a preencher o telefone novamente
UPDATE "users" SET "phoneCompleted" = true WHERE phone IS NULL AND "googleId" IS NULL;
