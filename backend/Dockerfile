# Multi-stage build para produção do backend

# Stage 1: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat postgresql-client

WORKDIR /app

# Copia package.json e prisma schema primeiro
COPY package*.json ./
COPY prisma ./prisma

# Instala dependências (postinstall automaticamente gera Prisma Client)
RUN npm install

# Garante que o Prisma Client está gerado (dupla verificação)
RUN npx prisma generate

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

# Copia scripts de manutenção e migrations
COPY scripts ./scripts

# Copia script de inicialização
COPY start.sh ./start.sh
RUN chmod +x start.sh


EXPOSE 3000

# Executa migrations e inicia o servidor
CMD ["sh", "start.sh"]
