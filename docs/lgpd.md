# LGPD e Isenção de Vendas

Este documento resume os controles de privacidade e responsabilidade implementados no projeto para operação sob a LGPD.

## Escopo
- Cadastro e autenticação com registro de aceite legal versionado.
- Fluxo de pedidos com ciência explícita de isenção de responsabilidade por vendas.
- Minimização de exposição de dados pessoais em analytics e transparência de pedidos.
- Direitos do titular via exportação e exclusão/anomização de conta.
- Rotina automática de retenção para remover dados expirados.

## Controles Implementados

### 1. Aceite legal versionado
- Campos de aceite em `users`:
  - `termsAcceptedAt`, `termsAcceptedVersion`
  - `privacyAcceptedAt`, `privacyAcceptedVersion`
  - `salesDisclaimerAcceptedAt`, `salesDisclaimerAcceptedVersion`
  - `legalAcceptanceRequired`
- Registro de trilha de auditoria em `legal_acceptance_logs` com:
  - tipo de documento
  - versão
  - data/hora
  - IP e user-agent (quando disponíveis)
  - contexto do aceite (cadastro, onboarding OAuth, fluxo de pedido)

### 2. LGPD no onboarding
- Cadastro por email/senha exige aceite explícito de Termos e Privacidade.
- Usuários criados por OAuth podem ser marcados com `legalAcceptanceRequired=true` e ficam bloqueados em rotas protegidas até aceitar os documentos legais.
- Fluxo de completar perfil inclui etapa de aceite legal.

### 3. Isenção de responsabilidade por vendas
- Criação de pedidos exige ciência da isenção para usuários não-admin.
- Texto de isenção está publicado nos Termos.
- Frontend solicita confirmação antes de criar pedido quando necessário.
- Backend valida e bloqueia criação de pedido sem aceite da versão atual.

### 4. Minimização de dados
- Nome em campanhas exibe apenas primeiro + último nome por padrão (minimização).
- Usuário pode optar por mascarar o nome nas campanhas, exibindo apelido público divertido.
- Endpoint público de pedidos e analytics por cliente respeitam a preferência de máscara.
- Acesso à lista completa de pedidos é restrito a criador da campanha ou admin.
- Usuário comum acessa apenas o próprio pedido.

### 5. Direitos do titular
- Exportação de dados disponível em `/api/profile/export`.
- Exclusão de conta com anonimização e revogação de sessões/tokens.

### 6. Retenção e limpeza automática
- Scheduler de retenção executa limpeza periódica de:
  - sessões expiradas
  - tokens de reset expirados/usados antigos
  - logs de aceite legal muito antigos (janela configurável)

## Variáveis de Ambiente Relevantes
- `LEGAL_TERMS_VERSION`
- `LEGAL_PRIVACY_VERSION`
- `LEGAL_SALES_DISCLAIMER_VERSION`
- `PUBLIC_ALIAS_SECRET`
- `LEGAL_RETENTION_INTERVAL_MS`
- `PASSWORD_RESET_TOKEN_RETENTION_DAYS`
- `LEGAL_ACCEPTANCE_LOG_RETENTION_DAYS`

## Checklist Antes do Go-live
1. Definir versões finais de termos e privacidade nas variáveis `LEGAL_*_VERSION`.
2. Revisar os textos de `/termos` e `/privacidade` com advogado.
3. Configurar `PUBLIC_ALIAS_SECRET` forte em produção.
4. Executar migrações Prisma em produção.
5. Validar fluxo completo:
   - cadastro com aceite
   - OAuth com aceite pendente
   - criação de pedido com ciência de isenção
   - exportação e exclusão de conta

## Observação
Este documento é técnico e não substitui parecer jurídico.
