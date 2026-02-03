# Deploy

Guia curto para deploy no Railway.

## Railway (recomendado)
1. Crie um projeto no Railway e conecte o repositório.
2. Crie os serviços: backend (usa `railway.json` na raiz e `backend/Dockerfile`), frontend (root `frontend`, usa `frontend/railway.json` e `frontend/Dockerfile`), PostgreSQL e Redis (opcional, para fila de emails).
3. Configure as variáveis de ambiente e faça deploy.

## Variáveis de ambiente

Backend (mínimo):
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=https://<frontend-domain>
JWT_SECRET=<gerar>
```

Backend (opcionais comuns):
```env
REDIS_URL=${{Redis.REDIS_URL}}
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://<backend-domain>/api/auth/google/callback
EMAIL_PROVIDER=resend|gmail|auto
RESEND_API_KEY=...
EMAIL_FROM_ADDRESS=...
EMAIL_FROM_NAME=Compra Coletiva
```

Frontend:
```env
NEXT_PUBLIC_API_URL=https://<backend-domain>
NEXT_PUBLIC_SITE_URL=https://<frontend-domain>
NODE_ENV=production
```

Observações:
- `NEXT_PUBLIC_*` é incorporado no build. Faça redeploy ao alterar.
- Prefira `${{Postgres.DATABASE_URL}}` para evitar problemas de conexão.
- Para Redis, use `${{Redis.REDIS_URL}}` (evita erro `NOAUTH`).

## Migrations e slugs
O `backend/start.sh` executa `prisma migrate deploy` e gera slugs automaticamente. Para rodar manualmente:
```bash
railway run --service backend npx prisma migrate deploy
railway run --service backend npx tsx scripts/generate-slugs-standalone.ts
```

## Imagens de campanhas (produção)
O backend usa S3 se configurado, senão salva localmente.

Opção 1: S3 (recomendado)
```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_S3_REGION=us-east-1
```

Opção 2: Railway Volume
- Crie um volume no serviço backend e monte em `/app/data`.
- Defina `UPLOAD_DIR=/app/data`.

## Google OAuth (resumo)
- Crie credenciais OAuth no Google Cloud Console.
- Autorize o redirect: `https://<backend-domain>/api/auth/google/callback`.
- Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_CALLBACK_URL` no backend.
- Garanta `CORS_ORIGIN` com a URL exata do frontend.

## Troubleshooting rápido
- 502/CORS: confirme `CORS_ORIGIN` e `NEXT_PUBLIC_API_URL`, depois redeploy.
- Redis `NOAUTH`: use `REDIS_URL=${{Redis.REDIS_URL}}` no backend.
- Imagens quebradas: configure S3 ou volume persistente.
- Healthcheck frontend: `/api/health` deve responder 200.
