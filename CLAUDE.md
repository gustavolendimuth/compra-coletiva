# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A monorepo for managing collective purchases (compra coletiva) with group management, product catalog, order tracking, and automatic shipping cost distribution. Built as a full-stack TypeScript application with React frontend and Express backend.

## Automated Quality Assurance Workflow (CRITICAL)

**IMPORTANT**: After completing ANY coding task (no matter how small), you MUST proactively run the following agents in this exact order:

### 1. Test Guardian (ALWAYS RUN FIRST)
After completing code changes, IMMEDIATELY use:
```
Task tool → subagent_type='test-guardian'
```

**When to run:**
- ✅ After ANY code change (features, bugs, refactoring, typo fixes, etc.)
- ✅ After modifying database schemas
- ✅ After changing API endpoints
- ✅ After updating business logic
- ✅ After editing existing files
- ✅ After creating new files
- ✅ NO EXCEPTIONS - Always run for any code modification

**What it does:**
- Creates/updates tests for new/modified code
- Runs full test suite (backend + frontend)
- Automatically fixes any test failures
- Reports test coverage and issues

### 2. Documentation Updater (RUN AFTER TESTS PASS)
After test-guardian completes successfully, use:
```
Task tool → subagent_type='documentation-updater'
```

**When to run:**
- ✅ After ANY code change that test-guardian validated
- ✅ After modifying database schemas
- ✅ After adding/changing API endpoints
- ✅ After updating environment variables
- ✅ After architectural changes
- ✅ After creating new services, components, or utilities
- ✅ NO EXCEPTIONS - Always run after test-guardian passes

**What it does:**
- Updates CLAUDE.md with project stats and recent changes
- Updates DEVELOPMENT.md with new features
- Updates README.md if needed
- Ensures documentation stays synchronized with code

### 3. Execution Order (CRITICAL - MANDATORY FOR ALL CODE CHANGES)
```
1. Complete coding task (ANY code modification)
2. Run test-guardian (REQUIRED - NO EXCEPTIONS)
3. Wait for tests to pass
4. Run documentation-updater (REQUIRED - NO EXCEPTIONS)
5. Report completion to user with summary from both agents
```

**ABSOLUTE RULES:**
- ❌ NEVER skip test-guardian - even for trivial changes
- ❌ NEVER skip documentation-updater - always run after tests pass
- ❌ NEVER run documentation-updater before tests pass
- ❌ NEVER forget to report agent results to user
- ❌ NEVER consider a task "complete" without running both agents
- ✅ ALWAYS run both agents sequentially for ANY code change

**Example Complete Workflows:**

**Example 1 - Large Feature:**
```
User: "Add notification system to campaigns"
Assistant: [Implements notification system]
Assistant: "Feature implemented! Running test-guardian..."
[Launches test-guardian → tests pass]
Assistant: "Tests passing! Running documentation-updater..."
[Launches documentation-updater]
Assistant: "✅ Complete! Notification system implemented, tested, and documented."
```

**Example 2 - Small Fix:**
```
User: "Fix typo in error message"
Assistant: [Fixes typo]
Assistant: "Typo fixed! Running test-guardian..."
[Launches test-guardian → tests pass]
Assistant: "Tests passing! Running documentation-updater..."
[Launches documentation-updater]
Assistant: "✅ Complete! Typo fixed, tests verified, and docs updated."
```

**Example 3 - Single Line Change:**
```
User: "Change default port from 3000 to 4000"
Assistant: [Changes port in config]
Assistant: "Port updated! Running test-guardian..."
[Launches test-guardian → tests pass]
Assistant: "Tests passing! Running documentation-updater..."
[Launches documentation-updater]
Assistant: "✅ Complete! Port changed, tested, and documented."
```

**Remember: NO exceptions. Even a single character change requires both agents.**

## Development Commands

### Running the Application
```bash
# Start all services (recommended for development)
docker-compose up

# Start in background
docker-compose up -d

# Stop services (PRESERVES volumes - recommended)
docker-compose down

# Stop and REMOVE volumes (WARNING: deletes database!)
docker-compose down -v

# Run workspaces individually (if needed)
npm run dev --workspace=backend
npm run dev --workspace=frontend
```

**IMPORTANT**: Always use `docker-compose down` (without `-v`) to preserve volumes with dependencies and database data. Only use `docker-compose down -v` when you want to completely reset everything. See [DOCKER_COMMANDS.md](DOCKER_COMMANDS.md) for detailed guide.

