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

---

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

### Testing
```bash
npm test                       # Run all tests (both workspaces)
npm test --workspace=backend   # Backend tests only
npm test --workspace=frontend  # Frontend tests only
npm run test:coverage --workspace=frontend  # Coverage report
npm run test:ui --workspace=frontend        # Interactive UI
```

### Building
```bash
npm run build                  # All workspaces
npm run build --workspace=backend
```

## Project Statistics

### Backend
- **18 Route Files**: auth, campaigns, products, orders, analytics, messages, campaignMessages, validation, feedback, notifications, profile, emailPreferences, geocoding + admin/ (index, users, dashboard, content, audit)
- **21 Services**: shippingCalculator, socketService, campaignScheduler, campaignStatusService, notificationService, spamDetectionService, auditService, geocodingService + utils/distance + email/ (emailQueue, emailWorker, templates, notificationEmailService)
- **14 DB Tables**: User, Campaign, Product, Order, OrderItem, OrderMessage, CampaignMessage, Notification, Feedback, Session, PasswordResetToken, EmailPreference, EmailLog, AuditLog

### Frontend
- **90 Components**: 12 UI primitives (Avatar, CepInput, AddressForm, Map, DistanceBadge added), 4 auth, 22 campaign (ProximitySearch added), 17 campaign-detail modules (CampaignLocationSection, CampaignLocationMap added), 11 profile components (ProfileAddressSection added), 6 admin components, 18 other
- **54 Pages**: Home, CampaignDetail, NewCampaign, Profile, CompleteProfile, VerifyEmailChange, EmailPreferences + admin/ (AdminLayout, Dashboard, Users, UserDetail, Campaigns, Messages, Audit)
- **6 Custom Hooks**: useCampaignDetail (~828 lines), useCampaignQuestions, useCampaignChat, useOrderChat, useOrderModal (352 lines), useOrderAutosave (~113 lines)
- **13 API Services**: auth, campaign, product, order, message, notification, feedback, analytics, validation, profile, emailPreference, admin, geocoding
- **Test Suite**: 50+ test files, 607 passing tests (100% success), ~13s execution time

## Architecture

### Monorepo
- **Root**: npm workspaces (backend, frontend)
- **Backend**: Express + Prisma + Socket.IO
- **Frontend**: React + Next.js + Socket.IO client

### Core Business Entities

1. **Campaign**: Container for collective purchases
   - Status: ACTIVE, CLOSED, SENT, ARCHIVED
   - Auto-archives when all orders paid
   - Pickup location: `pickupZipCode`, `pickupStreet`, `pickupNumber`, `pickupComplement`, `pickupNeighborhood`, `pickupCity`, `pickupState`, `pickupLatitude`, `pickupLongitude`

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

7. **User**: Auth + reputation + profile
   - Email/password + Google OAuth
   - Reputation: `messageCount`, `answeredCount`, `spamScore`, `isBanned`
   - Profile: Avatar (S3/local), phone, pendingEmail (verification flow)
   - Default address: `defaultZipCode`, `defaultStreet`, `defaultNumber`, `defaultComplement`, `defaultNeighborhood`, `defaultCity`, `defaultState`, `defaultLatitude`, `defaultLongitude`, `addressCompleted`
   - Soft delete: `deletedAt`, `deletedReason` (anonymized)
   - Phone + address completion flags for OAuth users

8. **Notification**: Real-time alerts
   - Types: CAMPAIGN_READY_TO_SEND, CAMPAIGN_STATUS_CHANGED, CAMPAIGN_ARCHIVED, NEW_MESSAGE
   - Linked to EmailLog for tracking

9. **Feedback**: User feedback/bug reports
   - Types: BUG, SUGGESTION, IMPROVEMENT, OTHER
   - Status: PENDING, IN_PROGRESS, RESOLVED, DISMISSED

10. **EmailPreference**: User email opt-in/out
    - Global opt-out + per-notification-type preferences
    - Digest settings (REALTIME, DAILY, WEEKLY)

11. **EmailLog**: Email delivery tracking
    - Status: PENDING, SENT, FAILED, RETRYING
    - Engagement tracking: opened, clicked, bounced
    - Provider integration (Resend, Gmail)

12. **AuditLog**: Admin action tracking
    - Actions: USER_*, CAMPAIGN_*, MESSAGE_*, AUDIT_*, SYSTEM_*, SETTINGS_*
    - Target types: USER, CAMPAIGN, ORDER, MESSAGE, FEEDBACK, SYSTEM
    - IP address + user agent tracking

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
- **Auth**: JWT + sessions, Google OAuth (with account linking & reactivation)
- **Authorization**: `requireAuth`, `requireRole`, `requireCampaignOwnership`
- **Testing**: Jest + ts-jest, 55 passing tests

