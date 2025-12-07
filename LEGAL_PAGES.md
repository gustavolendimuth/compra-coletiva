# Páginas Legais - Política de Privacidade e Termos de Serviço

## 📋 Visão Geral

Este documento descreve as páginas de Política de Privacidade e Termos de Serviço implementadas para conformidade com o Google OAuth 2.0 e LGPD.

## 📄 Páginas Criadas

### 1. Política de Privacidade (`/privacy`)
**Arquivo**: `frontend/src/pages/PrivacyPolicy.tsx`

**Conteúdo**:
- ✅ Informações que coletamos (cadastro, Google OAuth, uso)
- ✅ Como usamos as informações
- ✅ Compartilhamento de dados (não vendemos!)
- ✅ Segurança de dados (criptografia, HTTPS, proteção XSS)
- ✅ Direitos do usuário (LGPD)
- ✅ Cookies e armazenamento local
- ✅ Integração com Google (políticas de dados de usuário)
- ✅ Retenção de dados
- ✅ Alterações na política
- ✅ Contato

**Conformidade Google OAuth**:
- Declara aderência às [políticas de dados de usuário da Google API](https://developers.google.com/terms/api-services-user-data-policy)
- Menciona uso limitado das APIs do Google
- Explica quais dados recebemos do Google (nome, email, foto)
- Esclarece que não temos acesso à senha do Google

**Conformidade LGPD**:
- Lista todos os direitos do titular (acesso, correção, exclusão, exportação)
- Fornece canal de contato para exercer direitos
- Explica finalidades da coleta de dados

### 2. Termos de Serviço (`/terms`)
**Arquivo**: `frontend/src/pages/TermsOfService.tsx`

**Conteúdo**:
- ✅ Aceitação dos termos
- ✅ Descrição do serviço (facilitador de compras coletivas)
- ✅ Registro e conta (email/senha e Google OAuth)
- ✅ Uso aceitável (proibições)
- ✅ Campanhas e pedidos (responsabilidades)
- ✅ Sistema de reputação e moderação
- ✅ Propriedade intelectual
- ✅ Privacidade e proteção de dados
- ✅ Isenção de garantias
- ✅ Limitação de responsabilidade
- ✅ Suspensão e encerramento
- ✅ Alterações nos termos
- ✅ Lei aplicável (Brasil)
- ✅ Contato

**Destaques**:
- Esclarece que somos apenas facilitador (não responsáveis por produtos/entregas)
- Define responsabilidades de organizadores e participantes
- Lista comportamentos proibidos
- Explica sistema de moderação (spam, banimento)

## 🔗 Integração

### Rotas
Adicionadas em `frontend/src/App.tsx`:
```typescript
<Route path="/privacy" element={<PrivacyPolicy />} />
<Route path="/terms" element={<TermsOfService />} />
```

### Footer
Atualizado em `frontend/src/components/Footer.tsx`:
- Links no menu "Links Rápidos" (desktop)
- Links na barra inferior (mobile e desktop)

### Formulários de Auth
Links adicionados nos formulários de login/registro:

**RegisterForm** (`frontend/src/components/auth/RegisterForm.tsx`):
- Texto antes do botão "Criar Conta"
- "Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade"

**LoginForm** (`frontend/src/components/auth/LoginForm.tsx`):
- Texto após o botão Google
- "Ao usar o Google, você concorda com nossos Termos e Privacidade"

## 🎨 Design

### Mobile-First ✅
- Layout responsivo 320px-2xl
- Touch targets 44x44px
- Typography escalável (text-2xl md:text-3xl lg:text-4xl)
- Padding progressivo (p-4 md:p-6 lg:p-8)

### Theme Consistency ✅
- Cores: Blue (primary), Green (success), Red (danger), Gray (neutral)
- Typography: text-2xl/xl/lg/base/sm/xs
- Spacing: Tailwind scale (2/4/6/8)
- Shadows: shadow-sm/shadow/shadow-md/shadow-lg
- Border radius: rounded-lg

### Arquitetura Modular ✅
- Cada página ~290 linhas (dentro do limite)
- Componentes standalone (não precisam de subcomponentes)
- Props mínimas (nenhuma!)
- Imports limpos

## 📱 Navegação

### Acesso às Páginas
- **Header**: Sem link direto (não polui navegação principal)
- **Footer**: Links em "Links Rápidos" e barra inferior
- **Auth Forms**: Links contextuais ao criar conta ou fazer login com Google
- **Dentro das páginas**: Links cruzados (Privacy ↔ Terms)

### Botão "Voltar"
Ambas as páginas têm botão "← Voltar" que retorna para `/campaigns`

## 🔍 SEO e Acessibilidade

### Meta Tags (para adicionar futuramente)
```html
<title>Política de Privacidade - Compra Coletiva</title>
<meta name="description" content="Nossa política de privacidade conforme LGPD..." />
```

### Acessibilidade
- ✅ Estrutura semântica (h1, h2, h3, p, ul, li)
- ✅ Links descritivos
- ✅ Contraste adequado (WCAG AA)
- ✅ Touch targets mínimos 44x44px

## 📧 Contatos

### Privacidade
**Email**: privacidade@compracoletiva.com

### Suporte
**Email**: suporte@compracoletiva.com

> **Nota**: Estes são emails exemplo. Configure emails reais antes de usar em produção.

## ✅ Checklist Google OAuth

Para aprovar o app no Google:

- [x] Política de Privacidade criada
- [x] Termos de Serviço criados
- [x] Páginas acessíveis publicamente (sem login)
- [x] Links nas páginas de autenticação
- [x] Declaração de conformidade com políticas Google
- [x] Explicação de dados coletados do Google
- [ ] URLs configuradas no Google Cloud Console
- [ ] Verificação de domínio

## 🚀 Próximos Passos

1. **Configurar Google Cloud Console**:
   - Adicionar URL da Política: `https://seudominio.com/privacy`
   - Adicionar URL dos Termos: `https://seudominio.com/terms`

2. **Configurar Emails**:
   - Criar `privacidade@compracoletiva.com`
   - Criar `suporte@compracoletiva.com`

3. **Verificar Domínio**:
   - Verificar propriedade do domínio no Google Search Console

4. **Meta Tags** (opcional):
   - Adicionar meta tags para SEO

5. **Sitemap** (opcional):
   - Adicionar `/privacy` e `/terms` ao sitemap.xml

## 📝 Manutenção

### Quando Atualizar

**Política de Privacidade**:
- Mudanças na coleta de dados
- Novos serviços de terceiros
- Mudanças na lei (LGPD, etc)

**Termos de Serviço**:
- Mudanças nas funcionalidades
- Novas regras de uso
- Mudanças na responsabilidade

### Como Atualizar
1. Editar arquivo `.tsx` correspondente
2. Atualizar data "Última atualização"
3. Notificar usuários por email (mudanças significativas)
4. Manter histórico de versões (git)

## 🧪 Testes

### Checklist Manual
- [ ] Acesso via `/privacy` e `/terms`
- [ ] Links no footer funcionando
- [ ] Links nos formulários de auth funcionando
- [ ] Botão "Voltar" funcionando
- [ ] Links cruzados (Privacy ↔ Terms) funcionando
- [ ] Links externos (Google policies) abrindo nova aba
- [ ] Layout mobile responsivo (320px, 375px, 768px, 1280px)
- [ ] Scroll suave em mobile
- [ ] Touch targets adequados

### Teste Google OAuth
1. Configurar URLs no Google Cloud Console
2. Testar fluxo de login com Google
3. Verificar se Google aceita as páginas

## 📚 Referências

- [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
- [LGPD - Lei Geral de Proteção de Dados](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Última atualização**: 7 de dezembro de 2025
