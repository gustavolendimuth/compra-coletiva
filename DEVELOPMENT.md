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

## Funcionalidades Implementadas

### Sistema de Autenticação

**Login/Registro:**
- Login com email/senha
- Google OAuth 2.0
- Sistema de sessões com JWT
- Proteção de rotas (middleware)
- Suporte a usuários legados (virtual users)

**Reset de Senha:**
- Token de recuperação via email
- Validação de token com expiração
- Interface de redefinição de senha

### Sistema de Feedback (NEW - Dec 2025)

**Para Usuários:**
- Botão flutuante em todas as páginas
- Modal de envio com tipos: Bug, Sugestão, Melhoria, Outro
- Feedback anônimo (com email) ou autenticado
- Link direto por email no rodapé
- Componente: `FeedbackModal.tsx`

**Para Administradores (API):**

```bash
# Listar feedbacks
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/feedback?status=PENDING

# Estatísticas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/feedback/stats

# Atualizar status
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS", "adminNotes": "Investigando"}' \
  http://localhost:3000/api/feedback/FEEDBACK_ID
```

Status disponíveis: `PENDING`, `IN_PROGRESS`, `RESOLVED`, `DISMISSED`

### Menu Mobile

- Menu full-screen com animações suaves
- Acessibilidade completa (ARIA labels, keyboard navigation)
- Backdrop com blur effect
- Componentes modulares (HamburgerButton, MobileMenu)

### Chat de Pedidos (Order Messages)

- Mensagens privadas entre cliente e criador da campanha
- Sistema de leitura/não lida
- Contador de mensagens não lidas
- Notificações em tempo real (Socket.IO)
- Componente: `OrderChat.tsx`

### Chat de Campanhas - Q&A Público (NEW - Dec 2025)

**Para Usuários:**
- Perguntas públicas visíveis a todos após resposta
- Edição de perguntas (janela de 15 minutos, apenas não respondidas)
- Visualização de suas próprias perguntas (respondidas e não respondidas)
- Interface com contador de caracteres (1000 para perguntas)
- Componente: `CampaignChat.tsx`

**Para Criadores:**
- Painel de moderação com abas (Pendentes/Respondidas)
- Visualização de spam score e fatores de risco
- Informações do remetente (idade da conta, pedidos na campanha)
- Resposta com auto-publicação (2000 caracteres)
- Opção de deletar spam
- Desktop notifications para novas perguntas
- Componente: `CampaignQuestionsPanel.tsx`

**Sistema Anti-Spam:**
- Pontuação 0-100 baseada em 8 fatores:
  1. URLs na mensagem (até 30 pontos)
  2. Maiúsculas excessivas (20 pontos)
  3. Caracteres repetidos (até 15 pontos)
  4. Conta nova (<24h) (15 pontos)
  5. Sem pedidos na campanha (10 pontos)
  6. Histórico de spam (20 pontos)
  7. Mensagens não respondidas (até 15 pontos)
  8. Palavras proibidas (30 pontos)

**Rate Limiting:**
- Global: 10 mensagens por hora
- Por campanha: 1 mensagem a cada 2 minutos
- Burst: 3 mensagens por minuto
- Retry-after calculado automaticamente

**Reputação de Usuários:**
- `messageCount`: Total de perguntas feitas
- `answeredCount`: Total de respostas dadas (criadores)
- `spamScore`: Pontuação de risco (0-100)
- `isBanned`: Flag para banir usuários
- Score reduzido quando perguntas são respondidas

### Sistema de Notificações (NEW - Dec 2025)

**Tipos de Notificações:**
- `CAMPAIGN_READY_TO_SEND`: Todos os pedidos pagos, pronto para enviar ao fornecedor
- `CAMPAIGN_STATUS_CHANGED`: Status da campanha alterado
- `CAMPAIGN_ARCHIVED`: Campanha arquivada automaticamente

**Funcionalidades:**
- Notificações em tempo real via Socket.IO
- Contador visual de não lidas
- Metadata com detalhes (campaignId, campaignName)
- Marcar como lida e deletar
- Auto-criação quando condições atendidas

**Triggers Automáticos:**
- Campanha CLOSED + todos pedidos pagos → notificação READY_TO_SEND
- Campanha SENT + todos pedidos pagos → auto-archive + notificação CAMPAIGN_ARCHIVED
- Campanha ARCHIVED + pedido não pago → auto-unarchive + notificação STATUS_CHANGED

### Automação de Status de Campanhas (NEW - Dec 2025)

**CampaignStatusService:**
- Auto-arquivamento: SENT → ARCHIVED quando todos os pedidos estão pagos
- Auto-reversão: ARCHIVED → SENT quando algum pedido é marcado como não pago
- Emite eventos Socket.IO para notificar clientes conectados
- Integrado com NotificationService

**Condições de Arquivamento:**
1. Status deve ser SENT
2. Pelo menos 1 pedido na campanha
3. TODOS os pedidos marcados como pagos (`isPaid = true`)

**Condições de Reversão:**
1. Status deve ser ARCHIVED
2. Pelo menos 1 pedido na campanha
3. PELO MENOS UM pedido não pago (`isPaid = false`)

### Segurança XSS (NEW - Dec 2025)

**Sanitização de Conteúdo:**
- Utility: `frontend/src/lib/sanitize.ts`
- Usa DOMPurify para prevenir XSS attacks
- Funções:
  - `sanitizeText(text)`: Escapa HTML, preserva quebras de linha
  - `sanitizeHtml(html)`: Permite apenas tags seguras (b, i, em, strong, u, br, p, span)

**Aplicado em:**
- Mensagens de campanhas (perguntas e respostas)
- Mensagens de pedidos
- Descrições de campanhas/produtos
- Feedback de usuários

### Real-Time Features (Socket.IO)

**Eventos Disponíveis:**
- `campaign-question-received`: Nova pergunta em campanha
- `campaign-message-published`: Pergunta respondida e publicada
- `campaign-message-edited`: Pergunta editada
- `campaign-message-deleted`: Pergunta deletada (spam)
- `campaign-updated`: Status de campanha alterado
- `notification-created`: Nova notificação para usuário
- `order-chat-message`: Mensagem privada em pedido

**Rooms:**
- `user:{userId}`: Notificações específicas do usuário
- `campaign:{campaignId}`: Updates de campanha específica
- `order:{orderId}`: Chat de pedido específico

## Próximos Passos

- Configure ESLint + Prettier para code quality
- Adicione testes automatizados (Jest/Vitest)
- Configure CI/CD pipeline
- Adicione pre-commit hooks (Husky)
- **Interface web de admin** para gerenciar feedbacks visualmente
- **Pagination** para lista de mensagens/notificações
- **Email notifications** para perguntas respondidas
- **Push notifications** (web/mobile)