### Frontend Stack
- **State**: React Query for server state
- **API**: Modular services in `src/api/` (see API Architecture)
- **Routing**: Next.js App Router
- **Styling**: TailwindCSS with design system
- **Components**: ui/, features/, layout/, shared/
- **Notifications**: react-hot-toast
- **Security**: DOMPurify (`lib/sanitize.ts`)
- **Maps**: Leaflet + OpenStreetMap for pickup location display
- **Testing**: Vitest + React Testing Library, 568 passing tests

---

## Development Patterns

### Mobile-First (CRITICAL)

**MANDATORY**: All components mobile-first (320px-640px base).

**Breakpoints**: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px

**Patterns**: `p-4 md:p-6 lg:p-8`, `text-xl md:text-2xl`, `grid-cols-1 md:grid-cols-2`, `min-h-[44px]` (touch targets), inputs `text-base` (16px+ prevents iOS zoom).

**Checklist**: No horizontal scroll 320-640px, 44x44px touch targets, readable text, scaled images.

---

### Theme Consistency (CRITICAL)

**Colors**: Blue (primary), Green (success), Red (danger), Gray (neutral). ❌ No purple/pink/teal.

**Typography**: h1: `text-2xl md:text-3xl lg:text-4xl font-bold`, h2: `text-xl md:text-2xl font-bold`, h3: `text-lg md:text-xl font-semibold`, body: `text-base`, secondary: `text-sm text-gray-600`, meta: `text-xs text-gray-500`.

**Spacing** (4px base): p-4 (16px), gap-2 (8px), mb-6 (24px).

**Radius**: rounded (4px), rounded-lg (8px DEFAULT), rounded-xl (12px), rounded-full.

**Shadows**: shadow-sm/shadow/shadow-md/shadow-lg ONLY.

**Components**: Button `px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700`, Card `bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6`, Input `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500`, Badge `inline-flex px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800`.

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
    ├── validation.service.ts
    └── geocoding.service.ts
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

### Order Modal Architecture (CRITICAL)

**Modular Order System**: Complex order modal functionality split into specialized hooks for maintainability and testability.

**Hooks**:
1. **useOrderModal** (`hooks/useOrderModal.ts`, 352 lines):
   - Modal state management (edit/view/payment modals)
   - Order CRUD operations (create, update, delete)
   - Integration with useOrderAutosave
   - Keyboard shortcuts (Ctrl/Cmd+S for save)
   - Auth validation with requireAuth
   - Helper: `closeEditOrderModal` for proper form cleanup

2. **useOrderAutosave** (`hooks/useOrderAutosave.ts`, ~113 lines):
   - Automatic saving of order changes (2s debounce)
   - Initial snapshot comparison (prevents saving unchanged data)
   - Autosave state tracking (isAutosaving, lastSaved)
   - Simplified implementation (removed skipNextSave mechanism)

**Recent Improvements (Jan 29, 2026)**:
- Removed ~65 lines of duplicate code from useCampaignDetail (893 → ~828 lines)
- Fixed bug: Products now load correctly in dropdown
- Fixed bug: Existing orders load and display properly
- Fixed bug: More robust autosave prevents data loss
- Centralized order modal logic in useOrderModal
- Refactored handleAddToOrder: backend update first, then open modal (safer approach)
- Simplified useOrderAutosave by removing skipNextSave parameter

**Benefits**:
- Single Responsibility: Each hook has one clear purpose
- No stale closures: Fresh state via proper dependency management
- Bug-free: Comprehensive fixes for products loading, orders displaying, autosave reliability
- Testable: Isolated logic, comprehensive test coverage (24 tests useOrderModal, 15 tests useOrderAutosave)
- Reusable: Can be used in any component needing order management

**Usage Pattern**:
```typescript
const orderModal = useOrderModal({
  orders,
  campaignId,
  user,
  isActive,
  requireAuth,
});

// Access modals
const { isEditOrderModalOpen, editOrderForm, setEditOrderForm } = orderModal;

// Access handlers
const { handleAddToOrder, handleDeleteOrder, handleEditOrder, closeEditOrderModal } = orderModal;

// Access autosave state
const { isAutosaving, lastSaved } = orderModal.autosave;
```

**Shared Types** (`api/types.ts`):
- `OrderForm`: Full form with campaignId
- `OrderFormItem`: Individual item (productId, quantity, product?)

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

### Google OAuth Authentication (CRITICAL)

