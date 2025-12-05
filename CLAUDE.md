# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Project Overview

Monorepo for managing collective purchases with group management, product catalog, order tracking, and automatic shipping distribution. Full-stack TypeScript with React frontend and Express backend.

## 🚨 CRITICAL FRONTEND RULES 🚨

**ALL frontend development MUST follow these mandatory principles:**

### 1️⃣ Mobile-First Design (NO EXCEPTIONS)
- Start with mobile (320px-640px), enhance for larger screens
- Example: `className="w-full md:w-1/2 lg:w-1/3"` ✅
- Example: `className="w-1/3"` ❌

### 2️⃣ Theme Consistency (NO EXCEPTIONS)
- **Colors**: Blue (primary), Green (success), Red (danger), Gray (neutral) ONLY
- **Typography**: text-2xl/xl/lg/base/sm/xs with responsive scaling
- **Spacing**: Tailwind scale (2/4/6/8) - no arbitrary values
- **Shadows**: shadow-sm/shadow/shadow-md/shadow-lg ONLY

### 3️⃣ Modular Architecture (NO EXCEPTIONS)
- **File Size Limit**: 200-250 lines max - SPLIT if exceeded
- **Reusability**: Extract to `ui/` if used more than once
- **Organization**: ui/ (primitives), features/ (feature-specific), shared/ (business)
- **DRY Principle**: Never duplicate code

### 🔧 PROACTIVE REFACTORING (CRITICAL)

**MANDATORY**: When touching ANY component, refactor violations:
- ✅ Split files >250 lines
- ✅ Extract duplicate code to ui/
- ✅ Apply mobile-first to desktop-first components
- ✅ Fix theme inconsistencies

**When NOT to refactor:**
- ❌ Unrelated files not touched
- ❌ Explicitly told "minimal changes only"
- ❌ Emergency hotfixes (create TODO)

---

## Automated Quality Assurance (CRITICAL)

**MANDATORY**: After ANY code change:

### 1. Test Guardian (ALWAYS RUN FIRST)
```
Task tool → subagent_type='test-guardian'
```
- Creates/updates tests
- Runs full test suite
- NO EXCEPTIONS

### 2. Documentation Updater (RUN AFTER TESTS PASS)
```
Task tool → subagent_type='documentation-updater'
```
- Updates CLAUDE.md, DEVELOPMENT.md, README.md
- NO EXCEPTIONS

### 3. Execution Order
```
1. Complete coding task
2. Run test-guardian (REQUIRED)
3. Wait for tests to pass
4. Run documentation-updater (REQUIRED)
5. Report completion
```

**ABSOLUTE RULES:**
- ❌ NEVER skip test-guardian
- ❌ NEVER skip documentation-updater
- ❌ NEVER run documentation-updater before tests pass
- ✅ ALWAYS run both sequentially for ANY code change

---

## Development Commands

### Running
```bash
docker-compose up              # Start all services
docker-compose down            # Stop (preserves volumes)
docker-compose down -v         # Stop + remove volumes (deletes DB!)
```

### Database
```bash
docker exec -it compra-coletiva-backend sh
npx prisma generate            # After schema changes
npx prisma migrate dev --name <name>
npx prisma migrate deploy      # Production
npx prisma studio              # GUI at :5555
```

### Building
```bash
npm run build                  # All workspaces
npm run build --workspace=backend
```

## Project Statistics

### Backend
- **9 Route Files**: auth, campaigns, products, orders, analytics, messages, campaignMessages, validation, feedback
- **9 Services**: shippingCalculator, socketService, campaignScheduler, campaignStatusService, notificationService, spamDetectionService
- **11 DB Tables**: User, Campaign, Product, Order, OrderItem, OrderMessage, CampaignMessage, Notification, Feedback, Session, PasswordResetToken

### Frontend
- **67 Components**: 8 UI primitives, 4 auth, 21 campaign, 15 campaign-detail modules, 19 other
- **3 Pages**: Home, CampaignDetail (150 lines), NewCampaign
- **4 Custom Hooks**: useCampaignDetail, useCampaignQuestions, useCampaignChat, useOrderChat

## Architecture

### Monorepo
- **Root**: npm workspaces (backend, frontend)
- **Backend**: Express + Prisma + Socket.IO
- **Frontend**: React + Vite + Socket.IO client

### Core Business Entities

