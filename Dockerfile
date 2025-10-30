# Multi-stage build para produção

# Stage 1: Build Backend
FROM node:20-alpine AS backend-builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
# Copia package.json raiz (workspaces)
COPY package*.json ./
# Copia package.json dos workspaces
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install --workspace=backend --include-workspace-root
WORKDIR /app/backend
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# Stage 2: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Argumentos de build para variáveis de ambiente do Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copia package.json raiz (workspaces)
COPY package*.json ./
# Copia package.json dos workspaces
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install --workspace=frontend --include-workspace-root
WORKDIR /app/frontend
COPY frontend/ ./
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
# Copia package.json raiz (workspaces)
COPY package*.json ./
# Copia package.json dos workspaces
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install --workspace=backend --include-workspace-root --omit=dev
WORKDIR /app/backend

# Instala Prisma CLI para rodar migrations
RUN npm install prisma --save-dev

# Copia arquivos necessários do backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/node_modules/.prisma /app/node_modules/.prisma

# Copia schema e migrations do Prisma
COPY --from=backend-builder /app/backend/prisma/schema.prisma ./prisma/
COPY --from=backend-builder /app/backend/prisma/migrations ./prisma/migrations

# Copia build do frontend
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copia script de inicialização
COPY backend/start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 3000

# Executa migrations e inicia o servidor
CMD ["sh", "start.sh"]
