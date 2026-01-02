# 🖼️ Fix: Imagens Quebradas no Railway

## ❌ Problema Identificado

As imagens das campanhas estão quebradas no Railway e não aparecem no site.

## 🔍 Causa Raiz

**O problema**: Railway usa **containers efêmeros** - cada deploy cria um novo container e **apaga todos os arquivos**.

**Como funciona atualmente**:
1. Quando você faz upload de uma imagem, ela é salva em `/uploads/campaigns/` no container
2. A URL é salva no banco: `/uploads/campaigns/1234567890-image.jpg`
3. No próximo deploy (ou restart), o container é recriado e **todas as imagens são perdidas**
4. As URLs no banco apontam para arquivos que não existem mais ❌

**Por que aconteceu**:
- O sistema tem fallback automático: tenta S3 → usa armazenamento local se S3 não estiver configurado
- No Railway, **S3 não está configurado**, então as imagens são salvas localmente
- Armazenamento local **não persiste** entre deploys no Railway

## ✅ Solução: Configurar AWS S3

Para usar imagens em produção no Railway, você **DEVE** configurar AWS S3.

### Passo 1: Criar Bucket S3 na AWS

1. Acesse [AWS Console](https://console.aws.amazon.com/)
2. Vá para **S3** → **Create bucket**
3. Configure:
   - **Bucket name**: `compra-coletiva-images` (ou qualquer nome único)
   - **Region**: `us-east-1` (ou sua região preferida)
   - **Block Public Access**: ❌ Desmarque "Block all public access"
   - **Bucket Versioning**: Opcional (recomendado)
4. Clique em **Create bucket**

### Passo 2: Configurar Permissões do Bucket

1. Vá para o bucket criado → **Permissions**
2. Em **Bucket Policy**, adicione:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::compra-coletiva-images/*"
    }
  ]
}
```

3. Em **CORS configuration**, adicione:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Passo 3: Criar Usuário IAM com Permissões S3

1. Vá para **IAM** → **Users** → **Create user**
2. Nome: `compra-coletiva-s3-user`
3. **Attach policies directly** → Selecione: `AmazonS3FullAccess` (ou crie uma policy customizada)
4. **Create user**
5. Vá para o usuário criado → **Security credentials** → **Create access key**
6. Selecione **Application running outside AWS**
7. **Copie** e **guarde** as credenciais:
   - **Access key ID**: `AKIA...`
   - **Secret access key**: `wJalr...`

### Passo 4: Configurar Variáveis de Ambiente no Railway

**No painel do Railway:**

1. Vá para o serviço **Backend**
2. Entre em **Variables**
3. Adicione as seguintes variáveis:

```bash
AWS_ACCESS_KEY_ID=AKIA... # Sua Access Key
AWS_SECRET_ACCESS_KEY=wJalr... # Sua Secret Key
AWS_S3_BUCKET=compra-coletiva-images # Nome do bucket
AWS_S3_REGION=us-east-1 # Região do bucket
```

4. **Salve** e **Redeploy** o backend

### Passo 5: Verificar Configuração

Após o deploy, verifique nos logs do Railway:

```
✅ Image uploaded to S3: https://compra-coletiva-images.s3.us-east-1.amazonaws.com/campaigns/123-image.jpg
```

Se ver:
```
⚠️ S3 not configured, using local storage
```

Então as variáveis de ambiente não estão corretas!

## 🔧 Solução Alternativa (NÃO RECOMENDADA)

### Railway Volumes (Experimental)

Railway suporta volumes persistentes, mas é **experimental** e pode ter limitações:

1. No dashboard do Railway, vá para seu serviço backend
2. Vá para **Settings** → **Volumes**
3. Adicione um volume:
   - **Mount path**: `/app/uploads`
   - **Size**: 1GB (ou conforme necessário)

**Limitações**:
- ❌ Volumes não escalam horizontalmente
- ❌ Backups manuais necessários
- ❌ Pode ter problemas de performance
- ❌ Não recomendado para produção

**Recomendação**: Use S3 ao invés de volumes.

## 📋 Checklist de Resolução

- [ ] Criar bucket S3 na AWS
- [ ] Configurar permissões públicas e CORS
- [ ] Criar usuário IAM com acesso S3
- [ ] Copiar Access Key ID e Secret Access Key
- [ ] Adicionar variáveis de ambiente no Railway:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_S3_BUCKET`
  - `AWS_S3_REGION`
- [ ] Redeploy do backend no Railway
- [ ] Verificar logs para confirmar upload S3
- [ ] Testar upload de nova imagem
- [ ] Verificar se imagem persiste após redeploy

## 🎯 Testando a Solução

1. **Faça upload de uma nova imagem** em uma campanha
2. **Verifique os logs** do Railway - deve mostrar:
   ```
   ✅ Image uploaded to S3: https://...
   ```
3. **Faça um novo deploy** (ou restart do serviço)
4. **Verifique se a imagem ainda aparece** no site

Se a imagem continuar aparecendo após o deploy, **está funcionando!** ✅

## 💰 Custos AWS S3

**Nível gratuito AWS** (12 meses):
- 5 GB de armazenamento
- 20.000 requisições GET
- 2.000 requisições PUT

Para um app com poucas imagens, o custo é **praticamente zero**.

**Após o período gratuito**:
- ~$0.023/GB por mês (armazenamento)
- ~$0.0004/1000 requisições GET
- ~$0.005/1000 requisições PUT

Exemplo: 100 imagens (50 MB total) + 10.000 views/mês = **~$0.02/mês** 💵

## 🚨 Imagens Antigas (Já Perdidas)

Infelizmente, as imagens que foram salvas localmente no Railway **já foram perdidas** e não podem ser recuperadas. Você precisará:

1. **Reenviar manualmente** as imagens antigas das campanhas
2. OU aceitar que campanhas antigas não terão imagens

**Após configurar S3**, todas as novas imagens serão persistidas corretamente.

## 🔗 Recursos

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/)
- [Railway Volumes](https://docs.railway.app/reference/volumes)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)

## 💡 Recomendação Final

**Configure AWS S3** - é a única solução confiável para armazenamento de arquivos em produção no Railway.

- ✅ Persistência garantida
- ✅ Escalável
- ✅ CDN global (baixa latência)
- ✅ Backups automáticos (se habilitar versionamento)
- ✅ Custo muito baixo para apps pequenos/médios