### Database Management
```bash
# Access backend container
docker exec -it compra-coletiva-backend sh

# Generate Prisma client (after schema changes)
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name <migration_name>

# Apply migrations in production
npx prisma migrate deploy
# Or via npm script:
npm run prisma:migrate:deploy

# Migrate legacy users (creates virtual users for legacy orders)
npm run fix:legacy-users

# Open Prisma Studio (database GUI at http://localhost:5555)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Building
```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build --workspace=backend
npm run build --workspace=frontend
```

### Cleaning
```bash
# Clean all workspaces
npm run clean

# Clean specific workspace
npm run clean --workspace=backend
```

## Project Statistics

### Backend
- **9 Route Files**: auth, campaigns, products, orders, analytics, messages, campaignMessages, validation, feedback
- **9 Service Files**: shippingCalculator, socketService, campaignScheduler, campaignStatusService, notificationService, spamDetectionService, and more
- **8 Database Models**: User, Campaign, Product, Order, OrderItem, OrderMessage, CampaignMessage, Notification, Feedback

### Frontend
- **28 Components**: Layout, forms, modals, chat systems, mobile menu, and more
- **3 Pages**: Home, CampaignDetail, NewCampaign

### Database Tables
- **User**: Authentication, reputation, spam scoring
- **Campaign**: Collective purchase groups
- **Product**: Items in campaigns
- **Order**: Customer purchases
- **OrderItem**: Product quantities
- **OrderMessage**: Private chat messages
- **CampaignMessage**: Public Q&A system
- **Notification**: Real-time notifications
- **Feedback**: User feedback system
- **Session**: Authentication sessions
- **PasswordResetToken**: Password recovery

## Architecture

### Monorepo Structure
- **Root**: npm workspaces configuration with `backend` and `frontend` workspaces
- **Backend** (`backend/`): Express API with Prisma ORM, Socket.IO for real-time features
- **Frontend** (`frontend/`): React SPA with Vite, Socket.IO client for real-time updates

### Data Model (Prisma Schema)
The core business logic revolves around multiple interconnected entities:

#### Core Business Entities

1. **Campaign**: Container for collective purchases (referred to as "grupo" in the UI)
   - Has many Products, Orders, and CampaignMessages
   - Tracks total `shippingCost` that gets distributed across orders
   - Status: `ACTIVE`, `CLOSED`, `SENT`, or `ARCHIVED`
   - Auto-archives when all orders are paid (via CampaignStatusService)

2. **Product**: Items available in a group
   - Belongs to Campaign
   - Has `price` and `weight` (weight is critical for shipping distribution)

3. **Order**: Customer purchases within a group
   - Belongs to Campaign and User
   - Has many OrderItems and OrderMessages
   - Tracks `subtotal`, `shippingFee`, and `total`
   - Status flags: `isPaid`, `isSeparated`

4. **OrderItem**: Join table with quantity and pricing snapshot
   - Links Order to Product
   - Stores `unitPrice` and `subtotal` at time of order creation

#### Communication Systems

5. **OrderMessage**: Private chat between customer and campaign creator
   - Belongs to Order and User (sender)
   - Tracks read/unread status
   - Real-time updates via Socket.IO

6. **CampaignMessage**: Public Q&A system for campaigns
   - Question from any user, answer from campaign creator
   - Spam detection with scoring (0-100)
   - Rate limiting: 1 message per 2 minutes per campaign, 10 per hour globally
   - Editable for 15 minutes if unanswered
   - Auto-publishes when answered
   - Metadata includes spam analysis factors

#### User Systems

7. **User**: Authentication and reputation
   - Supports email/password and Google OAuth
   - Legacy user flag for pre-authentication orders
   - Reputation fields: `messageCount`, `answeredCount`, `spamScore`, `isBanned`
   - Has many: Campaigns (creator), Orders, Messages, Notifications, Feedback

8. **Notification**: Real-time user notifications
   - Types: `CAMPAIGN_READY_TO_SEND`, `CAMPAIGN_STATUS_CHANGED`, `CAMPAIGN_ARCHIVED`
   - Metadata includes campaign details
   - Real-time delivery via Socket.IO

9. **Feedback**: User feedback and bug reports
   - Types: `BUG`, `SUGGESTION`, `IMPROVEMENT`, `OTHER`
   - Status: `PENDING`, `IN_PROGRESS`, `RESOLVED`, `DISMISSED`
   - Can be anonymous (with email) or authenticated
   - Admin-only management endpoints

### Shipping Distribution System
The `ShippingCalculator` service (`backend/src/services/shippingCalculator.ts`) implements the core business logic:

- **Proportional Distribution**: Group's total shipping cost is distributed to orders based on weight ratio
- **Automatic Recalculation**: Triggered whenever:
  - New order is created
  - Order items are added/removed
  - Order is deleted
  - Group shipping cost is updated
- **Rounding Handling**: Last order receives remaining amount to avoid rounding errors
- **Two-Step Process**:
  1. Calculate order subtotals from items
  2. Distribute shipping proportionally by weight

### Real-Time Communication (Socket.IO)
The application uses Socket.IO for real-time features:

**Server Events (`backend/src/services/socketService.ts`)**:
- `campaign-question-received`: Notify creator of new questions
- `campaign-message-published`: Broadcast answered questions
- `campaign-message-edited`: Notify of question edits
- `campaign-message-deleted`: Notify of spam deletions
- `campaign-updated`: Notify of campaign status changes
- `notification-created`: Deliver notifications in real-time
- `order-chat-message`: Private order messages

**Client Rooms**:
- `user:{userId}`: Per-user notifications
- `campaign:{campaignId}`: Campaign-specific updates
- `order:{orderId}`: Order-specific chat

### Service Layer Architecture

**Core Services**:
1. **ShippingCalculator** (`shippingCalculator.ts`): Proportional shipping distribution
2. **SocketService** (`socketService.ts`): Real-time Socket.IO events
3. **CampaignScheduler** (`campaignScheduler.ts`): Auto-close expired campaigns
4. **CampaignStatusService** (`campaignStatusService.ts`): Auto-archive when fully paid
5. **NotificationService** (`notificationService.ts`): Create and manage notifications
6. **SpamDetectionService** (`spamDetectionService.ts`): Spam scoring and rate limiting

**Spam Detection System**:
- Analyzes 8 factors: URLs, caps ratio, repeated chars, account age, order history, prohibited words, pending messages, user spam history
- Scores 0-100 (higher = more likely spam)
- Rate limits: 1 msg/2min per campaign, 3 msg/min burst, 10 msg/hour global
- User reputation system: rewards answered questions, penalizes spam
- Ban capability for repeat offenders

**Campaign Status Automation**:
- Auto-archive campaigns when all orders are paid (SENT → ARCHIVED)
- Auto-unarchive if payment status changes (ARCHIVED → SENT)
- Notifications sent to creator when ready to send

### API Architecture
- **Routes** (`backend/src/routes/`): Express routers organized by resource
- **Validation**: Zod schemas defined inline in route files
- **Error Handling**: Centralized error handler middleware with `asyncHandler` wrapper and `AppError` class
- **Database Access**: Direct Prisma client usage (no separate repository layer)
- **Authentication**: JWT-based with session management, Google OAuth support
- **Authorization**: Role-based middleware (`requireAuth`, `requireRole`, `requireCampaignOwnership`)

### Frontend Architecture
- **State Management**: React Query (`@tanstack/react-query`) for server state
- **API Client**: Axios instance in `frontend/src/lib/api.ts` with typed functions
- **Routing**: React Router for client-side navigation
- **Styling**: TailwindCSS utility classes
- **Components**: Reusable UI components in `components/`, page components in `pages/`
- **Notifications**: react-hot-toast for user feedback
- **Real-time**: Socket.IO client for live updates
- **Security**: DOMPurify for XSS prevention (`lib/sanitize.ts`)

## Development Patterns

### Financial Calculations (CRITICAL)

**ALWAYS use the Money utility for financial operations**. Never use raw arithmetic operators for money calculations.

```typescript
import { Money } from '../utils/money';

