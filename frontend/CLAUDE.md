## Frontend Development Rules

- Mobile-first only: build for 320–640px, then add `sm/md/lg` breakpoints.
- Theme consistency: blue/green/red/gray only; Tailwind scale for spacing; `shadow-sm`/`shadow`/`shadow-md`/`shadow-lg` only.
- Modular architecture: split files >250 lines, extract reusable UI into `ui/`, move logic into hooks.
- API architecture: all calls in `frontend/src/api` services with typed models; no direct axios in components.
- Sanitize any user-provided content using shared sanitize utilities before rendering.
- When touching a component, refactor violations (size, duplication, desktop-first styles).

## Testing Guidelines

Frontend: Vitest + React Testing Library.

