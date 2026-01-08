# 📧 Guia de Configuração de Email

## 🚀 Início Rápido

### Opção 1: Gmail SMTP (Desenvolvimento - Mais Fácil)

**Passo a passo:**

1. **Ativar autenticação de 2 fatores no Google**
   - Acesse: https://myaccount.google.com/security
   - Ative "Verificação em duas etapas"

2. **Criar senha de app**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" → "Outro (nome personalizado)"
   - Digite: "Compra Coletiva"
   - Clique em "Gerar"
   - Copie a senha de 16 caracteres (sem espaços)

3. **Configurar no .env**
   ```bash
   EMAIL_PROVIDER=gmail
   # ou
   EMAIL_PROVIDER=auto  # tenta Resend primeiro, fallback Gmail

   GMAIL_USER=seu-email@gmail.com
   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop  # (cole aqui)
   ```

4. **Testar**
   ```bash
   docker-compose restart backend
   # Registre um novo usuário para testar email de boas-vindas
   ```

**Limitações do Gmail:**
- ✅ Grátis e fácil de configurar
- ✅ Ótimo para desenvolvimento
- ⚠️ Limite: 500 emails/dia
- ⚠️ Pode cair na caixa de spam
- ❌ **Email remetente não customizável** (sempre usa o email da conta Gmail)
- ✅ Nome remetente customizável (ex: "Compra Coletiva")
- ❌ Não ideal para produção

**IMPORTANTE:** O Gmail SMTP sempre usa o email da conta autenticada como remetente por questões de segurança. Você pode customizar apenas o **nome** que aparece ("Compra Coletiva"), mas o **email** sempre será o da conta Gmail configurada (ex: compra.coletiva.app@gmail.com). Para usar um email customizado como `noreply@compracoletiva.com`, você precisa configurar o Resend com seu domínio verificado.

---

### Opção 2: Resend (Produção - Recomendado)

**Passo a passo:**

1. **Criar conta grátis**
   - Acesse: https://resend.com/signup
   - Cadastre-se (grátis: 3.000 emails/mês)

2. **Verificar domínio (ou usar resend.dev)**

   **Para testes rápidos (sem domínio):**
   - Use `onboarding@resend.dev` como EMAIL_FROM_ADDRESS
   - Emails só chegarão para emails verificados na sua conta

   **Para produção (com domínio próprio):**
   - Vá em "Domains" → "Add Domain"
   - Adicione seu domínio (ex: `compracoletiva.com`)
   - Configure os registros DNS (MX, TXT, CNAME)
   - Aguarde verificação (~10 minutos)

3. **Criar API Key**
   - Acesse: https://resend.com/api-keys
   - Clique "Create API Key"
   - Nome: "Compra Coletiva Production"
   - Permissões: "Sending access"
   - Copie a chave (começa com `re_`)

4. **Configurar no .env**
   ```bash
   EMAIL_PROVIDER=resend
   # ou
   EMAIL_PROVIDER=auto  # tenta Resend primeiro, fallback Gmail

   RESEND_API_KEY=re_sua_chave_aqui

   # Se verificou domínio:
   EMAIL_FROM_ADDRESS=noreply@compracoletiva.com
   EMAIL_FROM_NAME=Compra Coletiva

   # Se usando resend.dev (testes):
   EMAIL_FROM_ADDRESS=onboarding@resend.dev
   EMAIL_FROM_NAME=Compra Coletiva
   ```

5. **Testar**
   ```bash
   docker-compose restart backend
   # Registre um novo usuário
   ```

**Vantagens do Resend:**
- ✅ 3.000 emails/mês grátis
- ✅ Escala facilmente ($20 = 50.000 emails)
- ✅ Deliverability excelente
- ✅ Dashboard com analytics
- ✅ Webhooks para tracking
- ✅ API moderna e confiável

---

## 🔧 Configuração Avançada

### Provider Auto (Recomendado)

```bash
EMAIL_PROVIDER=auto
```

**Comportamento:**
1. Tenta enviar via **Resend** (se `RESEND_API_KEY` configurado)
2. Se falhar, tenta via **Gmail** (se `GMAIL_USER` e `GMAIL_APP_PASSWORD` configurados)
3. Se ambos falharem, loga erro

**Vantagens:**
- ✅ Resiliência: fallback automático
- ✅ Desenvolvimento: use Gmail
- ✅ Produção: migre para Resend sem alterar código

---

## 📊 Variáveis de Ambiente Explicadas

