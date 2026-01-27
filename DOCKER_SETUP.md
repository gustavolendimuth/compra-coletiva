# Docker Setup - Desenvolvimento e Produção

## 📋 Visão Geral

Este projeto utiliza **configurações Docker diferentes** para desenvolvimento local e produção (Railway):

| Ambiente | Arquivos | Hot Reload | Otimização |
|----------|----------|------------|------------|
| **Desenvolvimento (Local)** | `docker-compose.yml` + `Dockerfile.dev` | ✅ Sim | ❌ Não |
| **Produção (Railway)** | `Dockerfile` apenas | ❌ Não | ✅ Sim |

---

## 🚀 Desenvolvimento Local (Docker Compose)

### Iniciar Ambiente Completo

```bash
# Iniciar todos os serviços (PostgreSQL, Redis, Backend, Frontend)
docker-compose up

# Ou em background
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Acessar Aplicação

- **Frontend (Next.js)**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Hot Reload Configurado ✅

#### Backend (Express + TypeScript)
- **Ferramenta**: `tsx watch`
- **Funciona**: Edite arquivos em `backend/src/` e veja mudanças instantaneamente
- **Reinício**: Automático quando detecta alterações em `.ts`

#### Frontend (Next.js)
- **Ferramenta**: Next.js Dev Server + Fast Refresh
- **Funciona**: Edite arquivos em `frontend/src/` e veja no navegador
- **Preserva Estado**: Mudanças em componentes React não perdem o estado

### Configurações de Hot Reload

O `docker-compose.yml` já inclui as variáveis necessárias:

```yaml
environment:
  CHOKIDAR_USEPOLLING: "true"   # Para tsx watch
  WATCHPACK_POLLING: "true"     # Para Next.js/Webpack
```

### Volumes Montados

```yaml
backend:
  volumes:
    - ./backend:/app              # Código fonte
    - /app/node_modules           # Isolado (não sobrescreve)
    - /app/dist                   # Build temporário

frontend:
  volumes:
    - ./frontend:/app             # Código fonte
    - /app/node_modules           # Isolado
    - /app/.next                  # Cache do Next.js
```

### Parar Serviços

```bash
# Parar E PRESERVAR volumes (dados do banco, node_modules)
docker-compose down

# Parar E REMOVER tudo (CUIDADO - apaga banco!)
docker-compose down -v
```

---

## 🏭 Produção (Railway)

### Build de Produção

Railway usa os `Dockerfile` (sem `.dev`):

#### Backend (`backend/Dockerfile`)
- **Multi-stage build**
- **Stage 1 (builder)**: Compila TypeScript → JavaScript
- **Stage 2 (runner)**: Imagem mínima apenas com dist/
- **Otimizações**:
  - Apenas dependências de produção
  - Prisma Client pré-gerado
  - Node.js slim
  - Migrations automáticas no start.sh

#### Frontend (`frontend/Dockerfile`)
- **Multi-stage build**
- **Stage 1 (builder)**: Build do Next.js (standalone mode)
- **Stage 2 (runner)**: Servidor Next.js otimizado
- **Otimizações**:
  - Output standalone (sem dependências desnecessárias)
  - Static assets otimizados
  - Usuário não-root (segurança)
  - Porta dinâmica via $PORT (Railway)

### Variáveis de Ambiente (Railway)

Railway passa automaticamente:

```bash
# Backend
PORT=3000                           # Porta do Railway
DATABASE_URL=postgresql://...       # Postgres do Railway
REDIS_URL=redis://...               # Redis do Railway
GOOGLE_CLIENT_ID=...                # OAuth
GOOGLE_CALLBACK_URL=https://...     # URL de produção

# Frontend
NEXT_PUBLIC_API_URL=https://...     # URL do backend
NEXT_PUBLIC_SITE_URL=https://...    # URL do frontend
```

### Deploy

```bash
# Railway detecta automaticamente o Dockerfile
# E faz build e deploy ao fazer push para main
git push origin main
```

---

## 🔧 Comandos Úteis

### Reconstruir Imagens

```bash
# Reconstruir após mudanças no Dockerfile.dev
docker-compose up --build

# Reconstruir apenas backend
docker-compose up --build backend
```

### Executar Comandos no Container

```bash
# Backend
docker exec -it compra-coletiva-backend sh
docker exec compra-coletiva-backend npm install <pacote>
docker exec compra-coletiva-backend npx prisma migrate dev
docker exec compra-coletiva-backend npx prisma studio

# Frontend
docker exec -it compra-coletiva-frontend sh
docker exec compra-coletiva-frontend npm install <pacote>
```

### Logs em Tempo Real

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Reiniciar Serviço Específico

```bash
docker-compose restart backend
docker-compose restart frontend
```

---

## 🐛 Solução de Problemas

### Hot Reload não funciona

1. **Verifique os logs**:
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

2. **Reconstrua os containers**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

3. **Verifique se as variáveis estão configuradas**:
   - `CHOKIDAR_USEPOLLING: "true"`
   - `WATCHPACK_POLLING: "true"`

### Dependências não instaladas

```bash
# Backend
docker exec compra-coletiva-backend npm install
docker-compose restart backend

# Frontend
docker exec compra-coletiva-frontend npm install
docker-compose restart frontend
```

### Banco de dados vazio

Se você usou `docker-compose down -v` por engano:

```bash
docker-compose up -d db
docker exec compra-coletiva-backend npx prisma migrate deploy
```

### Porta já em uso

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Linux/Mac
lsof -i :3000
lsof -i :5173

# Matar processo ou mudar porta no docker-compose.yml
```

### Next.js não compila

```bash
# Limpar cache do Next.js
docker exec compra-coletiva-frontend rm -rf .next
docker-compose restart frontend
```

---

## 📁 Estrutura de Arquivos Docker

```
compra-coletiva/
├── docker-compose.yml          # Orquestração (dev)
├── backend/
│   ├── Dockerfile              # Produção (Railway)
│   ├── Dockerfile.dev          # Desenvolvimento (hot reload)
│   ├── .dockerignore
│   └── start.sh                # Script de inicialização
├── frontend/
│   ├── Dockerfile              # Produção (Railway)
│   ├── Dockerfile.dev          # Desenvolvimento (hot reload)
│   ├── .dockerignore
│   └── start.sh                # Script de inicialização
└── DOCKER_COMMANDS.md          # Guia de comandos
```

---

## ✅ Checklist de Desenvolvimento

- [ ] `docker-compose up` inicia todos os serviços
- [ ] Hot reload funciona no backend (edite arquivo .ts)
- [ ] Hot reload funciona no frontend (edite componente React)
- [ ] Prisma Studio acessível em localhost:5555
- [ ] Dados do banco persistem após `docker-compose down`
- [ ] Logs aparecem com `docker-compose logs -f`

## ✅ Checklist de Produção (Railway)

- [ ] Variáveis de ambiente configuradas no Railway
- [ ] `Dockerfile` (sem .dev) build com sucesso
- [ ] Backend executa migrations automaticamente
- [ ] Frontend serve com Next.js standalone
- [ ] HTTPS configurado automaticamente pelo Railway
- [ ] Healthcheck responde corretamente

---

## 📚 Mais Informações

- [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md) - Comandos detalhados
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Guia de desenvolvimento
- [README.md](./README.md) - Visão geral do projeto
