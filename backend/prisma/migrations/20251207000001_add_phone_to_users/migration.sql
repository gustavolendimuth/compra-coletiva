-- AddColumn
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

-- CreateIndex (para futuras buscas por telefone)
CREATE INDEX "users_phone_idx" ON "users"("phone");
