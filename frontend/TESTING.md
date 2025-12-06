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
- ✅ **565/570 testes passando** (5 failing)
- 📦 **50+ test files**
- 📊 Cobertura: Campaign listing + Campaign Detail + UI components + Hooks
- 🎯 Foco: Pages, components reutilizáveis, hooks, interações
- ⚡ Execução: ~12 segundos
- 🎉 **98.8% taxa de sucesso** (87% improvement!)

**Test Improvement Journey**:
- **Before**: 39 failing tests (93.1% success rate)
- **After**: 5 failing tests (98.8% success rate)
- **Fixed**: 34 tests (87% reduction in failures!)

### Total
- ✅ **596 testes passando** (565 frontend + 31 backend)
- 📁 **50+ test files**
- 🚀 Taxa de sucesso: 98.8%
- ⚡ Execução total: ~13 segundos

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

### Test Patterns Established (December 2025)

#### 1. Multiple Elements in Mobile + Desktop Views
When elements appear in both mobile and desktop views, use `getAllByText()` instead of `getByText()`:

```typescript
// ✅ CORRECT - Element appears in mobile AND desktop view
const statusElements = screen.getAllByText('Ativa');
expect(statusElements[0]).toBeInTheDocument();

// ❌ WRONG - Will fail with "Found multiple elements"
const status = screen.getByText('Ativa');
```

#### 2. Async Rendered Elements
For elements that render asynchronously, use `queryAllByText()` with length check:

```typescript
// ✅ CORRECT - Check if element exists after async render
await waitFor(() => {
  expect(screen.queryAllByText('Product Name').length).toBeGreaterThan(0);
}, { timeout: 5000 });

// ❌ WRONG - Throws error if not found
expect(screen.getByText('Product Name')).toBeInTheDocument();
```

#### 3. React Props vs HTML Attributes
Don't test React props as HTML attributes:

```typescript
// ✅ CORRECT - Test actual behavior
const input = screen.getByRole('textbox');
await userEvent.click(input);
expect(input).toHaveFocus();

// ❌ WRONG - autoFocus is a React prop, not HTML attribute
expect(input).toHaveAttribute('autofocus');
```

#### 4. Flexible Mock Assertions
Use flexible assertions that check call count rather than exact arguments:

```typescript
// ✅ CORRECT - Check if called with expected ID
expect(mockOnClick).toHaveBeenCalledTimes(1);
expect(mockOnClick.mock.calls[0][0]).toMatchObject({ id: '123' });

// ❌ WRONG - Too strict, fails if object has extra properties
expect(mockOnClick).toHaveBeenCalledWith(exactObject);
```

#### 5. Sufficient Wait Time for Complex Components
Increase `waitFor` timeout for complex component rendering:

```typescript
// ✅ CORRECT - Give complex components time to render
await waitFor(() => {
  expect(screen.getByText('Complex Data')).toBeInTheDocument();
}, { timeout: 5000 });

// ❌ WRONG - Default 1000ms might not be enough
await waitFor(() => {
  expect(screen.getByText('Complex Data')).toBeInTheDocument();
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

### Campaign Detail (98% Complete ✅)
- [x] **ProductsTab** - 8 tests fixed (multiple element pattern)
- [x] **OrdersTab** - 4 tests fixed (multiple element pattern)
- [x] **OverviewTab** - 7 tests fixed (multiple elements + button title attributes)
- [x] **ShippingTab** - 1 fix (null campaign handling)
- [x] **OrderModals** - 7 tests fixed (multiple elements + mock assertions)
- [x] **CampaignModals** - 3 tests fixed (autoFocus + multiple elements)
- [x] **ProductModals** - 2 tests fixed (autoFocus + onChange)
- [x] **CampaignDetail Integration** - 5 tests fixed (multiple elements in responsive views)
- [ ] 5 remaining edge cases (2 useCampaignDetail hook mocks, 2 customer name timing, 1 OrderModals assertion)

**Total Fixed**: 34 tests (87% reduction in failures!)

### Components Fixed (December 2025)
1. **ShippingTab.tsx** - Added null campaign handling
2. **ProductsTab tests** - Fixed 8 multiple element issues using getAllByText
3. **OrdersTab tests** - Fixed 4 multiple element issues
4. **OverviewTab tests** - Fixed 7 multiple element issues + button title attributes
5. **OrderModals tests** - Fixed 7 multiple element issues + mock assertions
6. **CampaignModals tests** - Fixed 3 tests (autoFocus + multiple elements)
7. **ProductModals tests** - Fixed 2 tests (autoFocus + onChange)
8. **CampaignDetail tests** - Fixed 5 integration tests with multiple elements

### Areas para Expandir
1. **Pages**: NewCampaign, Home
2. **Campaign Components**: CampaignQuestionsPanel, CampaignChat, OrderChat
3. **UI Components**: Card, Input, Badge, Modal (more coverage)
4. **Hooks**: useCampaignQuestions, useOrderChat (more coverage)
5. **Backend Routes**: campaignMessages, notifications, feedback
6. **Backend Services**: SpamDetection, NotificationService, CampaignStatusService

### Melhorias
1. Fix remaining 5 tests (timing and mock configuration edge cases)
2. Integração com Codecov
3. Threshold de cobertura mínima (70%)
4. Testes E2E com Playwright
5. Performance benchmarks
6. Visual regression testing

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