// ✅ CORRECT - Use Money utility
const subtotal = Money.multiply(product.price, item.quantity);
const total = Money.add(subtotal, shippingFee);
const fees = Money.distributeProportionally(totalShipping, weights);
const sum = Money.sum(orderTotals);

// ❌ WRONG - Never use raw operators
const subtotal = product.price * item.quantity;
const total = subtotal + shippingFee;
const rounded = Math.round(value * 100) / 100;
```

**Money Utility Methods:**
- `Money.round(value)` - Round to 2 decimal places
- `Money.add(a, b)` - Addition with rounding
- `Money.subtract(a, b)` - Subtraction with rounding
- `Money.multiply(value, factor)` - Multiplication with rounding
- `Money.divide(value, divisor)` - Division with rounding
- `Money.distributeProportionally(total, weights)` - Proportional distribution (guarantees exact sum)
- `Money.sum(values)` - Sum array of values
- `Money.equals(a, b, tolerance?)` - Compare with tolerance
- `Money.format(value)` - Format as BRL currency
- `Money.isValid(value)` - Validate monetary value

**Why this matters**: The Money utility eliminates floating-point precision errors that caused financial discrepancies. See [FINANCIAL_FIX_SUMMARY.md](FINANCIAL_FIX_SUMMARY.md) for details.

### Adding New API Endpoints
1. Define Zod schema for request validation in route file
2. Use `asyncHandler` wrapper for async route handlers
3. Throw `AppError` for client errors (4xx)
4. Always include necessary Prisma relations in queries
5. If modifying orders/items, call `ShippingCalculator.recalculateOrderSubtotal()` or `distributeShipping()`
6. **Use Money utility for all financial calculations** (price × quantity, totals, etc.)

### Working with Database
- Schema changes require migration: `npx prisma migrate dev --name <description>`
- Always regenerate client after schema changes: `npx prisma generate`
- Use Prisma Studio for data inspection/manipulation during development
- All relations use cascade delete for data integrity

### Frontend API Integration
1. Add TypeScript interface to `frontend/src/lib/api.ts`
2. Create typed API function in appropriate namespace (`campaignApi`, `productApi`, etc.)
3. Use React Query hooks in components for data fetching/mutations
4. Handle optimistic updates for better UX

### Security & XSS Protection (CRITICAL)

**ALWAYS sanitize user-generated content before rendering**. Use the sanitization utilities in `frontend/src/lib/sanitize.ts`:

```typescript
import { sanitizeText, sanitizeHtml } from '../lib/sanitize';