1. **Campaign**: Container for collective purchases
   - Status: ACTIVE, CLOSED, SENT, ARCHIVED
   - Auto-archives when all orders paid

2. **Product**: Items in campaign
   - `price` and `weight` (weight critical for shipping)

3. **Order**: Customer purchases
   - Tracks `subtotal`, `shippingFee`, `total`
   - Flags: `isPaid`, `isSeparated`

4. **OrderItem**: Join table with pricing snapshot

5. **OrderMessage**: Private chat (customer ↔ creator)

6. **CampaignMessage**: Public Q&A
   - Spam detection (0-100 score)
   - Rate limits: 1 msg/2min per campaign, 10/hr global
   - 15min edit window if unanswered

7. **User**: Auth + reputation
   - Email/password + Google OAuth
   - Reputation: `messageCount`, `answeredCount`, `spamScore`, `isBanned`

8. **Notification**: Real-time alerts
   - Types: CAMPAIGN_READY_TO_SEND, CAMPAIGN_STATUS_CHANGED, CAMPAIGN_ARCHIVED

9. **Feedback**: User feedback/bug reports
   - Types: BUG, SUGGESTION, IMPROVEMENT, OTHER
   - Status: PENDING, IN_PROGRESS, RESOLVED, DISMISSED

### Shipping Distribution
- **Proportional by weight**: Total shipping cost distributed to orders by weight ratio
- **Auto-recalculation**: On order create/update/delete, campaign shipping update
- **Rounding**: Last order gets remainder

### Real-Time (Socket.IO)
**Server Events**:
- `campaign-question-received`, `campaign-message-published`, `campaign-message-edited`, `campaign-message-deleted`
- `campaign-updated`, `notification-created`, `order-chat-message`

**Client Rooms**:
- `user:{userId}`, `campaign:{campaignId}`, `order:{orderId}`

### Backend Stack
- **Routes**: Express routers by resource
- **Validation**: Zod schemas inline
- **Error Handling**: `asyncHandler` + `AppError` class
- **Auth**: JWT + sessions, Google OAuth
- **Authorization**: `requireAuth`, `requireRole`, `requireCampaignOwnership`

### Frontend Stack
- **State**: React Query for server state
- **API**: Modular services in `src/api/` (see API Architecture)
- **Routing**: React Router
- **Styling**: TailwindCSS with design system
- **Components**: ui/, features/, layout/, shared/
- **Notifications**: react-hot-toast
- **Security**: DOMPurify (`lib/sanitize.ts`)

---

## Development Patterns

### Mobile-First (CRITICAL)

**MANDATORY**: All components mobile-first (320px-640px base).

**Tailwind Breakpoints**:
- `sm`: 640px+, `md`: 768px+, `lg`: 1024px+, `xl`: 1280px+, `2xl`: 1536px+

**Best Practices**:
```typescript
// ✅ Layout & Spacing
<div className="p-4 md:p-6 lg:p-8">
<div className="gap-2 md:gap-4">

// ✅ Typography
<h1 className="text-xl md:text-2xl lg:text-4xl">
<input className="w-full text-base">  // 16px+ prevents iOS zoom

// ✅ Touch Targets (44x44px minimum)
<button className="min-h-[44px] px-4 py-2">

// ✅ Grids
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ✅ Modals
<div className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2">
```

**Testing Checklist**:
- [ ] No horizontal scroll (320-640px)
- [ ] Touch targets 44x44px
- [ ] Text readable without zoom (16px+ for inputs)
- [ ] Images scale correctly

**Refactoring**: Fix desktop-first patterns when touched.

---

### Theme Consistency (CRITICAL)

**Color Palette**:
```typescript
// ✅ CORRECT
bg-blue-600    // Primary
bg-green-600   // Success
bg-red-600     // Danger
bg-gray-*      // Neutral

// ❌ WRONG
bg-purple-600, bg-pink-500, bg-teal-400  // Not in system
```

**Typography**:
```typescript
// ✅ Headings
text-2xl md:text-3xl lg:text-4xl font-bold    // h1
text-xl md:text-2xl font-bold                 // h2
text-lg md:text-xl font-semibold              // h3

// ✅ Body
text-base                     // Regular (16px)
text-sm text-gray-600         // Secondary (14px)
text-xs text-gray-500         // Meta (12px)
```

