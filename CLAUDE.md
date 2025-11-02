# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A monorepo for managing collective purchases (compra coletiva) with group management, product catalog, order tracking, and automatic shipping cost distribution. Built as a full-stack TypeScript application with React frontend and Express backend.

## Development Commands

### Running the Application
```bash
# Start all services (recommended for development)
docker-compose up

# Run workspaces individually (if needed)
npm run dev --workspace=backend
npm run dev --workspace=frontend
```

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

### Adding New API Endpoints
1. Define Zod schema for request validation in route file
2. Use `asyncHandler` wrapper for async route handlers
3. Throw `AppError` for client errors (4xx)
4. Always include necessary Prisma relations in queries
5. If modifying orders/items, call `ShippingCalculator.recalculateOrderSubtotal()` or `distributeShipping()`

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

### Backend (.env in backend/)
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/compra_coletiva
PORT=3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env in frontend/)
```
VITE_API_URL=http://localhost:3000
```

### Docker Compose
Development setup includes:
- PostgreSQL 16 on port 5432
- Backend on port 3000 with hot reload
- Frontend on port 5173 with Vite HMR
- Volume mounts for live code updates

## Important Notes

- **Shipping Recalculation**: Any order modification must trigger shipping recalculation to maintain accuracy
- **Price Snapshots**: OrderItem stores `unitPrice` at creation time to preserve historical pricing
- **Cascade Deletes**: Deleting groups removes all associated products/orders; deleting orders removes items
- **Monorepo Commands**: Use `--workspace=<name>` or `--workspaces` flags for npm scripts
- **Container First**: Development primarily uses Docker Compose; running services directly is optional
