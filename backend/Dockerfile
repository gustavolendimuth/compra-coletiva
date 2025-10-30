# Multi-stage build para produção do backend

# Stage 1: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copia package.json
COPY package*.json ./
RUN npm install

# Copia o código fonte e prisma schema
COPY . .

# Debug - verifica se migrations existem
RUN ls -la prisma/ && ls -la prisma/migrations/ || echo "Migrations not found!"

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

# Copia arquivos necessários do stage de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copia schema e migrations do Prisma diretamente da fonte
COPY prisma ./prisma

# Copia script de inicialização
COPY start.sh ./start.sh
RUN chmod +x start.sh

# Debug - verifica se migrations foram copiadas
RUN ls -la prisma/ && ls -la prisma/migrations/ || echo "Migrations not found in production stage!"

EXPOSE 3000

# Executa migrations e inicia o servidor
CMD ["sh", "start.sh"]
