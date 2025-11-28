# Multi-stage build para produção do backend

# Stage 1: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat postgresql-client

WORKDIR /app

# Copia package.json e prisma schema primeiro
COPY package*.json ./
COPY prisma ./prisma

# Debug - verifica o schema copiado
RUN echo "=== Checking schema.prisma content ===" && \
    cat prisma/schema.prisma | grep -A 15 "^model User"

# Instala dependências
RUN npm install

# Força geração do Prisma Client (garantir que roda mesmo se postinstall falhar)
RUN npx prisma generate

# Debug - verifica se migrations e Prisma Client existem
RUN echo "=== Debug: Checking prisma in builder stage ===" && \
    ls -la prisma/ && \
    ls -la prisma/migrations/ && \
    ls -la node_modules/@prisma/client/ && \
    ls -la node_modules/.prisma/client/ && \
    echo "=== Checking User model in generated types ===" && \
    grep -i "user" node_modules/.prisma/client/index.d.ts | head -20 && \
    echo "=== Checking if UserRole exists ===" && \
    grep -A 3 "UserRole" node_modules/.prisma/client/index.d.ts | head -10 && \
    echo "=== Migrations and Prisma Client found ===" || echo "=== ERROR: Missing files ==="

# Copia o código fonte
COPY src ./src
COPY tsconfig.json ./
COPY start.sh ./

# Build da aplicação TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat postgresql-client

WORKDIR /app

# Copia package.json e prisma schema
COPY package*.json ./
COPY --from=builder /app/prisma ./prisma

# Instala apenas dependências de produção (--ignore-scripts evita rodar postinstall)
RUN npm install --omit=dev --ignore-scripts

# Copia o Prisma Client já gerado do builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Instala Prisma CLI temporariamente para rodar migrations
RUN npm install prisma --save-dev

# Copia arquivos compilados do builder
COPY --from=builder /app/dist ./dist

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
