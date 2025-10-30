# Multi-stage build para produção do frontend

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copia package.json
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm install

# Copia o código fonte
COPY . .

# Build da aplicação (tsc + vite build)
RUN npm run build

# Verifica se o build foi criado
RUN ls -la /app/dist

# Stage 2: Production - Serve com nginx
FROM nginx:alpine

# Instala envsubst (já vem no nginx:alpine via gettext package)
RUN apk add --no-cache gettext

# Copia o build do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta (Railway usa a variável PORT)
EXPOSE 80

# Script para substituir variáveis de ambiente e iniciar nginx
CMD ["/bin/sh", "-c", "nginx -g 'daemon off;'"]
