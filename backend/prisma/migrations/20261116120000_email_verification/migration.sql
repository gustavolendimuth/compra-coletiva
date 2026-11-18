-- Verificação do email do cadastro.
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "emailVerificationToken" TEXT,
ADD COLUMN "emailVerificationExpires" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");

-- Contas existentes que já entram (senha ou Google) seguem entrando: contam como verificadas.
-- Usuários legados (criados por organizador, sem senha) ficam pendentes até comprovar o email.
UPDATE "users" SET "emailVerifiedAt" = "createdAt"
WHERE "password" IS NOT NULL OR "googleId" IS NOT NULL;
