#!/bin/bash
# Sobe/derruba um preview provisório da worktree atual (backend + frontend via
# npm, em portas livres), reaproveitando o postgres/redis do docker principal.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Checkout principal do projeto (o primeiro da lista de worktrees): é dele que
# vêm os .env, o docker-compose do postgres/redis e os dados clonados.
MAIN_WORKTREE=$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')

STATE_FILE="$ROOT_DIR/.preview-worktree.state"
LOG_DIR="$ROOT_DIR/logs"
BACKEND_LOG="$LOG_DIR/preview-backend.log"
FRONTEND_LOG="$LOG_DIR/preview-frontend.log"

# Fora das portas do docker principal (5173/3000), pra rodar junto com ele.
FRONTEND_BASE_PORT=5200
BACKEND_BASE_PORT=3200
DB_PORT=5432
REDIS_PORT=6379
DB_CONTAINER="compra-coletiva-db"
MAIN_DB_NAME="compra_coletiva"

# 127.0.0.1 em vez de localhost: cookie não separa por porta, então com o
# mesmo host o login do preview sobrescreveria a sessão do docker principal.
PREVIEW_HOST="127.0.0.1"

# Banco isolado por worktree: essa branch pode ter migrations que o docker
# principal ainda não tem, então o preview nunca migra o banco compartilhado.
PREVIEW_DB_NAME="compra_coletiva_$(echo -n "$(basename "$ROOT_DIR")" | tr 'A-Z' 'a-z' | tr -c 'a-z0-9' '_')"
DATABASE_URL_PREVIEW="postgresql://postgres:postgres@localhost:${DB_PORT}/${PREVIEW_DB_NAME}"

# Redis db 1: a fila de email do preview não se mistura com a do docker principal,
# cujo worker mandaria os emails de verdade.
REDIS_URL_PREVIEW="redis://localhost:${REDIS_PORT}/1"

port_in_use() {
    ss -Htn state listening "( sport = :$1 )" 2>/dev/null | grep -q .
}

find_free_port() {
    local port=$1
    while port_in_use "$port"; do
        port=$((port + 1))
    done
    echo "$port"
}

db_psql() {
    docker exec -i "$DB_CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 "$@"
}

# .env é gitignorado, então worktrees novas não o herdam do checkout principal.
ensure_env_file() {
    local env_file="$1"
    if [ ! -f "$ROOT_DIR/$env_file" ] && [ -n "$MAIN_WORKTREE" ] && [ "$MAIN_WORKTREE" != "$ROOT_DIR" ] \
        && [ -f "$MAIN_WORKTREE/$env_file" ]; then
        echo -e "${YELLOW}$env_file não existe nesta worktree, copiando de $MAIN_WORKTREE${NC}"
        cp "$MAIN_WORKTREE/$env_file" "$ROOT_DIR/$env_file"
    fi
}

load_env_file() {
    if [ -f "$1" ]; then
        set -a
        # shellcheck disable=SC1090
        source "$1"
        set +a
    fi
}

