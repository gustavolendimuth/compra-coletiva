# Testing Guide

Este guia documenta a infraestrutura de testes do projeto.

## Infraestrutura

### Backend (Jest + ts-jest)
- **Framework**: Jest 29.7.0 + ts-jest
- **Configuração**: `backend/jest.config.js`
- **Setup**: `backend/src/__tests__/setup.ts`

### Frontend (Vitest + React Testing Library)
- **Framework**: Vitest 4.0.15 + React Testing Library
- **Configuração**: `frontend/vite.config.ts`
- **Setup**: `frontend/src/__tests__/setup.ts`

## Executando Testes

### Backend
```bash
# Rodar todos os testes
npm test --workspace=backend

# Watch mode
npm run test:watch --workspace=backend

# Com cobertura
npm run test:coverage --workspace=backend
```

### Frontend
```bash
# Rodar todos os testes
npm test --workspace=frontend

# UI interativa
npm run test:ui --workspace=frontend

# Com cobertura
npm run test:coverage --workspace=frontend
```

### Todos os testes
```bash
# Rodar backend e frontend em paralelo
npm test --workspaces
```

## Estrutura de Testes

### Backend
```
backend/src/
├── __tests__/          # Setup e helpers
│   └── setup.ts
├── utils/
│   └── money.test.ts   # 31 testes ✅
└── services/
    └── __tests__/      # Testes de services
```

### Frontend
```
frontend/src/
├── __tests__/                  # Setup e helpers
│   ├── setup.ts                # Configuração global
│   └── mock-data.ts            # Factory functions para mocks
├── pages/
│   └── __tests__/
│       └── CampaignList.test.tsx       # 19 testes ✅
└── components/
    ├── ui/
    │   └── __tests__/
    │       └── Button.test.tsx         # 12 testes ✅
    └── campaign/
        └── __tests__/
            ├── CampaignFilters.test.tsx        # 28 testes ✅
            ├── CampaignCard.test.tsx           # 22 testes ✅
            ├── CampaignCardHeader.test.tsx     # 14 testes ✅
            ├── CampaignCardBody.test.tsx       # 17 testes ✅
            ├── CampaignCardFooter.test.tsx     # 24 testes ✅ (2 skipped)
            └── CampaignCardSkeleton.test.tsx   # 30 testes ✅
```

## Estatísticas

### Backend
- ✅ 31/31 testes passando
- 📊 Cobertura: Money utility 100%
- 🎯 Foco: Cálculos financeiros críticos
- ⚡ Execução: <1 segundo

### Frontend
- ✅ 164/166 testes passando (2 skipped)
- 📦 8 test files
- 📊 Cobertura: Campaign listing + UI components
- 🎯 Foco: Pages, components reutilizáveis, interações
- ⚡ Execução: ~3.7 segundos

### Total
- ✅ **195 testes passando** (164 frontend + 31 backend)
- 📁 **9 test files**
- 🚀 Taxa de sucesso: 100%
- ⚡ Execução total: ~4.7 segundos

## CI/CD

### GitHub Actions
Workflow automático configurado em `.github/workflows/test.yml`:
- ✅ Roda testes em cada push/PR
- ✅ Testa backend e frontend separadamente
- ✅ Verifica build após testes passarem
- ✅ Upload de cobertura para Codecov

### Triggers
- Push para `main` ou `develop`
- Pull requests para `main` ou `develop`

## Boas Práticas

### Escrevendo Testes

1. **AAA Pattern**: Arrange, Act, Assert
```typescript
it('should do something', () => {
  // Arrange
  const input = 10;
  
  // Act
  const result = doSomething(input);
  
  // Assert
  expect(result).toBe(20);
});
```

2. **Descritivo**: Nome do teste deve explicar o comportamento
```typescript
// ✅ Bom
it('should return false when values differ by more than tolerance', () => {});

// ❌ Ruim
it('test equals', () => {});
```

3. **Isolado**: Cada teste deve ser independente
```typescript
// Use beforeEach para setup comum
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Mocking

#### Backend (Jest)
```typescript
// Mock Prisma
jest.mock('../index', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Usar mock
(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
```

#### Frontend (Vitest)
```typescript
// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock socket
vi.mock('../lib/socket', () => ({
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
  })),
}));
```

### Mock Data Factories (Frontend)

O projeto usa factory pattern para gerar dados de teste consistentes:

```typescript
import { createMockCampaign, createMockProduct } from '@/tests/mock-data';

// Criar campanha com valores padrão
const campaign = createMockCampaign();

// Sobrescrever valores específicos
const activeCampaign = createMockCampaign({
  status: 'ACTIVE',
  name: 'Custom Campaign',
});

// Usar mocks predefinidos
import {
  mockActiveCampaign,
  mockClosedCampaign,
  mockCampaignEndingToday,
  mockCampaignNoProducts,
} from '@/tests/mock-data';
```

**Factories Disponíveis**:
- `createMockProduct(overrides?)` - Gera produto mock
- `createMockCampaign(overrides?)` - Gera campanha mock
- `createMockCampaignListResponse(campaigns, overrides?)` - Resposta de API

**Mocks Predefinidos**:
- `mockActiveCampaign` - Campanha ativa
- `mockClosedCampaign` - Campanha fechada
- `mockSentCampaign` - Campanha enviada
- `mockArchivedCampaign` - Campanha arquivada
- `mockCampaignEndingToday` - Termina hoje
- `mockCampaignEndingTomorrow` - Termina amanhã
- `mockCampaignNoProducts` - Sem produtos
- `mockCampaignManyProducts` - 10+ produtos

## Cobertura de Testes Atual

### Frontend ✅
- **Pages**: CampaignList (19 tests)
- **Campaign Components**: Filters, Card, CardHeader, CardBody, CardFooter, CardSkeleton (135 tests)
- **UI Components**: Button (12 tests)
- **Utilities**: Mock data factories
- **Total**: 164 tests, 8 files

### Backend ✅
- **Utilities**: Money (31 tests, 100% coverage)
- **Total**: 31 tests, 1 file

## Test Coverage por Feature

### Campaign Listing (Complete ✅)
- [x] Page rendering and loading states (19 tests)
- [x] Filters component (28 tests)
- [x] Campaign cards (22 tests)
- [x] Card header with status badges (14 tests)
- [x] Card body with statistics (17 tests)
- [x] Card footer with dates (24 tests)
- [x] Skeleton loading states (30 tests)

### Areas para Expandir
1. **Pages**: CampaignDetail, NewCampaign, Home
2. **Campaign Components**: CampaignQuestionsPanel, CampaignChat, OrderChat
3. **UI Components**: Card, Input, Badge, Modal, NotificationItem
4. **Hooks**: useCampaignDetail, useNotifications, useCampaignQuestions
5. **Backend Routes**: campaignMessages, notifications, feedback
6. **Backend Services**: SpamDetection, NotificationService, CampaignStatusService

### Melhorias
1. Integração com Codecov
2. Threshold de cobertura mínima (70%)
3. Testes E2E com Playwright
4. Performance benchmarks
5. Visual regression testing

## Troubleshooting

### Problema: "Your test suite must contain at least one test"
**Solução**: O arquivo `setup.ts` não deve ter extensão `.test.ts`

### Problema: Timeouts em testes de componentes
**Solução**: Aumentar timeout em `vite.config.ts` ou usar `waitFor` do Testing Library

### Problema: Mocks não funcionando
**Solução**: Verificar ordem dos mocks (devem vir antes dos imports)

## Recursos

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