**Spacing** (4px base):
```typescript
p-4      // 16px
gap-2    // 8px
mb-6     // 24px
space-y-4
```

**Border Radius**:
```typescript
rounded         // 4px
rounded-lg      // 8px (DEFAULT)
rounded-xl      // 12px
rounded-full    // Circle
```

**Shadows**:
```typescript
shadow-sm    // Subtle
shadow       // Standard
shadow-md    // Medium
shadow-lg    // High
```

**Component Patterns**:
```typescript
// Button (primary)
<button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">

// Card
<div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">

// Input
<input className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">

// Badge
<span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
```

**Refactoring**: Fix arbitrary colors/shadows/spacing when touched.

---

### Modular Architecture (CRITICAL)

**Component Organization**:
```
frontend/src/
├── components/
│   ├── ui/          # Reusable primitives (Button, Input, Card, Badge, Modal)
│   ├── features/    # Feature-specific (campaign/, order/, product/)
│   ├── layout/      # Layout components
│   └── shared/      # Shared business components
├── hooks/           # Custom React hooks
├── lib/             # Utilities (api, socket, sanitize)
└── pages/           # Page components
```

**Principles**:

1. **Single Responsibility**: One component = one thing
2. **Composability**: Small, composable pieces
3. **Extract Reusable UI**: Create ui/ components for reuse
4. **Custom Hooks**: Extract logic to hooks
5. **File Size Limits**:
   - UI Components: 50-150 lines ideal, max 200
   - Page Components: 100-250 lines ideal, max 300
   - Hooks: 30-100 lines ideal, max 150
   - **Split if exceeds 250 lines**

**When to Split**:
- Multiple distinct sections → Extract sub-components
- Complex logic → Extract to hook
- Repeated patterns → Extract to utility
- File >250 lines → Mandatory split

**Props Pattern**:
```typescript
interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showActions?: boolean;
  className?: string;
}
```

**Component Checklist**:
- [ ] Single responsibility
- [ ] Reusable
- [ ] Props clear/typed/minimal
- [ ] Size <200 lines
- [ ] Mobile-first
- [ ] Theme consistent
- [ ] No duplication

**DRY Principle**: Extract repeated patterns (2+ times) to ui/.

**Refactoring Triggers**:
- File >250 lines → SPLIT
- Duplicate code (2+ times) → EXTRACT to ui/
- No TypeScript interface → ADD
- Logic mixed with UI → EXTRACT to hook
- Touching file importing non-compliant components → FIX them

---

### API Architecture (CRITICAL)

**MANDATORY**: ALL API calls in `frontend/src/api/`.

**Directory**:
```
frontend/src/api/
├── config.ts              # API config
├── types.ts               # All TypeScript types
├── client.ts              # Axios instances
├── index.ts               # Barrel export
└── services/              # Domain services
    ├── auth.service.ts
    ├── campaign.service.ts
    ├── product.service.ts
    ├── order.service.ts
    ├── message.service.ts
    ├── notification.service.ts
    ├── feedback.service.ts
    ├── analytics.service.ts
    └── validation.service.ts
```

**Principles**:
1. Single Responsibility: One service = one domain
2. Type Safety: All requests/responses typed in `types.ts`
3. Centralized Config: `config.ts`
4. Clean Imports: Barrel export
5. File Size: <150 lines per service

**Client Structure**:
```typescript
// Two clients
apiClient    // Authenticated calls (auto token refresh)
authClient   // Auth endpoints (no circular dep)
```

**Service Pattern**:
```typescript
export const campaignService = {
  list: (params?) => apiClient.get<Campaign[]>('/campaigns', { params }),
  getById: (id: string) => apiClient.get<Campaign>(`/campaigns/${id}`),
  create: (data: CreateCampaignDto) => apiClient.post<Campaign>('/campaigns', data),
  update: (id: string, data: UpdateCampaignDto) => apiClient.patch<Campaign>(`/campaigns/${id}`, data),
  delete: (id: string) => apiClient.delete(`/campaigns/${id}`),
};
```

**Usage**:
```typescript
// Modern (recommended)
import { campaignService } from '@/api';
const { data } = useQuery({
  queryKey: ['campaign', id],
  queryFn: () => campaignService.getById(id),
});

// Legacy (still works)
import { campaignApi } from '@/api';
```

