# Comandos Docker - Guia de Uso

## Ambiente de Desenvolvimento vs Produção

### Desenvolvimento (Docker Compose - Local)
- Usa `Dockerfile.dev` para backend e frontend
- **Hot Reload ATIVADO**: Alterações no código são refletidas automaticamente
- Volumes montam o código fonte local nos containers
- Prisma Studio disponível em `localhost:5555`
- Ideal para desenvolvimento diário

### Produção (Railway)
- Usa `Dockerfile` (multi-stage build otimizado)
- Build estático do Next.js (standalone mode)
- Backend compilado para JavaScript
- Sem hot reload (código compilado)
- Otimizado para performance

## Diferença entre `docker-compose down` e `docker-compose down -v`

### `docker-compose down` (RECOMENDADO para desenvolvimento)
- Para e remove os **containers**
- Remove as **networks** criadas
- **PRESERVA** os volumes nomeados (postgres_data, backend_node_modules, etc.)
- **Use este comando** no dia a dia para desligar os serviços

```bash
docker-compose down
```

### `docker-compose down -v` (CUIDADO!)
- Para e remove os **containers**
- Remove as **networks** criadas
- **REMOVE TODOS OS VOLUMES** (incluindo dados do banco!)
- **Use apenas quando** quiser limpar completamente e começar do zero

```bash
docker-compose down -v
```

## Comandos Úteis

### Iniciar os serviços
```bash
# Inicia todos os serviços
npm run dev

# Ou diretamente
docker-compose up

# Em background (detached mode)
docker-compose up -d
```

### Parar os serviços (preservando volumes)
```bash
docker-compose down
```

### Reiniciar um serviço específico
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart db
```

### Ver logs
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Reconstruir containers (após mudanças no Dockerfile)
```bash
# Reconstruir todos
docker-compose up --build

# Reconstruir serviço específico
docker-compose up --build backend
```

### Executar comandos dentro do container
```bash
# Backend
docker exec compra-coletiva-backend npm install
docker exec compra-coletiva-backend npx prisma migrate dev
docker exec compra-coletiva-backend npx prisma studio

# Frontend
docker exec compra-coletiva-frontend npm install
```

### Limpar tudo (CUIDADO - remove volumes)
```bash
# Remove containers, networks E volumes
docker-compose down -v

# Remove também imagens
docker-compose down -v --rmi all
```

### Verificar volumes
```bash
# Listar volumes
docker volume ls

# Ver detalhes de um volume específico
docker volume inspect compra-coletiva_backend_node_modules
docker volume inspect compra-coletiva_postgres_data
```

### Remover volume específico (se necessário)
```bash
# Primeiro pare os containers
docker-compose down

# Remova o volume específico
docker volume rm compra-coletiva_backend_node_modules

# Reinicie para recriar
docker-compose up
```

## Volumes Nomeados do Projeto

Os seguintes volumes são **persistentes** e sobrevivem a `docker-compose down`:

1. **postgres_data**: Dados do banco PostgreSQL
2. **backend_node_modules**: Dependências do backend
3. **backend_dist**: Build do backend
4. **frontend_node_modules**: Dependências do frontend
5. **frontend_dist**: Build do frontend

## Hot Reload - Como Funciona

### Backend (Express + TypeScript)
- `tsx watch` monitora alterações em arquivos `.ts`
- Reinicia automaticamente o servidor quando detecta mudanças
- **Testado e funcionando**: Edite arquivos em `backend/src/` e veja as mudanças instantaneamente

### Frontend (Next.js)
- Next.js Dev Server com Fast Refresh
- Mudanças em componentes React são atualizadas **sem perder o estado**
- **Testado e funcionando**: Edite arquivos em `frontend/src/` e veja as mudanças no navegador

### Prisma Studio
- Acesse `http://localhost:5555` para gerenciar o banco de dados visualmente
- Inicia automaticamente junto com o backend no modo dev

### Variáveis de Ambiente para Hot Reload
O `docker-compose.yml` já está configurado com:
```yaml
environment:
  CHOKIDAR_USEPOLLING: "true"
  WATCHPACK_POLLING: "true"
```

Essas variáveis garantem que o hot reload funcione corretamente em containers Docker.

## Solução de Problemas Comuns

### Dependências não instaladas após `docker-compose down`
Isso **NÃO** deve mais acontecer com os volumes nomeados.
Se acontecer, execute:
```bash
docker exec compra-coletiva-backend npm install
docker exec compra-coletiva-frontend npm install
docker-compose restart backend frontend
```

### Banco de dados vazio após reiniciar
Se você usou `docker-compose down -v` por engano, o banco foi apagado.
Solução:
```bash
docker-compose up -d db
docker exec compra-coletiva-backend npx prisma migrate deploy
```

### Mudanças no package.json não aparecem
```bash
# Reinstale as dependências
docker exec compra-coletiva-backend npm install
docker-compose restart backend
```

### Mudanças no schema.prisma não aparecem
```bash
docker exec compra-coletiva-backend npx prisma generate
docker exec compra-coletiva-backend npx prisma migrate dev
docker-compose restart backend
```

### Hot Reload não está funcionando
1. **Verifique se os volumes estão montados corretamente**:
   ```bash
   docker-compose ps
   ```

2. **Verifique os logs para erros**:
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

3. **Reconstrua os containers**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

4. **Verifique as variáveis de ambiente** no `docker-compose.yml`:
   - `CHOKIDAR_USEPOLLING: "true"`
   - `WATCHPACK_POLLING: "true"`

### Porta já em uso
Se as portas 3000, 5173 ou 5432 já estiverem em uso:
```bash
# Windows - identificar processo usando a porta
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Parar containers e tentar novamente
docker-compose down
docker-compose up
```

## Fluxo Recomendado de Desenvolvimento

```bash
# Dia a dia - iniciar
npm run dev

# Dia a dia - parar (preserva tudo)
docker-compose down

# Adicionar nova dependência
docker exec compra-coletiva-backend npm install <pacote>
docker-compose restart backend

# Mudança no banco
docker exec compra-coletiva-backend npx prisma migrate dev --name <nome>
docker-compose restart backend

# Limpar e recomeçar do zero (usa com cuidado!)
docker-compose down -v
docker-compose up --build
```
