# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A monorepo for managing collective purchases (compra coletiva) with group management, product catalog, order tracking, and automatic shipping cost distribution. Built as a full-stack TypeScript application with React frontend and Express backend.

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

## Architecture

### Monorepo Structure
- **Root**: npm workspaces configuration with `backend` and `frontend` workspaces
- **Backend** (`backend/`): Express API with Prisma ORM
- **Frontend** (`frontend/`): React SPA with Vite

### Data Model (Prisma Schema)
The core business logic revolves around four main entities:

1. **Campaign**: Container for collective purchases (referred to as "grupo" in the UI)
   - Has many Products and Orders
   - Tracks total `shippingCost` that gets distributed across orders
   - Status: `ACTIVE`, `CLOSED`, or `ARCHIVED`

2. **Product**: Items available in a group
   - Belongs to Campaign
   - Has `price` and `weight` (weight is critical for shipping distribution)

3. **Order**: Customer purchases within a group
   - Belongs to Campaign
   - Has many OrderItems
   - Tracks `subtotal`, `shippingFee`, and `total`
   - Status flags: `isPaid`, `isSeparated`

4. **OrderItem**: Join table with quantity and pricing snapshot
   - Links Order to Product
   - Stores `unitPrice` and `subtotal` at time of order creation

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

### API Architecture
- **Routes** (`backend/src/routes/`): Express routers organized by resource
- **Validation**: Zod schemas defined inline in route files
- **Error Handling**: Centralized error handler middleware with `asyncHandler` wrapper and `AppError` class
- **Database Access**: Direct Prisma client usage (no separate repository layer)

### Frontend Architecture
- **State Management**: React Query (`@tanstack/react-query`) for server state
- **API Client**: Axios instance in `frontend/src/lib/api.ts` with typed functions
- **Routing**: React Router for client-side navigation
- **Styling**: TailwindCSS utility classes
- **Components**: Reusable UI components in `components/`, page components in `pages/`
- **Notifications**: react-hot-toast for user feedback

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

## Important Notes

- **Shipping Recalculation**: Any order modification must trigger shipping recalculation to maintain accuracy
- **Price Snapshots**: OrderItem stores `unitPrice` at creation time to preserve historical pricing
- **Cascade Deletes**: Deleting groups removes all associated products/orders; deleting orders removes items
- **Monorepo Commands**: Use `--workspace=<name>` or `--workspaces` flags for npm scripts
- **Container First**: Development primarily uses Docker Compose; running services directly is optional
- **Financial Precision**: Always use Money utility for calculations - see Financial Calculations section above
- **User Name Uniqueness**: Only enforced for non-legacy users via partial unique index and application-level validation
