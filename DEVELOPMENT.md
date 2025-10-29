# Guia de Desenvolvimento

Este documento contém informações específicas para desenvolvimento local.

## Hot Reload Configurado ✅

O projeto está configurado com hot reload completo para desenvolvimento:

### Backend (tsx watch)
- **File watching**: Configurado via `CHOKIDAR_USEPOLLING=true`
- **Volume mapping**: Código local sincronizado com container
- Qualquer mudança em `backend/src/**/*.ts` recarrega automaticamente

### Frontend (Vite HMR)
- **Hot Module Replacement**: Ativado por padrão no Vite
- **Polling**: Configurado via `usePolling: true` no vite.config.ts
- Mudanças em componentes React atualizam instantaneamente no browser

## Como Funciona

### Volumes do Docker Compose

```yaml
volumes:
  - ./backend:/app          # Mapeia código local -> container
  - /app/node_modules       # Previne conflito com node_modules
  - /app/dist               # Ignora diretório de build
```

### Variáveis de Ambiente

```yaml
CHOKIDAR_USEPOLLING: "true"   # Força polling para detectar mudanças
WATCHPACK_POLLING: "true"     # Alternativa para webpack-based tools
```

## Testando Hot Reload

### Backend

1. Com o Docker rodando, edite qualquer arquivo em `backend/src/`
2. Salve o arquivo
3. Observe o log do container backend recarregando:
   ```
   compra-coletiva-backend | [tsx] restarting due to changes...
   compra-coletiva-backend | 🚀 Server running on port 3000
   ```

### Frontend

1. Com o Docker rodando, edite qualquer arquivo em `frontend/src/`
2. Salve o arquivo
3. O browser atualiza automaticamente (sem refresh completo)
4. Observe no log:
   ```
   compra-coletiva-frontend | [vite] hmr update /src/...
   ```

## Comandos Úteis

### Reiniciar Containers (sem rebuild)
```bash
docker-compose restart
```

### Rebuild Completo (após mudanças em package.json)
```bash
docker-compose down
docker-compose up --build
```

### Ver Logs em Tempo Real
```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend
```

### Executar Comandos nos Containers

```bash
# Backend - Instalar nova dependência
docker-compose exec backend npm install <pacote>

# Frontend - Instalar nova dependência
docker-compose exec frontend npm install <pacote>

# Backend - Prisma Studio
docker-compose exec backend npx prisma studio

# Backend - Criar migration
docker-compose exec backend npx prisma migrate dev --name <nome>
```

## Troubleshooting

### Hot Reload Não Funciona

**Problema**: Mudanças no código não são detectadas

**Soluções**:

1. **Verifique os logs** para erros:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Reinicie os containers**:
   ```bash
   docker-compose restart
   ```

3. **Rebuild se necessário**:
   ```bash
   docker-compose up --build
   ```

4. **Verifique permissões de arquivo** (Linux/Mac):
   ```bash
   ls -la backend/src
   ls -la frontend/src
   ```

### Mudanças em package.json

Quando você adiciona/remove dependências:

```bash
# Para os containers
docker-compose down

# Rebuild
docker-compose up --build
```

### Performance Lenta

Se o hot reload estiver lento, pode ser devido ao polling:

**Opção 1**: Reduzir intervalo de polling (frontend)

Edite `frontend/vite.config.ts`:
```ts
server: {
  watch: {
    usePolling: true,
    interval: 100  // Padrão é 100ms, pode aumentar para 300-500ms
  }
}
```

**Opção 2**: Usar host networking (apenas Linux)

Edite `docker-compose.yml`:
```yaml
backend:
  network_mode: "host"
  # Remove ports mapping quando usar host mode
```

## Estrutura de Desenvolvimento

```
compra-coletiva/
├── backend/
│   ├── src/              # ✏️ Edite aqui - hot reload ativo
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma # ✏️ Edite e rode migrate
│   └── package.json
├── frontend/
│   ├── src/              # ✏️ Edite aqui - HMR ativo
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── main.tsx
│   └── package.json
└── docker-compose.yml
```

## Workflow Recomendado

1. **Inicie os containers**:
   ```bash
   docker-compose up
   ```

2. **Abra seu editor** (VSCode, etc.)

3. **Edite código** normalmente

4. **Observe mudanças** aplicadas automaticamente:
   - Backend: Container reinicia
   - Frontend: Browser atualiza via HMR

5. **Após adicionar dependências**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

## Dicas de Produtividade

### VSCode

Instale extensões úteis:
- Prisma (syntax highlighting)
- ESLint
- Prettier
- TailwindCSS IntelliSense
- Docker

### Terminal Integrado

Configure múltiplos terminais:
1. Terminal 1: `docker-compose up` (logs)
2. Terminal 2: Comandos avulsos (prisma, npm, etc)
3. Terminal 3: Git

### Debugging

Para debug do backend com breakpoints:

1. Adicione ao `backend/package.json`:
```json
"scripts": {
  "dev:debug": "tsx watch --inspect=0.0.0.0:9229 src/index.ts"
}
```

2. Atualize `docker-compose.yml`:
```yaml
backend:
  command: npm run dev:debug
  ports:
    - "3000:3000"
    - "9229:9229"  # Debug port
```

3. Configure VSCode launch.json:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/backend",
  "remoteRoot": "/app"
}
```

## Performance Tips

- **Exclua node_modules** do seu editor de busca
- **Use .dockerignore** para evitar copiar arquivos desnecessários
- **Limite logs** se forem muito verbosos
- **Use Docker Desktop** para monitorar recursos

## Próximos Passos

- Configure ESLint + Prettier para code quality
- Adicione testes automatizados (Jest/Vitest)
- Configure CI/CD pipeline
- Adicione pre-commit hooks (Husky)
