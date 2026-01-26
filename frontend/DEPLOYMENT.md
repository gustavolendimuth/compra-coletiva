# Guia de Deploy - Frontend Next.js

## Deploy no Railway

### Configuração Atual

O frontend está configurado para deploy no Railway usando:
- **Build**: Dockerfile multi-stage
- **Output**: Next.js standalone
- **Porta**: Dinâmica (fornecida pelo Railway via `$PORT`)

### Problema Resolvido: Healthcheck Timeout

**Sintoma**: Build completo, mas healthcheck falha com "service unavailable"

**Causas identificadas**:
1. Dockerfile estava configurado para Vite + nginx (porta 80) ao invés de Next.js (porta dinâmica)
2. O nginx serve conteúdo estático e não responde corretamente ao healthcheck do Railway
3. O Next.js standalone precisa usar a porta fornecida via variável `$PORT`

**Solução**:
1. Removida a variável `ENV PORT=3000` hardcoded do Dockerfile
2. Criado script `start.sh` que lê `$PORT` dinamicamente
3. CMD alterado para usar `./start.sh` ao invés de `node server.js` diretamente

### Variáveis de Ambiente Necessárias

Configure no Railway (Service Variables):

```env
# API Backend URL (obrigatória)
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app

# Site URL (obrigatória para SEO e Open Graph)
NEXT_PUBLIC_SITE_URL=https://seu-frontend.railway.app
```

**Importante**:
- NÃO configure `PORT` manualmente - o Railway fornece automaticamente
- Use URLs completas SEM barra final (ex: `https://api.example.com`)
- Use protocol handler automático: localhost usa `http://`, produção usa `https://`

### Estrutura do Dockerfile

```dockerfile
# Stage 1: Builder
- Instala dependências com --legacy-peer-deps
- Recebe ARGs para variáveis NEXT_PUBLIC_*
- Build com output standalone

# Stage 2: Runner
- Copia apenas standalone + static + public
- Copia script start.sh
- Executa como usuário não-root (nextjs)
- CMD ["./start.sh"] para inicialização dinâmica
```

### Healthcheck

Configurado em `railway.json`:
- **Path**: `/`
- **Timeout**: 100 segundos
- **Política de restart**: ON_FAILURE (max 10 tentativas)

### Verificação de Deploy

Após o deploy, verifique:

1. **Build**: Deve completar em ~10-15 segundos
2. **Healthcheck**: Deve passar em 1-2 tentativas (primeira sempre falha enquanto inicializa)
3. **Logs**: Deve mostrar "Starting Next.js on port XXXX"
4. **Acesso**: Deve responder em `https://seu-dominio.railway.app/`

### Troubleshooting

**Build falha com "npm install"**:
- Verifique se `package-lock.json` existe
- Use flag `--legacy-peer-deps` (já incluído)

**Healthcheck timeout**:
- Verifique se `start.sh` está executável (`chmod +x`)
- Verifique logs para mensagens de erro
- Confirme que Railway está definindo `$PORT`

**Página não carrega**:
- Verifique `NEXT_PUBLIC_API_URL` nas variáveis
- Verifique console do browser para erros CORS
- Confirme que backend está acessível

**Erro 404 na raiz**:
- Verificar se `src/app/(main)/page.tsx` existe
- Verificar build standalone em `.next/standalone`

**Resquícios do Vite**:
- ✅ Removido `vite-env.d.ts`
- ✅ Removido `nginx.conf`
- ✅ Variáveis de ambiente migradas (VITE_* → NEXT_PUBLIC_*)
- ✅ Vitest mantido apenas para testes (vitest.config.ts é válido)
- ✅ Build Next.js standalone funcionando corretamente

### Comandos Úteis

```bash
# Build local para testar
npm run build

# Testar standalone localmente
cd .next/standalone
PORT=3000 node server.js

# Ver estrutura do build
ls -R .next/standalone
```

### Recursos

- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/next-config-js/output)
- [Railway Docs](https://docs.railway.app/)
- [Railway Healthchecks](https://docs.railway.app/deploy/healthchecks)