```bash
# === OBRIGATÓRIAS ===
EMAIL_ENABLED=true                    # true/false - ativa/desativa sistema
EMAIL_PROVIDER=auto                   # auto/gmail/resend
EMAIL_FROM_ADDRESS=noreply@...        # Email remetente (APENAS Resend)
EMAIL_FROM_NAME="Compra Coletiva"     # Nome remetente (Gmail e Resend)

# === GMAIL (se usar) ===
GMAIL_USER=seu-email@gmail.com        # Seu email Gmail (será usado como remetente)
GMAIL_APP_PASSWORD=abcd efgh ijkl     # Senha de app (16 chars)
# NOTA: Gmail SEMPRE usa GMAIL_USER como email remetente (não usa EMAIL_FROM_ADDRESS)
# Apenas o nome (EMAIL_FROM_NAME) pode ser customizado

# === RESEND (se usar) ===
RESEND_API_KEY=re_xxxxx               # API key do Resend

# === REDIS (já configurado) ===
REDIS_HOST=redis                      # Hostname do Redis
REDIS_PORT=6379                       # Porta do Redis

# === OPCIONAIS ===
ENABLE_EMAIL_WORKER=true              # Inicia worker no backend
EMAIL_QUEUE_MAX_ATTEMPTS=3            # Tentativas de reenvio
EMAIL_QUEUE_RETRY_DELAY=5000          # Delay entre tentativas (ms)
EMAIL_QUEUE_RATE_LIMIT=10             # Máx emails por minuto
```

---

## 🧪 Testando o Sistema

### 1. Verificar configuração

```bash
# Ver logs do backend
docker-compose logs -f backend

# Procure por:
# ✅ Email system enabled (provider: auto)
# ✅ Redis connection successful
# ✅ Email worker started successfully
```

### 2. Testar email de boas-vindas

1. Acesse: http://localhost:5173
2. Clique em "Criar conta"
3. Preencha os dados
4. Clique em "Cadastrar"
5. **Verifique seu email!**

### 3. Testar email de reset de senha

1. Clique em "Esqueci minha senha"
2. Digite seu email
3. **Verifique seu email!**
4. Clique no link recebido

### 4. Testar notificações

1. Crie um grupo de compras
2. Faça um pedido
3. Marque como pago
4. **Verifique email de "Grupo pronto para enviar"!**

---

## 🐛 Solução de Problemas

### Emails não estão sendo enviados

**Verifique logs:**
```bash
docker-compose logs -f backend | grep -i email
```

**Checklist:**
- [ ] `EMAIL_ENABLED=true`
- [ ] Redis está rodando (`docker-compose ps`)
- [ ] Worker está ativo (veja logs: "Email worker started")
- [ ] Credenciais corretas no `.env`
- [ ] Backend foi reiniciado após alterar `.env`

### Gmail: "Username and Password not accepted"

**Soluções:**
1. Certifique-se de usar **senha de app**, não sua senha normal
2. Ative autenticação de 2 fatores primeiro
3. Remova espaços da senha de app
4. Tente gerar nova senha de app

### Resend: "API key is invalid"

**Soluções:**
1. Certifique-se que a chave começa com `re_`
2. Verifique se copiou a chave completa
3. Crie nova API key se necessário

### Emails caem no spam

**Gmail SMTP:**
- ⚠️ Normal em desenvolvimento
- Solução: marque como "não é spam" manualmente

**Resend:**
- ✅ Verifique seu domínio (registros DNS)
- ✅ Configure SPF, DKIM, DMARC
- ✅ Use EMAIL_FROM_ADDRESS do domínio verificado

---

## 📈 Monitoramento (Opcional)

### Ver fila de emails

Instale Bull Board (dashboard):
```bash
npm install --workspace=backend @bull-board/express
```

Acesse: http://localhost:3000/admin/queues

### Logs de envio

Todos os emails são logados na tabela `email_logs`:
```sql
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 🚀 Produção

### Checklist antes de deploy:

- [ ] Use `EMAIL_PROVIDER=resend`
- [ ] Configure domínio verificado no Resend
- [ ] Configure DNS (SPF, DKIM, DMARC)
- [ ] Remova credenciais do Gmail
- [ ] Configure webhooks do Resend
- [ ] Monitore fila com Bull Board
- [ ] Configure alertas de falha

### Variáveis mínimas para produção:

```bash
EMAIL_ENABLED=true
EMAIL_PROVIDER=resend
EMAIL_FROM_ADDRESS=noreply@seudominio.com
EMAIL_FROM_NAME=Compra Coletiva
RESEND_API_KEY=re_seu_production_key_aqui
REDIS_URL=redis://seu-redis-producao:6379
FRONTEND_URL=https://seudominio.com
```

---

## 💡 Dicas

### Desenvolvimento
- Use `EMAIL_PROVIDER=gmail` (mais fácil)
- Ou use `EMAIL_PROVIDER=auto` com Gmail configurado
- Teste com seu próprio email

### Staging
- Use `EMAIL_PROVIDER=auto`
- Configure ambos (Resend + Gmail)
- Teste deliverability

### Produção
- Use `EMAIL_PROVIDER=resend` (melhor performance)
- Domínio verificado
- Monitore com webhooks

---

## 📞 Suporte

- **Resend Docs**: https://resend.com/docs
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **Issue Tracker**: https://github.com/seu-repo/issues

---

**Pronto para enviar emails! 🎉**
