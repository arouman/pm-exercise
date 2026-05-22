# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is the **starter environment for a SubBase Senior PM take-home exercise**. The candidate's deliverable is a working prototype for a **rentals product** layered on top of the existing procurement domain. The rental models, routes, and UI are intentionally absent — adding them is the work.

The full exercise brief, evaluation criteria, and constraints (small team, enterprise concrete-sub customers, mobile field users, must integrate with existing procurement/inventory) are reproduced verbatim in [README.md](./README.md). Read it before making product/UX decisions.

Sibling docs to consult before extending:
- [ARCHITECTURE.md](./ARCHITECTURE.md) — backend/frontend conventions, error/pagination patterns, integration seams already in the schema for rentals (`FLEET_MANAGER` role, `TRANSFER` transaction type, `TOOLS_RENTAL_EXTERNAL` vendor category).
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) — palette/typography tokens, the reusable components (`PageHeader`, `StatusChip`, `DetailDrawer`, `KpiCard`, `EmptyState`), and the "add a new page" loop.
- [AI-CONTEXT.md](./AI-CONTEXT.md) — single-file dump (schema, endpoints, enum values, sample payloads) designed to be pasted into AI tools as context.

## Commands

```bash
npm install        # also runs postinstall: client install + prisma generate + migrate deploy + seed
npm start          # concurrently: Express :3000 + Vite :5173 with hot reload
npm run db:reset   # wipe SQLite, re-migrate, re-seed (deterministic)
npm run format     # prettier --write .
npm run build && npm run start:prod   # prod-style: Express serves built client on :3000
```

After a schema change: `npx prisma migrate dev --name <change>` (auto-applied; restart `npm start`).

There is no test suite, no linter, and no typechecker — the starter is plain JS by design. Don't add TypeScript, Redux, or form libraries unless the user explicitly asks.

## Architecture (the parts that span multiple files)

**Two-process dev loop.** Express API on `:3000` (`node --watch src/server.js`) and Vite dev server on `:5173`. Vite proxies `/api/*` to Express ([client/vite.config.js](./client/vite.config.js)). Always hit the app via `http://localhost:5173` — that's the proxy origin. Swagger UI is at `/api/docs` (proxied) or `http://localhost:3000/api/docs` direct.

**SQLite + Prisma, no enums.** SQLite doesn't support Prisma `enum`, so every enum-like field (`User.role`, `Vendor.category`, `Material.unit`, `*.status`, `InventoryTransaction.type`) is a `String` with the allowed values listed in a comment in [prisma/schema.prisma](./prisma/schema.prisma) and re-declared as a `VALID_X = [...]` constant at the top of the corresponding route file. **When adding an enum-like field, validate it in the route layer** — Prisma will not.

**Routes follow one shape.** Every file in [src/routes/](./src/routes/) is `Router` → `VALID_X` constants → `/** @openapi */` JSDoc above each handler → `try/catch` calling `next(err)`. The global error handler in [src/server.js](./src/server.js) maps `err.status` to the HTTP code; route handlers translate known Prisma error codes (`P2002` → 409, `P2003` → 400, `P2025` → 404) explicitly before throwing. Lists return a flat array (`?limit=&offset=`), not a `{data,total}` envelope. Mount new routers in [src/server.js](./src/server.js) under `/api/<kebab-case>`.

**OpenAPI is generated from JSDoc.** [src/openapi.js](./src/openapi.js) declares component schemas; route handlers reference them in `@openapi` blocks. When you add an entity, add its schema there too — Swagger is how the AI-friendly contract stays in sync.

**Frontend data flow.** All HTTP goes through [client/src/api/client.js](./client/src/api/client.js) (a `fetch` wrapper that throws on non-2xx) and the generic [client/src/hooks/useEntities.js](./client/src/hooks/useEntities.js) hooks (`useEntities(path)` for lists, `useEntity(path, id)` for details). **Don't import `fetch` directly in pages**, and don't add a global state library — TanStack Query is the cache.

**Page vs. drawer.** Top-level entity views are pages under `client/src/pages/` registered in `App.jsx` and `NavList.jsx`. Anything that's a "click a row to see more" lives in a `<DetailDrawer>` inside the parent page — don't add a route for it. The starter pages model both patterns: card grid ([ProjectsPage.jsx](./client/src/pages/ProjectsPage.jsx)), DataGrid + drawer ([PurchaseOrdersPage.jsx](./client/src/pages/PurchaseOrdersPage.jsx), [InventoryPage.jsx](./client/src/pages/InventoryPage.jsx)), stat board ([DashboardPage.jsx](./client/src/pages/DashboardPage.jsx)).

**MUI v5 (not v6).** Grid syntax is the v5 form: `<Grid container spacing={3}><Grid item xs={12} md={6}>…</Grid></Grid>`. Do **not** use the v6 `<Grid size={…}>` syntax — it silently fails to lay out and produces cramped cards. Style with `sx={{}}` or `styled()`, never CSS files, and reference theme tokens (`theme.palette.primary.main`) instead of raw hex.

## Conventions worth not relitigating

- Route paths kebab-case (`/api/purchase-orders`); Prisma models PascalCase singular; fields and JSON keys camelCase mirroring Prisma exactly.
- SKUs, PO numbers, and IDs render in `ui-monospace, monospace`.
- `<StatusChip value="..." />` is the only sanctioned way to render a status — add new states to its map in [client/src/components/StatusChip.jsx](./client/src/components/StatusChip.jsx) rather than coloring chips inline.
- Out of scope on purpose: auth, websockets, file uploads, native mobile, external integrations, tests, Docker. If a rental flow needs auth, mock with a user dropdown — don't bolt on real auth.

## Browser verification

When verifying UI changes visually, prefer the `playwright-cli` skill over `mcp__browsermcp__*` (see `memory/feedback_browser_automation.md`).
