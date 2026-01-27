# Multi-stage build para produção do frontend (Next.js)

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copia package.json
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Argumentos de build para variáveis de ambiente do Next.js
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Copia package.json
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm ci

# Copia o código fonte
COPY . .

# Desabilita telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Build da aplicação
RUN npm run build

# Stage 3: Production - Node.js runner
FROM node:20-alpine AS runner
WORKDIR /app

# Define ambiente de produção
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos necessários do build
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Muda para usuário não-root
USER nextjs

# Expõe a porta
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Inicia o servidor Next.js
CMD ["node", "server.js"]
