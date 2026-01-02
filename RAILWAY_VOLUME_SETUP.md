# 📦 Railway Volume Setup Guide

## Configuração de Volume Persistente no Railway

Este guia mostra como configurar um volume persistente no Railway para armazenar imagens de campanhas sem precisar configurar AWS S3.

---

## 🎯 Quando Usar Volumes

**Use volumes se**:
- ✅ Você quer começar rápido sem configurar S3
- ✅ Seu app tem baixo tráfego (single instance)
- ✅ Você não precisa de CDN global
- ✅ Está em fase de desenvolvimento/testes

**Use S3 se** (recomendado para produção):
- ✅ Seu app tem alto tráfego
- ✅ Você precisa escalar horizontalmente (múltiplas instâncias)
- ✅ Você quer CDN global (baixa latência)
- ✅ Você quer backups automáticos

---

## 📋 Passo a Passo

### Passo 1: Criar Volume no Railway

1. Acesse o [Railway Dashboard](https://railway.app/)
2. Vá para o seu projeto
3. Clique no serviço **Backend**
4. Vá para a aba **Settings**
5. Role até a seção **Volumes**
6. Clique em **New Volume**

### Passo 2: Configurar o Volume

Configure com os seguintes valores:

- **Mount Path**: `/app/data`
  - ⚠️ **IMPORTANTE**: Use exatamente `/app/data`
  - Este é o path onde o volume será montado dentro do container

- **Size**: `1 GB` (ou conforme sua necessidade)
  - Sugestões:
    - `512 MB` - Protótipos/testes (~50-100 imagens)
    - `1 GB` - Apps pequenos (~200-400 imagens)
    - `5 GB` - Apps médios (~1000-2000 imagens)
    - `10 GB` - Apps grandes (~4000-8000 imagens)

Clique em **Add** para criar o volume.

### Passo 3: Configurar Variável de Ambiente

1. Ainda no serviço **Backend**
2. Vá para a aba **Variables**
3. Clique em **New Variable**
4. Adicione:

```
UPLOAD_DIR=/app/data
```

5. Clique em **Add**

### Passo 4: Redeploy

1. Vá para a aba **Deployments**
2. Clique em **Deploy** (canto superior direito)
3. OU faça um novo push para o repositório

### Passo 5: Verificar Configuração

Após o deploy, verifique nos logs:

```
📁 Serving uploads from: /app/data
📁 Created uploads directory: /app/data/campaigns
✅ Persistent volume configured: /app/data
💡 Tip: Consider S3 for better scalability and CDN benefits
```

Se ver isso, **está funcionando!** ✅

---

## ✅ Testando o Volume

### 1. Upload de Imagem

1. Faça upload de uma nova imagem em uma campanha
2. Verifique nos logs do Railway:
   ```
   ✅ Image saved locally: /uploads/campaigns/1234567890-image.jpg
   ```

### 2. Teste de Persistência

1. **Faça um novo deploy** (ou restart do serviço)
2. **Acesse a campanha** com a imagem
3. **Verifique se a imagem ainda aparece**

Se a imagem continuar visível após o deploy, **o volume está funcionando!** 🎉

---

## 🔧 Troubleshooting

### Problema: Imagens Desaparecem Após Deploy

**Causa**: Volume não foi configurado corretamente

**Solução**:
1. Verifique se o volume existe em **Settings → Volumes**
2. Verifique se **Mount Path** é exatamente `/app/data`
3. Verifique se variável `UPLOAD_DIR=/app/data` está configurada
4. Redeploy o serviço

### Problema: Erro "ENOSPC: no space left on device"

**Causa**: Volume está cheio

**Solução**:
1. Vá em **Settings → Volumes**
2. Aumente o tamanho do volume
3. Redeploy

### Problema: Performance Lenta

**Causa**: Volumes podem ser mais lentos que S3 + CDN

**Solução**:
- Considere migrar para S3 para melhor performance
- S3 tem CDN global com baixa latência

---

## 📊 Volumes vs S3

| Característica | Railway Volume | AWS S3 |
|---------------|----------------|---------|
| **Setup** | Rápido (5 min) | Médio (15-30 min) |
| **Custo** | Incluído no Railway | ~$0.02/mês (100 imagens) |
| **Performance** | Boa | Excelente (CDN global) |
| **Escalabilidade** | Limitada (single instance) | Ilimitada |
| **Backups** | Manual | Automático (versionamento) |
| **CDN** | ❌ Não | ✅ Sim |
| **Multi-região** | ❌ Não | ✅ Sim |

---

## 🔄 Migração Volume → S3

Se você começou com volumes e quer migrar para S3:

### Passo 1: Configurar S3

Siga o guia: [RAILWAY_IMAGE_STORAGE_FIX.md](RAILWAY_IMAGE_STORAGE_FIX.md)

### Passo 2: Fazer Upload das Imagens para S3

Você tem duas opções:

**Opção A: Manual** (recomendado para poucas imagens)
1. Faça upload manual das imagens nas campanhas
2. O sistema salvará automaticamente no S3

**Opção B: Script de Migração** (para muitas imagens)
```bash
# Conectar ao container do Railway via terminal
# Copiar arquivos do volume para S3 usando AWS CLI
aws s3 sync /app/data/campaigns s3://seu-bucket/campaigns/ --acl public-read
```

### Passo 3: Atualizar Banco de Dados

Execute script para atualizar URLs no banco:
```sql
-- Atualizar URLs de LOCAL para S3
UPDATE campaigns
SET
  "imageUrl" = REPLACE("imageUrl", '/uploads/campaigns/', 'https://seu-bucket.s3.amazonaws.com/campaigns/'),
  "imageStorageType" = 'S3'
WHERE "imageStorageType" = 'LOCAL';
```

### Passo 4: Remover Volume (opcional)

Após confirmar que tudo funciona com S3:
1. Vá em **Settings → Volumes**
2. Delete o volume para liberar espaço

---

## 💰 Custos

### Railway Volume

- **Incluído** no plano Railway
- Sem custos adicionais
- Limitado pelo espaço do plano

### AWS S3 (comparação)

**Nível gratuito** (12 meses):
- 5 GB armazenamento grátis
- 20.000 GET requests grátis
- 2.000 PUT requests grátis

**Após período gratuito**:
- ~$0.023/GB por mês (armazenamento)
- ~$0.0004/1000 GET requests
- ~$0.005/1000 PUT requests

**Exemplo**: 100 imagens (50 MB) + 10.000 views/mês = **~$0.02/mês** 💵

---

## 🔐 Backup do Volume

**IMPORTANTE**: Volumes do Railway **não têm backup automático**!

### Estratégias de Backup

#### 1. Backup Manual Periódico

```bash
# Conectar ao container via Railway CLI
railway run bash

# Compactar uploads
cd /app/data
tar -czf backup-$(date +%Y%m%d).tar.gz campaigns/

# Download via Railway
railway run cat /app/data/backup-YYYYMMDD.tar.gz > backup.tar.gz
```

#### 2. Script Automatizado

Adicione ao `package.json`:

```json
{
  "scripts": {
    "backup": "tar -czf /tmp/backup.tar.gz /app/data/campaigns && echo 'Backup criado em /tmp/backup.tar.gz'"
  }
}
```

Execute:
```bash
railway run npm run backup
```

#### 3. Sync para S3 (melhor opção)

Configure um cron job ou GitHub Action para fazer sync periódico:

```bash
# Instalar AWS CLI no container
# Adicionar ao Dockerfile:
RUN apt-get update && apt-get install -y awscli

# Script de backup (cron diário)
#!/bin/bash
aws s3 sync /app/data/campaigns s3://seu-bucket-backup/campaigns-backup/
```

---

## 📚 Recursos Adicionais

- [Railway Volumes Documentation](https://docs.railway.app/reference/volumes)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Guia de Configuração S3](RAILWAY_IMAGE_STORAGE_FIX.md)

---

## 💡 Recomendações Finais

### Para Desenvolvimento/Protótipos
✅ **Use Railway Volume** - rápido e simples

### Para Produção (apps pequenos/médios)
✅ **Use Railway Volume** - custo zero, funciona bem

### Para Produção (apps em crescimento)
✅ **Use AWS S3** - melhor performance, escalabilidade e backups

### Para Produção (apps grandes)
✅ **Use AWS S3** - essencial para múltiplas instâncias e CDN

---

## ⚡ Quick Start

**Resumo em 3 passos**:

1. **Criar volume**: Settings → Volumes → New Volume → Mount Path: `/app/data`
2. **Configurar variável**: Variables → New Variable → `UPLOAD_DIR=/app/data`
3. **Redeploy**: Deployments → Deploy

Pronto! Suas imagens agora são persistentes! 🎉
