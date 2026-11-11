## Backend Development Rules

- Always use the Money utility for financial calculations; never raw float math.
- Validate inputs with Zod in route files; wrap handlers with `asyncHandler` and throw `AppError` for 4xx/5xx.
- Enforce auth/authorization with `requireAuth`, `requireRole`, and ownership guards.
- Recalculate shipping totals on order create/update/delete.
- Sanitize user content stored or returned to clients.

## Testing Guidelines

- Backend: Jest + ts-jest.