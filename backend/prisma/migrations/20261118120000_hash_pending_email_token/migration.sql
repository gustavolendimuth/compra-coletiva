-- Token da troca de email passa a ser guardado como SHA-256 hex (igual ao TokenService.hashToken).
-- Converte os pedidos pendentes para que os links já enviados continuem valendo.
UPDATE "users"
SET "pendingEmailToken" = encode(sha256(convert_to("pendingEmailToken", 'UTF8')), 'hex')
WHERE "pendingEmailToken" IS NOT NULL;
