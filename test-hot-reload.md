# Teste de Hot Reload - Docker Compose

## 🧪 Como Testar o Hot Reload

### Pré-requisitos

1. Certifique-se que o Docker Desktop está rodando
2. Execute `docker-compose up` na raiz do projeto

---

## ✅ Teste 1: Backend (Express + TypeScript)

### Passo a Passo

1. **Inicie os serviços**:
   ```bash
   docker-compose up
   ```

2. **Acesse o backend**:
   - Abra o navegador em http://localhost:3000
   - Ou use: `curl http://localhost:3000`

3. **Edite um arquivo de rota**:
   - Abra `backend/src/routes/auth.ts`
   - Adicione um console.log no início de qualquer rota:
     ```typescript
     router.post('/register', async (req: Request, res: Response) => {
       console.log('🔥 HOT RELOAD TESTE - Register route called');
       // ... resto do código
     });
     ```

4. **Observe os logs**:
   ```bash
   docker-compose logs -f backend
   ```

   Você deve ver algo como:
   ```
   backend  | Restarting due to changes...
   backend  | Server started on port 3000
   ```

5. **Teste a mudança**:
   - Faça uma requisição para a rota modificada
   - Veja o console.log aparecer nos logs

### ✅ Resultado Esperado

- Servidor reinicia automaticamente (2-3 segundos)
- Console.log aparece nos logs ao chamar a rota
- **NENHUM** `docker-compose restart` necessário

---

## ✅ Teste 2: Frontend (Next.js)

### Passo a Passo

1. **Inicie os serviços** (se ainda não estiver rodando):
   ```bash
   docker-compose up
   ```

2. **Acesse o frontend**:
   - Abra http://localhost:5173 no navegador

3. **Edite um componente visível**:
   - Abra `frontend/src/app/page.tsx`
   - Adicione ou modifique algum texto:
     ```tsx
     <h1 className="text-3xl font-bold">
       🔥 HOT RELOAD TESTE - Compra Coletiva
     </h1>
     ```

4. **Observe o navegador**:
   - A página deve atualizar **automaticamente**
   - **SEM** refresh completo da página
   - O emoji 🔥 deve aparecer

5. **Verifique os logs** (opcional):
   ```bash
   docker-compose logs -f frontend
   ```

   Você verá:
   ```
   frontend | Compiled client and server successfully
   frontend | ○ Compiling / ...
   frontend | ✓ Compiled in XXXms
   ```

### ✅ Resultado Esperado

- Componente atualiza **instantaneamente** (< 1 segundo)
- Fast Refresh preserva o estado do React
- **NENHUM** refresh completo da página
- **NENHUM** `docker-compose restart` necessário

---

## ✅ Teste 3: Prisma Schema

### Passo a Passo

1. **Edite o schema do Prisma**:
   - Abra `backend/prisma/schema.prisma`
   - Adicione um campo de teste em algum modelo:
     ```prisma
     model User {
       // ... campos existentes
       hotReloadTest String? @map("hot_reload_test")
     }
     ```

2. **Execute migration dentro do container**:
   ```bash
   docker exec compra-coletiva-backend npx prisma migrate dev --name test_hot_reload
   ```

3. **Gere o Prisma Client**:
   ```bash
   docker exec compra-coletiva-backend npx prisma generate
   ```

4. **Reinicie o backend**:
   ```bash
   docker-compose restart backend
   ```

5. **Verifique no Prisma Studio**:
   - Acesse http://localhost:5555
   - Abra o modelo `User`
   - Veja o novo campo `hotReloadTest`

### ✅ Resultado Esperado

- Migration executada com sucesso
- Novo campo visível no banco de dados
- Prisma Client atualizado

---

## ❌ Problemas Comuns

### Backend não reinicia automaticamente

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique `docker-compose.yml`:
   ```yaml
   environment:
     CHOKIDAR_USEPOLLING: "true"
     WATCHPACK_POLLING: "true"
   ```

2. Reconstrua os containers:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Frontend não atualiza no navegador

**Causa 1**: Cache do navegador

**Solução**:
- Hard refresh: `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)

**Causa 2**: Next.js não está em modo dev

**Solução**:
1. Verifique os logs:
   ```bash
   docker-compose logs frontend
   ```

2. Deve ver:
   ```
   ▲ Next.js 14.x.x
   - Local:        http://localhost:5173
   ✓ Ready in XXXms
   ```

### Mudanças demoram muito para aparecer

**Causa**: Windows pode ter problemas com file watching em volumes Docker

**Solução**:
1. Use WSL2 (recomendado)
2. Ou aumente o timeout de polling:
   ```yaml
   environment:
     CHOKIDAR_USEPOLLING: "true"
     CHOKIDAR_INTERVAL: 1000  # 1 segundo
   ```

---

## 📊 Tabela de Tempos Esperados

| Ação | Tempo Esperado | Hot Reload |
|------|----------------|------------|
| Editar arquivo .ts (backend) | 2-3 segundos | ✅ Sim |
| Editar componente React (frontend) | < 1 segundo | ✅ Sim |
| Adicionar dependência (npm install) | 10-30 segundos | ❌ Requer restart |
| Migration do Prisma | 5-10 segundos | ❌ Requer restart |
| Mudar .env | Instantâneo | ❌ Requer restart |

---

## 🎯 Conclusão

Se todos os testes acima funcionarem, seu ambiente Docker está **corretamente configurado** para desenvolvimento com hot reload!

### ✅ Checklist Final

- [ ] Backend reinicia ao editar arquivos .ts
- [ ] Frontend atualiza instantaneamente ao editar componentes
- [ ] Logs aparecem em tempo real com `docker-compose logs -f`
- [ ] Não é necessário `docker-compose restart` para mudanças de código
- [ ] Prisma Studio funciona em localhost:5555

### 📝 Observações

- **Hot reload = Mudanças de código**
- **Restart manual = Mudanças em dependências, .env, schema.prisma**
- **Rebuild = Mudanças em Dockerfile.dev**
