# Multi-stage build para produção do frontend Next.js
# Otimizado para Railway

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências necessárias
RUN apk add --no-cache libc6-compat

# Argumentos de build para variáveis de ambiente do Next.js
# Railway passa essas variáveis automaticamente via Service Variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Copia package files
COPY package.json package-lock.json* ./

# Instala dependências
RUN npm install --legacy-peer-deps

# Copia o código fonte
COPY . .

# Build da aplicação Next.js
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production - Next.js standalone
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia arquivos públicos
COPY --from=builder /app/public ./public

# Copia build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia script de inicialização
COPY --from=builder --chown=nextjs:nodejs /app/start.sh ./start.sh
RUN chmod +x ./start.sh

USER nextjs

# Railway define a porta via variável de ambiente $PORT
# Exponha a porta padrão (será sobrescrita pelo Railway)
EXPOSE 3000

ENV HOSTNAME="0.0.0.0"

# Inicia o servidor Next.js usando o script de inicialização
# O script garante que a variável PORT do Railway seja usada
CMD ["./start.sh"]