ensure_infra() {
    local running
    running=$(docker inspect -f '{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null || true)
    if [ "$running" != "true" ] || ! port_in_use "$REDIS_PORT"; then
        echo -e "${BLUE}Subindo postgres/redis do docker principal...${NC}"
        docker compose -f "$MAIN_WORKTREE/docker-compose.yml" --project-directory "$MAIN_WORKTREE" up -d db redis
    fi

    local attempts=0
    until docker exec "$DB_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do
        attempts=$((attempts + 1))
        if [ "$attempts" -ge 30 ]; then
            echo -e "${RED}Postgres não ficou pronto em 30s.${NC}"
            exit 1
        fi
        sleep 1
    done
}

# Na primeira vez, clona o banco do docker principal pra ter dados de verdade
# pra navegar (e as imagens de campanha que esses dados referenciam).
ensure_preview_db() {
    local exists main_exists
    exists=$(db_psql -tAc "SELECT 1 FROM pg_database WHERE datname='$PREVIEW_DB_NAME'")
    if [ "$exists" != "1" ]; then
        echo -e "${YELLOW}Criando banco de preview $PREVIEW_DB_NAME...${NC}"
        db_psql -qc "CREATE DATABASE \"$PREVIEW_DB_NAME\""

        main_exists=$(db_psql -tAc "SELECT 1 FROM pg_database WHERE datname='$MAIN_DB_NAME'")
        if [ "$main_exists" = "1" ]; then
            echo -e "${BLUE}Clonando dados de $MAIN_DB_NAME...${NC}"
            docker exec "$DB_CONTAINER" pg_dump -U postgres --no-owner --no-acl "$MAIN_DB_NAME" \
                | db_psql -q -d "$PREVIEW_DB_NAME" > /dev/null
        fi

        if [ -d "$MAIN_WORKTREE/backend/uploads" ] && [ "$MAIN_WORKTREE" != "$ROOT_DIR" ]; then
            mkdir -p "$ROOT_DIR/backend/uploads"
            cp -rn "$MAIN_WORKTREE/backend/uploads/." "$ROOT_DIR/backend/uploads/" || true
        fi
    fi

    echo -e "${BLUE}Aplicando migrations no banco de preview...${NC}"
    DATABASE_URL="$DATABASE_URL_PREVIEW" npm exec --workspace=backend -- prisma migrate deploy
}

cmd_start() {
    if [ -f "$STATE_FILE" ]; then
        # shellcheck disable=SC1090
        source "$STATE_FILE"
        if kill -0 "-${BACKEND_PID:-0}" 2>/dev/null || kill -0 "-${FRONTEND_PID:-0}" 2>/dev/null; then
            echo -e "${YELLOW}Preview já rodando nesta worktree:${NC}"
            echo -e "  Frontend: ${BLUE}http://${PREVIEW_HOST}:${FRONTEND_PORT}${NC}"
            echo -e "  Backend:  ${BLUE}http://${PREVIEW_HOST}:${BACKEND_PORT}${NC}"
            echo "Rode 'npm run preview:stop' antes de subir de novo."
            exit 0
        fi
        rm -f "$STATE_FILE"
    fi

    if ! command -v docker >/dev/null; then
        echo -e "${RED}docker não encontrado no PATH.${NC}"
        exit 1
    fi

    ensure_env_file backend/.env
    ensure_env_file frontend/.env

    if [ ! -d "$ROOT_DIR/node_modules" ]; then
        echo -e "${YELLOW}node_modules não existe nesta worktree. Rodando npm install...${NC}"
        npm install
    fi

    ensure_infra
    npm exec --workspace=backend -- prisma generate > /dev/null
    ensure_preview_db

    mkdir -p "$LOG_DIR"
    : > "$BACKEND_LOG"
    : > "$FRONTEND_LOG"

    FRONTEND_PORT=$(find_free_port "$FRONTEND_BASE_PORT")
    BACKEND_PORT=$(find_free_port "$BACKEND_BASE_PORT")
    local frontend_url="http://${PREVIEW_HOST}:${FRONTEND_PORT}"
    local backend_url="http://${PREVIEW_HOST}:${BACKEND_PORT}"

    echo -e "${BLUE}Subindo preview da worktree $(basename "$ROOT_DIR")...${NC}"

    # Cada processo carrega só o próprio .env e depois sobrescreve o que aponta
    # pro docker principal. Sem prisma studio: a porta 5555 é do docker.
    (
        cd "$ROOT_DIR/backend"
        load_env_file .env
        export PORT="$BACKEND_PORT" \
            NODE_ENV=development \
            DATABASE_URL="$DATABASE_URL_PREVIEW" \
            REDIS_URL="$REDIS_URL_PREVIEW" \
            CORS_ORIGIN="$frontend_url" \
            FRONTEND_URL="$frontend_url" \
            GOOGLE_CALLBACK_URL="${backend_url}/api/auth/google/callback" \
            EMAIL_ENABLED=false \
            ENABLE_EMAIL_WORKER=false
        exec setsid npx tsx watch src/index.ts > "$BACKEND_LOG" 2>&1 < /dev/null
    ) &
    BACKEND_PID=$!

    (
        cd "$ROOT_DIR/frontend"
        load_env_file .env
        unset INTERNAL_API_URL
        export NEXT_PUBLIC_API_URL="$backend_url" \
            NEXT_PUBLIC_SITE_URL="$frontend_url" \
            NEXT_TELEMETRY_DISABLED=1
        exec setsid npx next dev -H "$PREVIEW_HOST" -p "$FRONTEND_PORT" > "$FRONTEND_LOG" 2>&1 < /dev/null
    ) &
    FRONTEND_PID=$!

    cat > "$STATE_FILE" <<EOF
BACKEND_PID=$BACKEND_PID
FRONTEND_PID=$FRONTEND_PID
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
EOF

    echo -e "${GREEN}Preview no ar.${NC}"
    echo -e "  Frontend: ${BLUE}${frontend_url}${NC} (log: $FRONTEND_LOG)"
    echo -e "  Backend:  ${BLUE}${backend_url}${NC} (log: $BACKEND_LOG)"
    echo -e "  Banco:    ${BLUE}${PREVIEW_DB_NAME}${NC} (isolado do docker principal)"
    echo "Emails desligados no preview. Rode 'npm run preview:stop' quando terminar de validar."
}

cmd_stop() {
    if [ ! -f "$STATE_FILE" ]; then
        echo "Nenhum preview rodando nesta worktree."
        exit 0
    fi

    # shellcheck disable=SC1090
    source "$STATE_FILE"

    for pid in "${BACKEND_PID:-}" "${FRONTEND_PID:-}"; do
        if [ -n "$pid" ] && kill -0 "-$pid" 2>/dev/null; then
            kill -- "-$pid" 2>/dev/null || true
        fi
    done

    rm -f "$STATE_FILE"

    # O next dev reescreve o next-env.d.ts e gera um frontend/AGENTS.md; desfaz
    # pra não sujar o diff da branch.
    git checkout -- frontend/next-env.d.ts 2>/dev/null || true
    if ! git ls-files --error-unmatch frontend/AGENTS.md >/dev/null 2>&1 \
        && head -1 frontend/AGENTS.md 2>/dev/null | grep -q 'nextjs-agent-rules'; then
        rm -f frontend/AGENTS.md
    fi

    echo -e "${GREEN}Preview derrubado.${NC}"
}

# Apaga o banco de preview; o próximo start clona de novo do docker principal.
cmd_reset_db() {
    if [ -f "$STATE_FILE" ]; then
        echo -e "${RED}Preview rodando. Rode 'npm run preview:stop' antes.${NC}"
        exit 1
    fi
    ensure_infra
    db_psql -qc "DROP DATABASE IF EXISTS \"$PREVIEW_DB_NAME\""
    echo -e "${GREEN}Banco $PREVIEW_DB_NAME apagado.${NC}"
}

case "${1:-}" in
    start) cmd_start ;;
    stop) cmd_stop ;;
    reset-db) cmd_reset_db ;;
    *)
        echo "Uso: $0 {start|stop|reset-db}"
        exit 1
        ;;
esac