// ✅ CORRECT - Sanitize plain text with line breaks
<p dangerouslySetInnerHTML={{ __html: sanitizeText(message) }} />

// ✅ CORRECT - Sanitize HTML (allows only safe tags)
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(richText) }} />

// ❌ WRONG - Never render user content directly
<p>{userInput}</p>  // If userInput contains HTML, it won't render
<p dangerouslySetInnerHTML={{ __html: userInput }} />  // XSS VULNERABILITY
```

**Sanitization Functions**:
- `sanitizeText(text)`: Escapes HTML, preserves line breaks as `<br>`
- `sanitizeHtml(html)`: Uses DOMPurify, allows only safe tags (b, i, em, strong, u, br, p, span)

**Where to use**:
- Campaign/Order messages (CampaignMessage.question, CampaignMessage.answer)
- User-generated descriptions
- Feedback content
- Any user input displayed in the UI

### Real-Time Features Development

When adding Socket.IO features:

1. **Server-side** (`backend/src/services/socketService.ts`):
   ```typescript
   export const emitCustomEvent = (roomId: string, data: any) => {
     getIO().to(roomId).emit('custom-event', data);
   };
   ```

2. **Client-side** (React component):
   ```typescript
   import { getSocket } from '../lib/socket';

   useEffect(() => {
     const socket = getSocket();
     socket.emit('join-room', roomId);

     socket.on('custom-event', (data) => {
       // Handle event
     });

     return () => {
       socket.off('custom-event');
       socket.emit('leave-room', roomId);
     };
   }, [roomId]);
   ```

3. **Room Management**: Always join/leave rooms in useEffect cleanup

## Environment Configuration

### Automatic Protocol Handling
Both backend and frontend now support automatic protocol (http/https) handling for environment variables:

**Rules:**
- **Local domains** (localhost, 127.0.0.1, 0.0.0.0): Always use `http://`
- **Remote domains**: Use `https://` in production, `http://` in development
- **Manual protocol**: If you specify `http://` or `https://` in the URL, it will be used as-is

### Backend (.env in backend/)
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/compra_coletiva
PORT=3000
NODE_ENV=development

# CORS - Supports multiple domains (comma-separated)
# Examples:
#   Single: localhost:5173
#   Multiple: localhost:5173,mydomain.com
#   With protocol: http://localhost:5173,https://production.com
CORS_ORIGIN=localhost:5173
```

### Frontend (.env in frontend/)
```
# API URL - Protocol will be added automatically based on environment
# Examples:
#   Local: localhost:3000
#   Remote: api.mydomain.com
#   With protocol: https://api.production.com
VITE_API_URL=localhost:3000
```

### Docker Compose
Development setup includes:
- PostgreSQL 16 on port 5432
- Backend on port 3000 with hot reload
- Frontend on port 5173 with Vite HMR
- Volume mounts for live code updates

## Financial Validation & Maintenance

### Validation Scripts

```bash
# Validate financial integrity of all campaigns
docker exec compra-coletiva-backend node scripts/validate-financial-integrity.js

