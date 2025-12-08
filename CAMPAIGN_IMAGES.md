# Campaign Images Feature

Sistema de upload e exibição de imagens para campanhas com suporte a AWS S3 e fallback local.

## 📸 Visão Geral

Cada campanha pode ter uma imagem principal que representa o produto da campanha. As imagens são exibidas:
- Na lista de campanhas (CampaignCard)
- Na página de detalhes da campanha (CampaignHeader)
- Proporção recomendada: 16:9 ou 2:1

## 🏗️ Arquitetura

### Backend

**Storage Strategy**: S3-first com fallback local
- **Preferência**: AWS S3 (quando configurado)
- **Fallback**: Armazenamento local (`uploads/campaigns/`)
- **Automático**: Detecta configuração do S3 e escolhe automaticamente

**Configuração AWS S3** (.env):
```bash
# Opcional - se não configurado, usa armazenamento local
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1  # default
```

**Rotas** (`/api/campaigns/:idOrSlug/image`):
- `POST` - Upload de imagem (multipart/form-data)
- `DELETE` - Remove imagem

**Validações**:
- Formatos: JPEG, JPG, PNG, WebP
- Tamanho máximo: 5MB
- Middleware: Multer com memoryStorage

**Banco de Dados** (Campaign model):
```prisma
model Campaign {
  imageUrl         String?              // URL completa (S3 ou local)
  imageKey         String?              // Chave/nome do arquivo
  imageStorageType ImageStorageType?    // S3 ou LOCAL
}

enum ImageStorageType {
  S3
  LOCAL
}
```

**Serviços**:
- `ImageUploadService`: Gerencia upload/delete S3 e local
- `uploadMiddleware`: Validação e configuração Multer

### Frontend

**Componentes**:
- `ImageUpload` (ui/): Componente reutilizável de upload
- `ImageUploadModal`: Modal para upload em campanhas existentes
- `CampaignCard`: Exibe imagem na lista
- `CampaignHeader`: Exibe imagem na página de detalhes

**Funcionalidades**:
- Preview em tempo real
- Validação client-side (tipo e tamanho)
- Upload no formulário de nova campanha
- Upload/substituição/remoção em campanhas existentes
- Fallback visual para campanhas sem imagem

**API Service** (`campaignService`):
```typescript
uploadImage(idOrSlug: string, file: File)
deleteImage(idOrSlug: string)
```

## 🚀 Fluxo de Upload

### Nova Campanha
1. Usuário seleciona imagem no formulário (opcional)
2. Campanha é criada primeiro
3. Imagem é enviada após criação (se selecionada)
4. Cache invalidado automaticamente

### Campanha Existente
1. Criador clica em "Adicionar imagem" ou edita imagem atual
2. Modal de upload abre
3. Usuário seleciona nova imagem
4. Upload substitui imagem anterior (se existir)
5. Imagem antiga é deletada do storage
6. Cache invalidado automaticamente

### Remoção
1. Criador clica em "Remover Imagem"
2. Confirmação do usuário
3. Imagem deletada do storage (S3 ou local)
4. Campos `imageUrl`, `imageKey`, `imageStorageType` zerados
5. Cache invalidado automaticamente

## 📊 Detalhes Técnicos

### S3 Upload
```typescript
// Usa @aws-sdk/client-s3 e @aws-sdk/lib-storage
const upload = new Upload({
  client: s3Client,
  params: {
    Bucket: S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  },
});

// URL pública: https://{bucket}.s3.{region}.amazonaws.com/{key}
```

### Local Fallback
```typescript
// Salva em: uploads/campaigns/{timestamp}-{random}-{filename}
fs.writeFileSync(localPath, file.buffer);

// URL servida por Express: /uploads/campaigns/{filename}
```

### Cliente - Construção de URL
```typescript
const getImageUrl = (imageUrl?: string) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl; // S3
  return `${apiUrl}${imageUrl}`; // Local
};
```

## 🎨 UI/UX

### Preview
- Aspecto 16:9 em mobile, 2:1 em desktop
- Placeholder com ícone quando sem imagem
- Preview em tempo real ao selecionar arquivo
- Botão de remoção sobreposto à imagem

### Validações
- Client-side: tipo MIME e tamanho
- Server-side: multer fileFilter
- Mensagens de erro amigáveis

### Mobile-First
- Layout responsivo (aspect-video → aspect-[2/1])
- Touch targets adequados (44x44px)
- Texto responsivo

## 🔧 Manutenção

### Migração S3 → Local (ou vice-versa)
O sistema detecta automaticamente o storage disponível. Para migrar:

1. **Configurar novo storage** (.env)
2. **Novas imagens** usarão automaticamente o novo storage
3. **Imagens antigas** continuam funcionando no storage original
4. **Opcional**: Script de migração em lote (a ser criado se necessário)

### Limpeza de Imagens Órfãs
- Imagens deletadas quando campanha é deletada (cascade)
- Imagens antigas deletadas ao fazer upload de nova
- Considerar: Job periódico para limpar uploads não finalizados

## 📝 Checklist de Deploy

### Desenvolvimento Local
- [x] Backend funciona sem S3 (fallback local)
- [x] Frontend renderiza imagens locais
- [x] Upload/delete/replace funcionam

### Produção (Railway)
- [ ] Variáveis S3 configuradas (se usar S3)
- [ ] Bucket S3 criado e público
- [ ] IAM credentials com permissões corretas
- [ ] Testar upload e visualização
- [ ] Testar fallback se S3 falhar

### Permissões IAM Necessárias (S3)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-bucket/*"
    }
  ]
}
```

## 🐛 Troubleshooting

### Imagem não aparece
1. Verificar console do navegador (erro 404?)
2. Backend: verificar `storageType` do registro
3. Se S3: confirmar bucket público e URL correta
4. Se LOCAL: confirmar `express.static` configurado
5. Verificar CORS (se S3)

### Upload falha
1. Verificar tamanho do arquivo (<5MB)
2. Verificar formato (JPEG/PNG/WebP)
3. Backend: logs do ImageUploadService
4. Se S3: verificar credenciais e permissões
5. Se LOCAL: verificar permissões de escrita em `uploads/`

### S3 configurado mas usa local
- Verificar se TODAS as variáveis S3 estão definidas
- Backend mostra no console: "⚠️ S3 not configured"
- Endpoint `/health` pode incluir storage info (futuro)

## 🔮 Melhorias Futuras

- [ ] Redimensionamento automático (thumbnails)
- [ ] Compressão de imagens
- [ ] Múltiplas imagens por campanha (galeria)
- [ ] Crop/edição no frontend
- [ ] CDN na frente do S3
- [ ] Job de limpeza de imagens órfãs
- [ ] Migração em lote entre storages
- [ ] Upload direto S3 (signed URLs)
- [ ] Progressive image loading
- [ ] WebP optimization automática



