# Multi-stage build para produção do backend

# Stage 1: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copia package.json
COPY package*.json ./
RUN npm install

# Copia o código fonte primeiro (exceto prisma)
COPY src ./src
COPY tsconfig.json ./
COPY start.sh ./

# Copia prisma separadamente para garantir que migrations venham junto
COPY prisma ./prisma

# Debug - verifica se migrations existem no builder
RUN echo "=== Debug: Checking prisma in builder stage ===" && \
    ls -la prisma/ && \
    ls -la prisma/migrations/ && \
    echo "=== Migrations found in builder ===" || echo "=== ERROR: Migrations not found in builder ==="

# Gera o Prisma Client
RUN npx prisma generate

# Build da aplicação TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copia package.json
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm install --omit=dev

# Instala Prisma CLI temporariamente para rodar migrations
RUN npm install prisma --save-dev

# Copia arquivos compilados do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copia prisma do builder (com migrations)
COPY --from=builder /app/prisma ./prisma

# Copia script de inicialização
COPY start.sh ./start.sh
RUN chmod +x start.sh

# Debug - verifica se migrations foram copiadas para produção
RUN echo "=== Debug: Checking prisma in production stage ===" && \
    ls -la prisma/ && \
    echo "Checking migrations directory:" && \
    ls -la prisma/migrations/ && \
    echo "=== Migrations found in production ===" || echo "=== ERROR: Migrations not found in production ==="

EXPOSE 3000

# Executa migrations e inicia o servidor
CMD ["sh", "start.sh"]