# Recalculate all campaigns (after schema changes or fixes)
docker exec compra-coletiva-backend node scripts/recalculate-all-campaigns.js
```

### Validation API

```bash
# Check specific campaign integrity
GET /api/validation/campaign/:campaignId
```

Returns validation status with three critical checks:
1. Shipping distribution: Sum of order shipping fees = campaign shipping cost
2. Total calculation: Sum of order totals = sum of subtotals + shipping cost
3. Paid/Unpaid sum: Sum of paid + unpaid orders = sum of all order totals

### Financial Integrity Rules

Every campaign must satisfy:
- `Σ(order.shippingFee) = campaign.shippingCost`
- `Σ(order.total) = Σ(order.subtotal) + campaign.shippingCost`
- `Σ(paid orders) + Σ(unpaid orders) = Σ(all orders)`

If any validation fails, investigate before deploying to production.

## Legacy Users & Data Migration

### User Authentication System
The system differentiates between real users and legacy virtual users:

- **Real Users** (`isLegacyUser = false`):
  - Can login with email/password or Google OAuth
  - Have unique names (enforced by partial unique index)
  - Can create campaigns and place orders

- **Legacy Virtual Users** (`isLegacyUser = true`):
  - Created automatically for orders that existed before authentication system
  - Cannot login (no password, email domain `@legacy.local`)
  - Allow duplicate names (to preserve historical data)
  - Each `customerName` from legacy orders gets its own virtual user

### Migration Commands

```bash
# Apply schema migration (adds isLegacyUser field)
npm run prisma:migrate:deploy

# Migrate legacy order data (creates virtual users)
npm run fix:legacy-users

