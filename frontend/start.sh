#!/bin/sh
# Script de inicialização para Railway
# Garante que o Next.js use a porta fornecida pelo Railway

# Railway fornece $PORT, use-a ou fallback para 3000
export PORT=${PORT:-3000}
export HOSTNAME="0.0.0.0"

echo "Starting Next.js on port $PORT"
node server.js
