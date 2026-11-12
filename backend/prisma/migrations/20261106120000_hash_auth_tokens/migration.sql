-- Refresh tokens passam a ser guardados como SHA-256 hex.
-- Backfill das sessões existentes para ninguém ser deslogado no deploy.
UPDATE "sessions" SET "token" = encode(sha256("token"::bytea), 'hex');

-- Tokens de reset pendentes são descartados (expiram em 1 h de qualquer forma);
-- novos tokens já são gravados como SHA-256 hex.
DELETE FROM "password_reset_tokens";
