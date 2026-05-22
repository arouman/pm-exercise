# Design System

A short reference for the visual + interaction conventions baked into the starter. The actual source of truth is [client/src/theme.js](./client/src/theme.js) and [client/src/components/](./client/src/components/). This doc explains the **why** so you can extend without breaking the feel.

## Goals

1. **Look like a real construction-tech product**, not a hackathon demo.
2. **Be opinionated enough** that you don't waste time picking colors / fonts / spacing.
3. **Be small enough** that you can extend it (your rental UI) without fighting it.

If something doesn't fit your rental flows, change it — but understand the existing choice first.

## Tokens

### Palette

| Role | Token | Hex | Use for |
|---|---|---|---|
| Primary | `palette.primary.main` | `#3B5BDB` | Nav active states, primary buttons, links, brand accents |
| Secondary | `palette.secondary.main` | `#F59F00` | High-attention CTAs only — sparingly |
| Success | `palette.success.main` | `#10B981` | Settled / received / complete states |
| Warning | `palette.warning.main` | `#F59F00` | Partial / pending / in-flight states |
| Info | `palette.info.main` | `#3B82F6` | Submitted / informational tags |
| Error | `palette.error.main` | `#EF4444` | On-hold / low-stock / blocked states |
| Background page | `palette.background.default` | `#F8FAFC` | The app canvas |
| Background surface | `palette.background.paper` | `#FFFFFF` | Cards, drawers, AppBar |
| Text primary | `palette.text.primary` | `#0F172A` | Body, headings |
| Text secondary | `palette.text.secondary` | `#64748B` | Labels, captions, helper text |
| Divider | `palette.divider` | `#E2E8F0` | Borders, table separators |

Status colors are **semantic**, never decorative. Don't use red for emphasis if the thing isn't broken.

### Typography

Font: **Inter**, loaded via `@fontsource/inter` (no CDN fetch).

| Token | Size / Weight | Use for |
|---|---|---|
| `h1` | 32 / 700 | Page titles (1 per page) |
| `h2` | 24 / 700 | Section headings, drawer titles |
| `h3` | 20 / 600 | Card headings |
| `h4` | 17 / 600 | Project card names, drawer-internal section titles |
| `h5` | 15 / 600 | Inline labels |
| `h6` | 13 / 600 / UPPER | Field labels (form-style) |
| `body1` | 14 / 400 | Default body text |
| `body2` | 13 / 400 | Tighter body text |
| `caption` | 12 / 400 | Hints, timestamps, secondary detail |
| `button` | 14 / 600 | Buttons (no uppercase) |

For SKUs, PO numbers, and IDs use `fontFamily: 'ui-monospace, monospace'`.

### Spacing & radii

- **Base unit:** 8px (MUI default). Use `sx={{ p: 3 }}` (= 24px), not raw pixels.
- **Page padding:** `px: {xs: 2, md: 4}` (16/32) and `py: {xs: 2, md: 4}`. Already applied in `AppLayout`.
- **Card spacing:** 24px between cards (`spacing={3}` on `<Grid container>`).
- **Border radius:** 8px for most surfaces, 12px for cards, 2px for chips.

## Reusable components

All in [client/src/components/](./client/src/components/). Import and use; don't reimplement.

### `<AppLayout />`

Wraps every routed page. Provides the AppBar (mobile only) and the persistent sidebar (desktop) / temporary drawer (mobile). You won't normally edit this — it's mounted from `App.jsx` as a parent route. Pages render into `<Outlet />`.

### `<NavList onNavigate={fn} />`

The sidebar nav. Edit `client/src/components/NavList.jsx` to add a new top-level route. Pick an icon from `@mui/icons-material` (search by name; the Outlined variant matches our visual weight).

### `<PageHeader title="..." subtitle="..." action={<Button>...</Button>} />`

Use this at the top of every page. Standardizes title size, spacing, and optional right-aligned action.

```jsx
<PageHeader
  title="Rentals"
  subtitle="Manage your owned and external rental fleet across active job sites."
  action={<Button variant="contained">New rental</Button>}
/>
```

### `<StatusChip value="ACTIVE" />`

Maps a known status enum to the right color + readable label. Supported values are in [client/src/components/StatusChip.jsx](./client/src/components/StatusChip.jsx). Add new ones there when you introduce a new status enum (e.g., for a Rental entity).

### `<DetailDrawer open onClose title subtitle width={480}>...</DetailDrawer>`

The single pattern for "click a row, see more." A right-anchored drawer; full-width on mobile, 480px (default) on desktop. Keep the drawer's content scrollable — it'll get long.

```jsx
<DetailDrawer
  open={Boolean(selectedId)}
  onClose={() => setSelectedId(null)}
  title={detail?.name}
  subtitle={detail?.customer}
>
  ...drawer body...
</DetailDrawer>
```

### `<KpiCard label value sub tone={'neutral'|'success'|'warning'|'danger'} icon={<Icon/>} />`

Dashboard metric card. Big number, small label.

### `<EmptyState title subtitle action />`

Centered text + optional CTA for "no rows" states.

### `<LoadingSkeleton rows={6} />`

Plain stack of MUI Skeleton bars for table-row loading states. The DataGrid has its own built-in `loading` prop too — prefer that for grids.

### `<DataGrid>` patterns

Most list pages use MUI X DataGrid. A few conventions:

- `autoHeight` for list pages (no fixed-height container).
- `disableRowSelectionOnClick` and use `onRowClick` to open a `<DetailDrawer>`.
- `getRowId={(r) => r.id}` (cuid strings, not numeric).
- `pageSizeOptions={[10, 25, 50]}` and `initialState.pagination.paginationModel.pageSize = 25`.
- Use `valueFormatter` for currency/date formatting; use `renderCell` only when you need a chip/icon/multi-line cell.

## How to add a new page

Use this as your template — it lines up with the existing pages:

1. **Add a route file** under `src/routes/your-thing.js`. Copy the structure from `src/routes/vendors.js`. Mount it in `src/server.js`.
2. **Add the OpenAPI schema** for your new entity in `src/openapi.js` under `components.schemas`. JSDoc annotations on routes will reference it.
3. **Update the Prisma schema** if you're adding a new entity. Run:
   ```bash
   npx prisma migrate dev --name add_your_thing
   ```
4. **Add a page** under `client/src/pages/YourThingPage.jsx`. Copy from `client/src/pages/PurchaseOrdersPage.jsx` if it's a list-with-drawer-detail; from `ProjectsPage.jsx` if it's a card grid; from `DashboardPage.jsx` if it's a stat-board.
5. **Register the route** in `client/src/App.jsx`.
6. **Add a nav item** in `client/src/components/NavList.jsx` with an icon.
7. **Reload** — Vite HMR and `node --watch` will pick everything up.

That's the whole loop. The whole point of this design system is that you should be able to ship a credible new page in under an hour.

## Anti-patterns to avoid

- ❌ Importing colors directly (e.g., `color: '#3B5BDB'`). Use `theme.palette.primary.main` via `sx` instead — that's how dark mode would work later, and it's how the candidate-reviewer can tell you understood the system.
- ❌ Adding a new color for "rentals." If you genuinely need a new state, add it to the StatusChip map and reuse the existing semantic palette.
- ❌ Writing custom CSS files. Use `sx={{}}` props or `styled()` from `@mui/material`.
- ❌ Building a new "list with click-to-detail" layout from scratch when DataGrid + DetailDrawer would work.
- ❌ Adding a new dependency without first checking whether MUI already has it (date picker? form layouts? selects? all in `@mui/material` or `@mui/x-*`).
