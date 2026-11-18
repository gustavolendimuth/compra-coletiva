# Features e integrações

Resumo técnico das principais integrações e comportamentos de produto.

## SEO
- Sitemap dinâmico e robots.txt.
- Metadata completa com Open Graph e Twitter Cards.
- JSON-LD para Organization, WebSite, Product e Breadcrumb.
- Metadata específica por campanha com URL canônica.

## Cadastro e confirmação de email
- Cadastro por email/senha não abre sessão: envia um link de confirmação (vale 24 h) e responde igual exista ou não a conta.
- Login com senha certa e email não confirmado responde `403 EMAIL_NOT_VERIFIED`; o modal oferece reenvio (`POST /api/auth/resend-verification`).
- O link abre `/verify-email`, que chama `POST /api/auth/verify-email` e já entra na conta.
- Cadastro sobre conta não confirmada (inclusive usuário legado criado por organizador) assume a conta; só quem abrir o link a ativa.
- Login Google, reset de senha e troca de email também comprovam o email. Vincular Google a conta nunca confirmada apaga a senha local e as sessões.
- Emails transacionais (confirmação, reset) saem mesmo para quem desativou emails.

## Recuperação de senha
- "Esqueci minha senha" no login do modal pede o link (`POST /api/auth/request-password-reset`) e mostra a mensagem do backend, igual para qualquer email (existente, só Google, excluído ou desconhecido).
- O link do email (vale 1 h, uso único) abre `/reset-password?token=...`, que pede nova senha e confirmação com as mesmas regras do backend (6+ caracteres, maiúscula, minúscula e número) e chama `POST /api/auth/reset-password`.
- Sucesso derruba as sessões e manda para o login (`/campanhas?requireLogin=true`); não abre sessão.
- Link inválido, expirado ou já usado mostra a mensagem do backend e deixa pedir outro link na própria página.
- A página não é indexada e usa `referrer: no-referrer`, porque o token vai na URL.
- Login por senha de conta só Google responde igual a senha errada (`401 INVALID_CREDENTIALS`).

## Troca de email
- Perfil → Email pede a troca (`POST /api/profile/change-email`); conta com senha confirma com a senha, conta só Google não precisa.
- O link vai para o novo email (vale 24 h, uso único) e abre `/perfil/verificar-email?token=...`, que chama `POST /api/profile/verify-email`. O banco guarda só o SHA-256 do token.
- Confirmar troca o email e o marca como confirmado. Link inválido, expirado ou já usado responde `400 INVALID_TOKEN`; email ocupado por outra conta nesse meio-tempo responde `400 EMAIL_IN_USE`.

## Senha e Google na mesma conta
- `/me`, login e refresh devolvem `hasPassword` e `hasGoogle`; o perfil usa isso para as seções Senha e Conta Google.
- Conta só Google cria uma senha pelo mesmo link do reset: botão "Criar senha" no perfil ou "Esqueci minha senha" no login. O Google continua vinculado.
- Conta com senha vincula o Google em Perfil → "Vincular conta Google" (`GET /api/auth/google?intent=link`). O backend confere a sessão pelo refresh token, marca o fluxo no cookie `oauthLink` e, no callback, vincula sem abrir sessão nova e sem mexer na senha. Volta para `/perfil?google=<resultado>`.
- Só vincula conta Google com o mesmo email do cadastro e email confirmado pelo Google; recusa conta Google já usada por outro cadastro. Resultados: `linked`, `email_mismatch`, `email_not_verified`, `google_in_use`, `already_linked`, `auth_required`, `oauth_state`, `failed`.
- Entrar com "Continuar com Google" usando o mesmo email também vincula a conta com senha.

## Imagens de campanhas
- Endpoint: `POST /api/campaigns/:idOrSlug/image` e `DELETE /api/campaigns/:idOrSlug/image`.
- Formatos aceitos: JPEG, PNG, WebP.
- Tamanho máximo: 5MB.
- Storage: S3 quando configurado, fallback local em `uploads/`.
- Campos persistidos: `imageUrl`, `imageKey`, `imageStorageType`.

## Email
- Providers: `resend`, `gmail` ou `auto` (fallback).
- Envio assíncrono via Redis.
- Variáveis comuns:
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=auto
EMAIL_FROM_ADDRESS=...
EMAIL_FROM_NAME=Compra Coletiva
RESEND_API_KEY=...
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
```
- Gmail usa o email da conta como remetente. Resend permite domínio customizado.