**Adding Endpoints**:
1. Add types to `types.ts`
2. Add method to service or create new service
3. Export from `index.ts`
4. Use in components

**Refactoring**: Convert direct axios calls to services when touched.

---

## Additional Patterns

### Financial Calculations (CRITICAL)

**ALWAYS use Money utility**:
```typescript
import { Money } from '../utils/money';

// ✅ CORRECT
const subtotal = Money.multiply(price, quantity);
const total = Money.add(subtotal, shippingFee);
const fees = Money.distributeProportionally(totalShipping, weights);

// ❌ WRONG
const subtotal = price * quantity;
```

**Money Methods**:
- `round(value)`, `add(a, b)`, `subtract(a, b)`, `multiply(value, factor)`, `divide(value, divisor)`
- `distributeProportionally(total, weights)` - Guarantees exact sum
- `sum(values)`, `equals(a, b, tolerance?)`, `format(value)`, `isValid(value)`

### Security & XSS (CRITICAL)

**ALWAYS sanitize user content**:
```typescript
import { sanitizeText, sanitizeHtml } from '../lib/sanitize';

// ✅ CORRECT
<p dangerouslySetInnerHTML={{ __html: sanitizeText(message) }} />
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(richText) }} />

// ❌ WRONG
<p dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Functions**:
- `sanitizeText(text)`: Escapes HTML, preserves line breaks
- `sanitizeHtml(html)`: DOMPurify, allows safe tags only

**Where**: Messages, descriptions, feedback, any user input.

### Real-Time Features

**Server**:
```typescript
export const emitCustomEvent = (roomId: string, data: any) => {
  getIO().to(roomId).emit('custom-event', data);
};
```

**Client**:
```typescript
useEffect(() => {
  const socket = getSocket();
  socket.emit('join-room', roomId);
  socket.on('custom-event', handleEvent);
  return () => {
    socket.off('custom-event');
    socket.emit('leave-room', roomId);
  };
}, [roomId]);
```

### Adding API Endpoints (Backend)
1. Define Zod schema in route file
2. Use `asyncHandler` wrapper
3. Throw `AppError` for 4xx errors
4. Include Prisma relations
5. If modifying orders, call `ShippingCalculator` methods
6. **Use Money utility** for calculations

### Database
- Schema changes: `npx prisma migrate dev --name <name>`
- After schema: `npx prisma generate`
- Inspection: `npx prisma studio`
- Cascade deletes for integrity

---

## Environment Configuration

### Automatic Protocol
- **Local** (localhost, 127.0.0.1): `http://`
- **Remote**: `https://` (prod), `http://` (dev)
- **Manual**: Use as-is if specified

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/compra_coletiva
PORT=3000
NODE_ENV=development
CORS_ORIGIN=localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=localhost:3000
```

---

## Financial Validation

### Validation Scripts
```bash
# Validate all campaigns
docker exec compra-coletiva-backend node scripts/validate-financial-integrity.js

