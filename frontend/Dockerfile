# Multi-stage build para produção do frontend

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copia package.json
COPY package*.json ./
RUN npm install

# Copia o código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage 2: Production - Serve com nginx
FROM nginx:alpine

# Copia o build do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
