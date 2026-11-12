#!/usr/bin/env bash
# Prova do backfill da migração 20261106120000_hash_auth_tokens contra um Postgres descartável.
# Uso: bash backend/scripts/checks/hash-tokens-backfill.check.sh <porta-host>
# Requer um container postgres ouvindo em 127.0.0.1:<porta> com senha "pg".
set -euo pipefail

PORT="${1:-55433}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATION="$DIR/prisma/migrations/20261106120000_hash_auth_tokens/migration.sql"
DB_URL="postgresql://postgres:pg@127.0.0.1:${PORT}/postgres"
CONTAINER="${CONTAINER:-sec-lane-auth-pg}"

psql_exec() {
  docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d postgres -tA "$@"
}

for _ in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done

# Schema mínimo, com token pré-migração em texto puro
psql_exec <<'SQL'
DROP TABLE IF EXISTS "sessions"; DROP TABLE IF EXISTS "password_reset_tokens";
CREATE TABLE "sessions" ("id" TEXT PRIMARY KEY, "token" TEXT NOT NULL UNIQUE);
CREATE TABLE "password_reset_tokens" ("id" TEXT PRIMARY KEY, "token" TEXT NOT NULL UNIQUE);
INSERT INTO "sessions" VALUES ('s1', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1MSJ9.c2lnbmF0dXJl');
INSERT INTO "password_reset_tokens" VALUES ('r1', 'abc123');
SQL

psql_exec < "$MIGRATION"

EXPECTED="$(node -e 'process.stdout.write(require("crypto").createHash("sha256").update(process.argv[1]).digest("hex"))' 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1MSJ9.c2lnbmF0dXJl')"
GOT="$(psql_exec -c "SELECT token FROM sessions WHERE id = 's1'")"
RESETS="$(psql_exec -c "SELECT count(*) FROM password_reset_tokens")"

echo "expected=$EXPECTED got=$GOT resets=$RESETS (db=$DB_URL)"
[ "$GOT" = "$EXPECTED" ] && [ "$RESETS" = "0" ]
echo "OK: sessão antiga achável por sha256 hex (mesmo hash do TokenService) e resets apagados"
