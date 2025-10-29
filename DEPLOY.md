# Guia de Deploy - Railway

Este guia detalha como fazer o deploy da aplicação Compra Coletiva no Railway.

## Pré-requisitos

- Conta no [Railway](https://railway.app/)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Código commitado no repositório

## Passo a Passo

### 1. Criar Novo Projeto

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Clique em **"New Project"**
3. Escolha **"Deploy from GitHub repo"**
4. Selecione seu repositório

### 2. Adicionar Banco de Dados PostgreSQL

1. No projeto, clique em **"New"**
2. Selecione **"Database"**
3. Escolha **"PostgreSQL"**
4. O Railway criará automaticamente o banco

### 3. Configurar Variáveis de Ambiente

1. Clique no serviço da aplicação (não no PostgreSQL)
2. Vá em **"Variables"**
3. Adicione as seguintes variáveis:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=${{RAILWAY_PUBLIC_DOMAIN}}
```

**Importante**:
- `${{Postgres.DATABASE_URL}}` é uma referência automática ao PostgreSQL
- `${{RAILWAY_PUBLIC_DOMAIN}}` é o domínio público gerado pelo Railway

### 4. Configurar Build

O Railway detectará automaticamente o arquivo `railway.json` na raiz do projeto. Certifique-se de que ele está presente:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.production"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "sh -c 'cd backend && npx prisma migrate deploy && node dist/index.js'",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 5. Deploy

1. Faça commit das suas alterações
2. Push para o repositório
3. O Railway iniciará o deploy automaticamente
4. Acompanhe os logs em tempo real

### 6. Executar Migrations

As migrations do Prisma são executadas automaticamente no `startCommand`. Mas se precisar executá-las manualmente:

1. Vá em **"Settings"** do serviço
2. Clique em **"Deploy"**
3. Em **"Custom Start Command"**, temporariamente use:
```bash
sh -c 'cd backend && npx prisma migrate deploy && node dist/index.js'
```

### 7. Verificar Deploy

1. Acesse o domínio público fornecido pelo Railway
2. Teste a aplicação
3. Verifique os logs em caso de problemas

## Configurações Opcionais

### Domínio Customizado

1. No serviço, vá em **"Settings"**
2. Clique em **"Domains"**
3. Adicione seu domínio customizado
4. Configure os DNS conforme instruções do Railway
5. Atualize a variável `CORS_ORIGIN` com o novo domínio

### Escalonamento

Para escalonar a aplicação:

1. Vá em **"Settings"**
2. Em **"Deploy"** > **"Replicas"**
3. Ajuste o número de réplicas

**Nota**: O plano gratuito permite apenas 1 réplica.

### Monitoramento

Railway fornece:
- **Logs em tempo real**: Veja logs na aba "Deployments"
- **Métricas**: CPU, memória e rede na aba "Metrics"
- **Uptime monitoring**: Status da aplicação

## Troubleshooting

### Build Falha

**Problema**: Build do Docker falha

**Solução**:
1. Verifique os logs de build
2. Teste o build localmente: `docker build -f Dockerfile.production .`
3. Certifique-se de que todos os arquivos necessários estão commitados

### Database Connection Error

**Problema**: Aplicação não conecta ao banco

**Solução**:
1. Verifique se `DATABASE_URL` está configurada corretamente
2. Use a referência `${{Postgres.DATABASE_URL}}`
3. Reinicie o serviço

### Migrations Não Executam

**Problema**: Tabelas não são criadas

**Solução**:
1. Verifique o `startCommand` no `railway.json`
2. Execute migrations manualmente via Railway CLI:
```bash
railway run npx prisma migrate deploy
```

### CORS Error

**Problema**: Frontend não consegue acessar a API

**Solução**:
1. Verifique a variável `CORS_ORIGIN`
2. Use `${{RAILWAY_PUBLIC_DOMAIN}}` ou configure o domínio correto
3. Se usar domínio customizado, atualize a variável

## Railway CLI (Opcional)

Para desenvolvimento local conectado ao Railway:

```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Linkar projeto
railway link

# Executar comandos no ambiente Railway
railway run npm start

# Ver logs
railway logs

# Abrir shell no container
railway shell
```

## Custos

- **Plano Hobby (Gratuito)**:
  - $5 de crédito mensal
  - 500h de execução
  - 1GB RAM
  - 1GB storage

- **Plano Developer**:
  - $5/mês base
  - Uso adicional conforme demanda
  - Mais recursos disponíveis

## Boas Práticas

1. **Use variáveis de ambiente** para configurações sensíveis
2. **Configure logs** adequadamente para debugging
3. **Monitore métricas** regularmente
4. **Mantenha backups** do banco de dados
5. **Use domínio customizado** para produção
6. **Configure health checks** na aplicação

## Próximos Passos

Após deploy bem-sucedido:

1. Configure domínio customizado
2. Configure backups automáticos do PostgreSQL
3. Implemente monitoring e alertas
4. Configure CI/CD mais robusto
5. Implemente testes automatizados

## Suporte

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app/)