# Validate data integrity after migration
npm run validate:financial
```

**Documentation**: See [`QUICK_START_LEGACY_MIGRATION.md`](QUICK_START_LEGACY_MIGRATION.md) for complete guide.

## API Endpoints Summary

### Authentication (`/api/auth`)
- POST `/register` - Register new user
- POST `/login` - Login with email/password
- POST `/google` - Google OAuth login
- GET `/me` - Get current user
- POST `/logout` - Logout current session

### Campaigns (`/api/campaigns`)
- GET `/` - List all campaigns
- GET `/:id` - Get campaign details
- POST `/` - Create campaign (auth required)
- PATCH `/:id` - Update campaign (owner only)
- DELETE `/:id` - Delete campaign (owner only)

### Products (`/api/products`)
- GET `/?campaignId=xxx` - List products in campaign
- POST `/` - Add product (auth required)
- PATCH `/:id` - Update product
- DELETE `/:id` - Delete product

### Orders (`/api/orders`)
- GET `/?campaignId=xxx` - List orders in campaign
- POST `/` - Create order (auth required)
- PATCH `/:id` - Update order
- PATCH `/:id/payment` - Toggle payment status
- DELETE `/:id` - Delete order

### Campaign Messages (`/api/campaign-messages`)
- GET `/?campaignId=xxx` - List public Q&As (no auth)
- GET `/mine?campaignId=xxx` - Get my questions (auth)
- GET `/unanswered?campaignId=xxx` - Get unanswered (creator only)
- POST `/` - Ask question (auth, rate limited)
- PATCH `/:id` - Edit question (15min window, author only)
- PATCH `/:id/answer` - Answer question (creator only, auto-publishes)
- DELETE `/:id` - Delete spam (creator only)

### Feedback (`/api/feedback`)
- POST `/` - Submit feedback (auth optional, email required if anonymous)
- GET `/` - List all feedback (admin only)
- GET `/my` - Get my feedback (auth required)
- GET `/stats` - Get statistics (admin only)
- PATCH `/:id` - Update status (admin only)
- DELETE `/:id` - Delete feedback (admin only)

### Notifications (`/api/notifications`)
- GET `/` - List my notifications
- PATCH `/:id/read` - Mark as read
- DELETE `/:id` - Delete notification

### Analytics (`/api/analytics`)
- GET `/campaign/:campaignId` - Campaign statistics

### Validation (`/api/validation`)
- GET `/campaign/:campaignId` - Validate financial integrity

## Important Notes

- **Shipping Recalculation**: Any order modification must trigger shipping recalculation to maintain accuracy
- **Price Snapshots**: OrderItem stores `unitPrice` at creation time to preserve historical pricing
- **Cascade Deletes**: Deleting groups removes all associated products/orders; deleting orders removes items
- **Monorepo Commands**: Use `--workspace=<name>` or `--workspaces` flags for npm scripts
- **Container First**: Development primarily uses Docker Compose; running services directly is optional
- **Financial Precision**: Always use Money utility for calculations - see Financial Calculations section above
- **User Name Uniqueness**: Only enforced for non-legacy users via partial unique index and application-level validation
- **XSS Protection**: Always use sanitization utilities for user-generated content
- **Socket.IO**: Real-time features require proper room management (join/leave in useEffect cleanup)
- **Rate Limiting**: Campaign messages are rate-limited to prevent spam

## Recent Updates

### December 4, 2025 - Campaign Q&A, Notifications, and Feedback Systems

**New Features:**

1. **Campaign Q&A System** (Public Q&A for campaigns)
   - Database: `CampaignMessage` model with question/answer fields
   - Routes: `/api/campaign-messages` (9 endpoints: list, create, edit, answer, delete, etc.)
   - Components: `CampaignChat.tsx` (user view), `CampaignQuestionsPanel.tsx` (creator moderation)
   - Features:
     - Public Q&A visible to all users
     - Private questions until answered by creator
     - 15-minute edit window for unanswered questions
     - Spam detection with 8-factor scoring system
     - Rate limiting: 1 msg/2min per campaign, 10/hour global
     - User reputation system (messageCount, answeredCount, spamScore)
     - Real-time notifications via Socket.IO

2. **Notification System**
   - Database: `Notification` model with types and metadata
   - Service: `NotificationService` for creating and managing notifications
   - Types: `CAMPAIGN_READY_TO_SEND`, `CAMPAIGN_STATUS_CHANGED`, `CAMPAIGN_ARCHIVED`
   - Real-time delivery via Socket.IO to user-specific rooms
   - Auto-notification when campaign is ready to send (all orders paid)

3. **Feedback System**
   - Database: `Feedback` model with types and status tracking
   - Routes: `/api/feedback` (7 endpoints for CRUD and stats)
   - Component: `FeedbackModal.tsx` (user-facing modal)
   - Types: `BUG`, `SUGGESTION`, `IMPROVEMENT`, `OTHER`
   - Status workflow: `PENDING` → `IN_PROGRESS` → `RESOLVED`/`DISMISSED`
   - Supports anonymous feedback (with email) or authenticated
   - Admin-only management interface via API

4. **Spam Detection Service**
   - Service: `SpamDetectionService` with comprehensive scoring
   - Analyzes 8 factors: URLs, excessive caps, repeated chars, account age, order history, prohibited words, pending messages, spam history
   - Rate limiting with retry-after calculation
   - User reputation management (rewards good behavior, penalizes spam)
   - Ban capability for repeat offenders

5. **Campaign Status Automation**
   - Service: `CampaignStatusService` for automatic status management
   - Auto-archive campaigns when all orders are paid (SENT → ARCHIVED)
   - Auto-unarchive if payment status changes (ARCHIVED → SENT)
   - Integrated with NotificationService for user alerts

6. **XSS Protection**
   - Utility: `frontend/src/lib/sanitize.ts` with DOMPurify
   - Functions: `sanitizeText()` and `sanitizeHtml()`
   - Applied to all user-generated content rendering

**Database Changes:**
- Added `CampaignMessage` table for Q&A system
- Added `Notification` table for real-time notifications
- Added `Feedback` table for user feedback
- Extended `User` model with: `messageCount`, `answeredCount`, `spamScore`, `lastMessageAt`, `isBanned`
- Added enums: `NotificationType`, `FeedbackType`, `FeedbackStatus`

**Modified Files:**
- `backend/src/index.ts`: Registered new routes (campaignMessages, feedback)
- `backend/src/routes/orders.ts`: Integrated CampaignStatusService and NotificationService
- `backend/src/services/socketService.ts`: Added events for Q&A, notifications
- `frontend/src/components/Layout.tsx`: Added feedback modal integration
- `frontend/src/components/OrderChat.tsx`: Applied XSS sanitization
- `frontend/src/lib/api.ts`: Added API functions for new endpoints
- `frontend/src/pages/CampaignDetail.tsx`: Integrated CampaignChat component
- `frontend/package.json`: Added `dompurify` and `@types/dompurify` dependencies

**Documentation Cleanup:**
- Removed 12 obsolete documentation files (feature-specific guides, implementation notes, test credentials)
- Consolidated information into main documentation files
