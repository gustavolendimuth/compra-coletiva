# Comandos Docker - Guia de Uso

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