# Recalculate all
docker exec compra-coletiva-backend node scripts/recalculate-all-campaigns.js
```

### Validation API
```bash
GET /api/validation/campaign/:campaignId
```

**Checks**:
1. Σ(order.shippingFee) = campaign.shippingCost
2. Σ(order.total) = Σ(order.subtotal) + campaign.shippingCost
3. Σ(paid) + Σ(unpaid) = Σ(all)

---

## Legacy Users

### User Types
- **Real Users** (`isLegacyUser = false`): Login with email/password or Google OAuth
- **Legacy Virtual Users** (`isLegacyUser = true`): Pre-auth orders, cannot login

### Migration
```bash
npm run prisma:migrate:deploy
npm run fix:legacy-users
npm run validate:financial
```

---

## API Endpoints

### Auth (`/api/auth`)
- POST `/register`, `/login`, `/google`, `/logout`
- GET `/me`

### Campaigns (`/api/campaigns`)
- GET `/`, `/:id`
- POST `/`
- PATCH `/:id`
- DELETE `/:id`

### Products (`/api/products`)
- GET `/?campaignId=xxx`
- POST `/`, PATCH `/:id`, DELETE `/:id`

### Orders (`/api/orders`)
- GET `/?campaignId=xxx`
- POST `/`, PATCH `/:id`, `/:id/payment`, DELETE `/:id`

### Campaign Messages (`/api/campaign-messages`)
- GET `/?campaignId=xxx`, `/mine?campaignId=xxx`, `/unanswered?campaignId=xxx`
- POST `/`
- PATCH `/:id`, `/:id/answer`
- DELETE `/:id`

### Feedback (`/api/feedback`)
- POST `/`
- GET `/`, `/my`, `/stats`
- PATCH `/:id`, DELETE `/:id`

### Notifications (`/api/notifications`)
- GET `/`
- PATCH `/:id/read`
- DELETE `/:id`

### Analytics (`/api/analytics`)
- GET `/campaign/:campaignId`

### Validation (`/api/validation`)
- GET `/campaign/:campaignId`

---

## Important Notes

### Backend
- **Shipping**: Trigger recalculation on order changes
- **Price Snapshots**: OrderItem stores `unitPrice` at creation
- **Cascade Deletes**: Campaign → products/orders, Order → items
- **Financial Precision**: Always use Money utility
- **User Name Uniqueness**: Only non-legacy users (partial unique index)
- **XSS**: Use sanitization utilities
- **Socket.IO**: Join/leave rooms in useEffect cleanup
- **Rate Limiting**: Messages rate-limited

### Frontend (CRITICAL)
- **Mobile-First MANDATORY**: 320px-640px base, progressive enhancement
- **Theme MANDATORY**: Blue/green/red/gray, standard typography/spacing/shadows
- **Modular MANDATORY**: <200-250 lines, extract to ui/, custom hooks
- **API MANDATORY**: Use `api/` services - no direct axios
- **Proactive Refactoring MANDATORY**: Fix violations when touching ANY component
- **DRY**: Extract repeated patterns
- **Organization**: ui/ (primitives), features/ (feature), shared/ (business), api/services/ (domains)
- **Testing**: Mobile (320/375/390px), tablet (768px), desktop (1280px)
- **File Size**: Split >250 lines during ANY task
- **Reuse First**: Check existing ui/ before creating
- **Leave Better**: Refactor non-compliant code you touch

### Workflow
- **Monorepo**: Use `--workspace=<name>` flags
- **Container First**: Docker Compose for development

---

## Recent Updates

### December 5, 2025 - Frontend Modular Architecture & API Refactoring

**Component Refactoring**:
- **Before**: 28 components, 5 files >250 lines (max 2562!)
- **After**: 67 components, 0 files >250 lines (max 287)
- **CampaignDetail.tsx**: 2562 → 150 lines (94% reduction)

**New Architecture**:
1. **UI Primitives** (ui/): Button, Card, Input, Badge, Modal, Divider, GoogleButton + barrel export
2. **Auth** (auth/): LoginForm, RegisterForm, AuthTabs + barrel
3. **Campaign** (campaign/): 21 components + 3 hooks (CampaignQuestionsPanel, CampaignChat, OrderChat split)
4. **Campaign Detail** (pages/campaign-detail/): 15 components + 1 hook (tabs, modals, header, navigation)

**API Refactoring**:
- **Before**: 1 file (lib/api.ts - 426 lines)
- **After**: 13 files (max 124 lines, avg 95)
- **Structure**: config.ts, types.ts, client.ts, index.ts + services/
- **9 Services**: auth, campaign, product, order, message, notification, feedback, analytics, validation
- **Features**: Two-client architecture, auto token refresh, request queueing, backward compatible

**Benefits**:
- Separation of concerns (logic in hooks, UI in components)
- Improved reusability (ui/ components)
- Easier testing (smaller components)
- Mobile-first compliance
- Design system consistency
- Reduced duplication

### December 4, 2025 - Campaign Q&A, Notifications, Feedback

**New Features**:
1. **Campaign Q&A**: Public Q&A, spam detection (8 factors, 0-100 score), rate limiting, 15min edit window
2. **Notification System**: Real-time via Socket.IO, types (READY_TO_SEND, STATUS_CHANGED, ARCHIVED)
3. **Feedback System**: Types (BUG, SUGGESTION, IMPROVEMENT, OTHER), status workflow, anonymous support
4. **Spam Detection**: 8-factor analysis, rate limiting, user reputation
5. **Campaign Status Automation**: Auto-archive when paid, auto-unarchive if unpaid
6. **XSS Protection**: `sanitize.ts` with DOMPurify

**Database**: Added CampaignMessage, Notification, Feedback tables. Extended User with reputation fields.