**Flow** (`backend/src/config/passport.ts`): googleId-first lookup → soft-delete reactivation → account linking → new user creation.

**Logic**:
1. Find by googleId (primary), fallback to email
2. If soft-deleted: reactivate (clear deletedAt/deletedReason, update email/name)
3. If email exists without googleId: link accounts
4. If new: create (password: null, phoneCompleted: false, addressCompleted: false, capitalizeName, queue welcome email)

**Benefits**: googleId as source of truth, prevents account takeover, seamless reactivation, non-blocking email.

**Env**: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL

**Tests**: 13 tests in passport.test.ts (all scenarios covered)

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

# Email Configuration (Optional - for notifications)
RESEND_API_KEY=re_xxx                    # Resend API key (production)
GMAIL_USER=your-email@gmail.com          # Gmail for development
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx   # Gmail app password
EMAIL_FROM=noreply@yourdomain.com        # Sender email
EMAIL_PROVIDER=gmail                     # "resend" or "gmail"

# Redis (Required for email queue)
REDIS_URL=redis://redis:6379
```

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=localhost:3000
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
- PATCH `/complete-address` - Complete user address (zip, street, number, complement, neighborhood, city, state)
- GET `/me`

### Campaigns (`/api/campaigns`)
- GET `/` - List campaigns (filters: nearZipCode, maxDistance for proximity search)
- GET `/:id`
- GET `/:idOrSlug/distance?fromZipCode=X` - Calculate distance from zip code to campaign pickup location
- POST `/`
- PATCH `/:id`
- DELETE `/:id`

### Geocoding (`/api/geocoding`)
- GET `/cep/:cep` - Lookup address by CEP (ViaCEP + BrasilAPI fallback)
- GET `/cep/:cep/coordinates` - Lookup address + coordinates by CEP (Nominatim/OpenStreetMap)

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

### Profile (`/api/profile`)
- PATCH `/` - Update name, phone, password
- POST `/avatar` - Upload avatar (max 5MB, JPEG/PNG/WebP)
- DELETE `/avatar` - Delete avatar
- POST `/change-email` - Request email change (sends verification)
- POST `/verify-email` - Confirm email change with token
- DELETE `/` - Soft delete account (anonymize + invalidate sessions)
- GET `/export` - Export user data (LGPD compliance)

### Email Preferences (`/api/email-preferences`)
- GET `/` - Get user preferences
- PATCH `/` - Update preferences
- POST `/unsubscribe/:token` - Unsubscribe via email link

### Admin (`/api/admin`)
**Dashboard**:
- GET `/dashboard/stats` - Dashboard statistics (users, campaigns, orders, revenue, recent activity)

**User Management**:
- GET `/users` - List users (filters: search, role, isBanned, page)
- GET `/users/:id` - User details with stats
- PATCH `/users/:id` - Edit user (name, email, role)
- POST `/users/:id/ban` - Ban user
- POST `/users/:id/unban` - Unban user
- DELETE `/users/:id` - Delete user (soft delete with anonymization)

**Content Moderation**:
- GET `/content/campaigns` - List campaigns (filters: search, status, page)
- PATCH `/content/campaigns/:id` - Archive/restore campaign
- DELETE `/content/campaigns/:id` - Delete campaign
- GET `/content/messages` - List messages (filter: minSpamScore, page)
- DELETE `/content/messages/:id` - Delete message

**Audit Logs**:
- GET `/audit` - List audit logs (filters: action, targetType, page)

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
- **Admin Routes**: Use `adminAuth` middleware (requireAuth + requireRole('ADMIN') + auto audit logging)
- **Email System**: Queue-based worker with Resend/Gmail, tracks delivery status
- **Soft Delete**: Anonymizes user data (name="Usuário Excluído", email=random@deleted.local) + sets deletedAt
- **Email Verification**: Token-based flow for email changes (pendingEmail → verify → update)
- **Avatar Upload**: Reuses ImageUploadService with folder="avatars", max 5MB, JPEG/PNG/WebP
- **Audit Logs**: All admin actions tracked with IP address + user agent
- **Geocoding**: Multi-provider (ViaCEP + BrasilAPI + Nominatim/OpenStreetMap), Haversine distance calculation, bounding box optimization for proximity queries
- **Pickup Location**: Campaigns can have pickup address with auto-geocoding on create/update
- **Proximity Search**: Filter campaigns by nearZipCode + maxDistance (km), uses bounding box pre-filter + Haversine post-filter

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

## Testing Architecture

### Frontend (Vitest 4.0.15 + RTL)
**Stats**: 607 tests, 50+ files, ~13s, 100% pass. Mock factories in `src/__tests__/mock-data.ts`.

**Patterns**:
1. Multiple elements: `getAllByText()[0]` (mobile+desktop views)
2. Async: `queryAllByText().length > 0` check
3. Behavior over attributes: `toHaveFocus()` not `autoFocus`
4. Flexible mocks: call count + `toMatchObject()`
5. Complex components: `waitFor` timeout 5000ms
6. Avoid hoisting issues: Use `vi.mocked()` instead of direct variable references

**Example**: `render(<Card campaign={createMockCampaign()} />); expect(screen.getAllByText('Ativa')[0]).toBeInTheDocument();`

**Commands**: `npm test --workspace=frontend`, `npm run test:ui --workspace=frontend`, `npm run test:coverage --workspace=frontend`

### Backend (Jest 29.7.0 + ts-jest)
**Stats**: 55 tests, <1s, 100% pass. Files: money.test.ts (31), nameFormatter.test.ts (11), passport.test.ts (13).

**Coverage**: Money utility (distributeProportionally guarantees exact sum), name capitalization, OAuth flow.

**Commands**: `npm test --workspace=backend`, `npm run test:coverage --workspace=backend`

**Total**: 662 tests (607 frontend + 55 backend), 100% success

---

## Recent Updates

### January 2026 - Order Modal Refactoring, Pickup Location, Proximity Search, Profile, Email, Admin & OAuth
**Order Modal Refactoring (latest - Jan 29)**: Consolidated and simplified order modal logic:
- **Phase 1 (Early Jan)**: Split from useCampaignDetail (1130→893 lines) into useOrderModal (352 lines) + useOrderAutosave (118 lines)
- **Phase 2 (Jan 29)**: Removed ~65 lines of duplicate code from useCampaignDetail (893→~828 lines)
- **useOrderModal**: Modal state, CRUD operations, keyboard shortcuts, closeEditOrderModal helper
- **useOrderAutosave**: Simplified to ~113 lines, removed skipNextSave mechanism
- **Bug Fixes**: Products now load in dropdown, existing orders display correctly, more robust autosave
- **Improvements**: Centralized modal logic, refactored handleAddToOrder (backend first, then modal), safer approach
- **Tests**: 24 tests useOrderModal.test.ts (100%), 15 tests useOrderAutosave.test.ts (100%)
- **Total removed**: ~302 lines from useCampaignDetail across both refactoring phases

**Pickup & Proximity**: Campaign pickup address (9 fields: zip, street, number, complement, neighborhood, city, state, lat, lng), user default address (9 fields + addressCompleted flag), geocoding service (ViaCEP + BrasilAPI + Nominatim/OpenStreetMap), Haversine distance calculation, proximity search (nearZipCode + maxDistance), Leaflet/OpenStreetMap maps, CEP input with auto-lookup, multi-step CompleteProfile (phone + address), distance badges on campaign cards.

**New Components**: CepInput, AddressForm, Map, DistanceBadge (ui/), ProximitySearch (campaign/), ProfileAddressSection (profile/), CampaignLocationSection, CampaignLocationMap (campaign-detail/), geocoding.service.ts (api/).

**New Backend**: geocodingService.ts, distance.ts utils, geocoding routes, pickup fields in Campaign schema, address fields in User schema, complete-address auth endpoint, proximity query filters, auto-geocoding on campaign create/update.

**Profile & Admin**: User profile (avatar, email verification, soft delete, LGPD export), email system (Bull queue, Resend/Gmail, tracking), admin panel (dashboard, user/campaign/message moderation, audit logs), enhanced Google OAuth (googleId-first lookup, account linking, soft-delete reactivation, addressCompleted: false).

**Components**: Profile (6 components), Avatar UI, CompleteProfile flow (multi-step: phone + address), EmailPreferences, 6 admin pages, AdminRoute.

**Tests**: 662 total (607 frontend + 55 backend), 100% pass. Fixed vitest.config.ts with React plugin. Added passport.test.ts (13), nameFormatter.test.ts (11), notification tests (42), useOrderModal.test.ts (24). Fixed mock verification in useOrderModal tests (Jan 29).

**Mobile Fix**: NotificationDropdown now uses `fixed` positioning + z-[100] + buttonRef for proper mobile display.

### December 2025 - Modular Architecture & Testing
**Refactoring**: CampaignDetail 2562→150 lines, 28→81 components, API split into 13 files (services pattern).

**Tests**: 164 campaign listing tests, 34 reliability fixes (98.8% success), established patterns (getAllByText()[0], queryAllByText(), waitFor 5000ms).

**Features**: Campaign Q&A, notifications, feedback, spam detection, XSS protection (sanitize.ts).
