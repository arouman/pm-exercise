# AI-CONTEXT

This file is engineered for **paste-into-AI consumption**. It contains everything an AI tool (Cursor, Claude Code, Copilot, GitHub Copilot Workspace, etc.) needs to help you extend the starter without hallucinating: tech stack, data model, full endpoint list with payloads, design-system inventory, and the rental-extension expectations.

If you're prompting an AI, paste this file plus the part of the codebase you're working on. That's usually enough.

---

## Tech stack (one-liner)

Node.js 20 + Express 4 + Prisma (SQLite) on the server. React 18 + Vite + Material UI v5 + MUI X DataGrid + TanStack Query + React Router v6 on the client. All plain JavaScript (ESM / JSX), no TypeScript.

## What's already built

A polished read-only data explorer covering the existing SubBase domain: **vendors, materials, projects, purchase orders, deliveries, inventory** (with transactions). Use this as the substrate to design rental equipment management on top of. The rental domain is **not** modeled in any layer — that's the deliverable.

---

## Data model (Prisma schema, inline)

SQLite doesn't support Prisma enums, so enum-like fields are `String` with allowed values listed in comments. Server-side route handlers validate them. The full file is at [prisma/schema.prisma](./prisma/schema.prisma).

```prisma
model User {
  id    String @id @default(cuid())
  name  String
  email String @unique
  role  String // PROCUREMENT | SUPERINTENDENT | FLEET_MANAGER
  // relations: projects, purchaseOrders, deliveriesReceived, inventoryTransactions
  createdAt DateTime @default(now())
}

model Vendor {
  id           String @id @default(cuid())
  name         String
  category     String // CONCRETE | REBAR | FASTENERS | LUMBER | ELECTRICAL | TOOLS_RENTAL_EXTERNAL
  contactEmail String
  contactPhone String
  paymentTerms String
  // relations: materials, purchaseOrders
}

model Material {
  id        String @id @default(cuid())
  sku       String @unique
  name      String
  category  String // matches Vendor.category
  unit      String // EA | LF | CY | LB | BAG
  unitPrice Float
  vendorId  String  // → Vendor.id
  // relations: poLines, inventoryItems, inventoryTransactions
}

model Project {
  id               String   @id @default(cuid())
  name             String
  customer         String   // "Turner Construction", "Baker Concrete", "Neon"
  address          String
  status           String   // ACTIVE | COMPLETED | ON_HOLD
  startDate        DateTime
  projectedEndDate DateTime?
  // relations: users (via ProjectUser), purchaseOrders, inventoryItems, inventoryTransactions
}

model ProjectUser {
  projectId String  // → Project.id
  userId    String  // → User.id
  @@id([projectId, userId])
}

model PurchaseOrder {
  id               String   @id @default(cuid())
  poNumber         String   @unique
  status           String   // DRAFT | SUBMITTED | PARTIALLY_RECEIVED | RECEIVED | CLOSED
  total            Float
  expectedDelivery DateTime?
  vendorId         String   // → Vendor.id
  projectId        String   // → Project.id
  createdById      String   // → User.id
  // relations: lines (PurchaseOrderLine), deliveries
  createdAt        DateTime @default(now())
}

model PurchaseOrderLine {
  id              String @id @default(cuid())
  purchaseOrderId String  // → PurchaseOrder.id (cascade delete)
  materialId      String  // → Material.id
  quantity        Float
  unitPrice       Float
  lineTotal       Float
}

model Delivery {
  id              String   @id @default(cuid())
  deliveredAt     DateTime
  status          String   // PENDING | PARTIAL | COMPLETE
  notes           String?
  purchaseOrderId String   // → PurchaseOrder.id
  receivedById    String   // → User.id
  // relations: lines (DeliveryLine)
}

model DeliveryLine {
  id                  String @id @default(cuid())
  deliveryId          String  // → Delivery.id (cascade delete)
  purchaseOrderLineId String  // → PurchaseOrderLine.id
  quantityReceived    Float
}

model InventoryItem {
  id             String   @id @default(cuid())
  materialId     String   // → Material.id
  projectId      String   // → Project.id
  quantityOnHand Float
  lastUpdatedAt  DateTime @default(now())
  @@unique([materialId, projectId])
}

model InventoryTransaction {
  id            String   @id @default(cuid())
  type          String   // IN | OUT | TRANSFER
  quantity      Float
  reference     String?
  materialId    String   // → Material.id
  projectId     String   // → Project.id
  fromProjectId String?  // → Project.id (TRANSFER only)
  userId        String   // → User.id
  createdAt     DateTime @default(now())
}
```

### Enum-like value tables

| Field | Values |
|---|---|
| `User.role` | `PROCUREMENT`, `SUPERINTENDENT`, `FLEET_MANAGER` |
| `Vendor.category` / `Material.category` | `CONCRETE`, `REBAR`, `FASTENERS`, `LUMBER`, `ELECTRICAL`, `TOOLS_RENTAL_EXTERNAL` |
| `Material.unit` | `EA`, `LF`, `CY`, `LB`, `BAG` |
| `Project.status` | `ACTIVE`, `COMPLETED`, `ON_HOLD` |
| `PurchaseOrder.status` | `DRAFT`, `SUBMITTED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CLOSED` |
| `Delivery.status` | `PENDING`, `PARTIAL`, `COMPLETE` |
| `InventoryTransaction.type` | `IN`, `OUT`, `TRANSFER` |

---

## API endpoint reference

Base URL in dev: `http://localhost:5173/api` (Vite proxies to Express). Direct: `http://localhost:3000/api`. Interactive Swagger: `http://localhost:5173/api/docs`. Raw OpenAPI JSON: `/api/openapi.json`.

| Method | Path | Purpose | Key query params |
|---|---|---|---|
| GET | `/api/health` | Liveness | — |
| GET | `/api/users` | List users | `role` |
| GET | `/api/users/:id` | One user + project assignments | — |
| GET | `/api/vendors` | List vendors w/ material counts | `category` |
| POST | `/api/vendors` | Create vendor | — |
| GET | `/api/vendors/:id` | One vendor + materials | — |
| PUT | `/api/vendors/:id` | Update vendor | — |
| DELETE | `/api/vendors/:id` | Delete vendor | — |
| GET | `/api/materials` | List materials w/ vendor | `vendorId`, `category` |
| POST | `/api/materials` | Create material | — |
| GET | `/api/materials/:id` | One material | — |
| PUT | `/api/materials/:id` | Update material | — |
| DELETE | `/api/materials/:id` | Delete material | — |
| GET | `/api/projects` | List projects + counts | `status` |
| POST | `/api/projects` | Create project | — |
| GET | `/api/projects/:id` | One project + team | — |
| PUT | `/api/projects/:id` | Update project | — |
| GET | `/api/purchase-orders` | List POs w/ vendor + project + line count | `status`, `projectId`, `vendorId` |
| POST | `/api/purchase-orders` | Create PO + lines (server computes totals) | — |
| GET | `/api/purchase-orders/:id` | One PO + lines + deliveries | — |
| PUT | `/api/purchase-orders/:id` | Update PO top-level fields | — |
| GET | `/api/deliveries` | List deliveries w/ PO + vendor + project | `status`, `purchaseOrderId` |
| POST | `/api/deliveries` | Record delivery | — |
| GET | `/api/deliveries/:id` | One delivery + lines + material | — |
| GET | `/api/inventory` | Stock by (material × project) | `projectId`, `materialId`, `lowStock=true` |
| GET | `/api/inventory/transactions` | Transaction history | `projectId`, `materialId`, `type`, `limit` |
| POST | `/api/inventory/transactions` | Record IN / OUT / TRANSFER | — |

### Sample payloads

**`GET /api/projects`** →
```json
[
  {
    "id": "prj_hudson",
    "name": "Hudson Yards Phase 3 — Foundation",
    "customer": "Turner Construction",
    "address": "500 W 33rd St, New York, NY 10001",
    "status": "ACTIVE",
    "startDate": "2026-01-08T00:00:00.000Z",
    "projectedEndDate": "2026-11-30T00:00:00.000Z",
    "createdAt": "2026-05-22T13:00:00.000Z",
    "_count": { "purchaseOrders": 5, "users": 4, "inventoryItems": 7 }
  }
]
```

**`GET /api/purchase-orders/:id`** →
```json
{
  "id": "po_1002",
  "poNumber": "PO-1002",
  "status": "PARTIALLY_RECEIVED",
  "total": 16185.00,
  "expectedDelivery": "2026-05-18T00:00:00.000Z",
  "vendor":  { "id": "vnd_rebar", "name": "Ironline Reinforcement Co.", "category": "REBAR" },
  "project": { "id": "prj_hudson", "name": "Hudson Yards Phase 3 — Foundation", "customer": "Turner Construction" },
  "createdBy": { "id": "usr_proc_1", "name": "Diana Chen", "role": "PROCUREMENT" },
  "lines": [
    { "id": "pol_1002_1", "materialId": "mat_r_5", "quantity": 4200, "unitPrice": 2.40, "lineTotal": 10080.00,
      "material": { "id": "mat_r_5", "sku": "RBR-5", "name": "#5 Rebar Grade 60, 20 ft", "unit": "LF" } }
  ],
  "deliveries": [
    { "id": "del_1002a", "deliveredAt": "2026-05-10T13:00:00.000Z", "status": "PARTIAL", "notes": "First load, #5 only." }
  ]
}
```

**`POST /api/purchase-orders`** ← request body:
```json
{
  "poNumber": "PO-9999",
  "status": "SUBMITTED",
  "expectedDelivery": "2026-07-01T00:00:00.000Z",
  "vendorId": "vnd_concrete",
  "projectId": "prj_hudson",
  "createdById": "usr_proc_1",
  "lines": [
    { "materialId": "mat_c_5000", "quantity": 80, "unitPrice": 185.00 }
  ]
}
```
Server computes `lineTotal` and PO `total`; you don't send them.

**`POST /api/inventory/transactions`** ← request body:
```json
{
  "type": "TRANSFER",
  "quantity": 200,
  "reference": "Moved skid steer from LAX to Hudson",
  "materialId": "mat_t_skidsteer",
  "projectId": "prj_hudson",
  "fromProjectId": "prj_lax",
  "userId": "usr_fleet_1"
}
```

---

## Frontend component inventory

All in [client/src/components/](./client/src/components/). Use them — they encode the design system.

| Component | Purpose | Key props |
|---|---|---|
| `AppLayout` | Sidebar + content shell, mounted as parent route | none (uses `<Outlet/>`) |
| `NavList` | Sidebar nav items | `onNavigate` |
| `PageHeader` | Page top: title + subtitle + action | `title`, `subtitle?`, `action?` |
| `StatusChip` | Semantic chip for any known status enum | `value`, `size?` |
| `DetailDrawer` | Right-side slide-in detail panel | `open`, `onClose`, `title`, `subtitle?`, `width?`, `children` |
| `KpiCard` | Dashboard metric card | `label`, `value`, `sub?`, `icon?`, `tone?` ('neutral'\|'success'\|'warning'\|'danger') |
| `EmptyState` | "No rows" placeholder | `title`, `subtitle?`, `action?` |
| `LoadingSkeleton` | Stack of skeleton rows | `rows?` |

Data hooks in [client/src/hooks/useEntities.js](./client/src/hooks/useEntities.js):

```js
const { data, isLoading, error } = useEntities('/api/vendors');
const { data: detail } = useEntity(selectedId ? `/api/vendors/${selectedId}` : null);
```

API wrapper at [client/src/api/client.js](./client/src/api/client.js): `api.get`, `api.post`, `api.put`, `api.del`. All throw on non-2xx with the server's `error` message.

---

## Theme tokens (key)

| Token | Value |
|---|---|
| `palette.primary.main` | `#3B5BDB` |
| `palette.secondary.main` | `#F59F00` |
| `palette.success.main` | `#10B981` |
| `palette.warning.main` | `#F59F00` |
| `palette.error.main` | `#EF4444` |
| `palette.background.default` | `#F8FAFC` |
| `palette.background.paper` | `#FFFFFF` |
| `palette.text.primary` | `#0F172A` |
| `palette.text.secondary` | `#64748B` |
| `palette.divider` | `#E2E8F0` |
| `shape.borderRadius` | `8` |
| Typography | Inter 300/400/500/600/700 |
| Page padding | `{ xs: 2, md: 4 }` (=16/32px) |

Full theme in [client/src/theme.js](./client/src/theme.js).

---

## How to extend for rentals

You'll likely need to model and ship some subset of these:

| New entity (suggested) | Existing entities to relate to |
|---|---|
| `Equipment` (owned/managed asset) | `Project` (current site), `Vendor` (originating supplier if relevant) |
| `Rental` or `RentalAgreement` (contract with end-customer) | `Project`, `User`, `Equipment` |
| `RentalLine` / `EquipmentAssignment` | `Equipment`, `Project`, time range |
| `MaintenanceRecord` | `Equipment`, `User` |
| `EquipmentStatus` / `Availability` | `Equipment`, optional `Project` |

Things to consider given the existing seams:

- **Field user UX.** The brief calls out field superintendents on mobile in spotty connectivity. The starter is responsive; design your rental check-in/out flows for the mobile breakpoint (the sidebar collapses below `md`).
- **Procurement integration.** External rentals already flow through `PurchaseOrder` + `Vendor.category = TOOLS_RENTAL_EXTERNAL`. You can either keep that as the "rent from outside" path and add owned-fleet management separately, or unify them — argue your choice in the writeup.
- **Inventory parallel.** `InventoryTransaction.type = 'TRANSFER'` exists already for material moves; equipment moves between sites are conceptually similar. Consider reusing or paralleling that model.
- **Roles.** `FLEET_MANAGER` is already seeded as a role and as a user (`Robin Castillo`). Use it.
- **Status semantics.** Match the existing status enums' style (uppercase snake_case strings) and add to `StatusChip` so colors stay consistent.

### Practical AI prompt template

> I'm extending the SubBase take-home starter (Node + Express + Prisma + SQLite backend; React + Vite + MUI + react-query frontend). Here's [AI-CONTEXT.md content]. I want to add rental equipment management. **The first piece I'm building is X**. Help me:
> 1. Design the Prisma model additions.
> 2. Sketch the API routes following the existing `src/routes/*.js` conventions.
> 3. Build a list-with-detail-drawer page using the existing `<PageHeader>`, `<DataGrid>`, `<DetailDrawer>`, `<StatusChip>` patterns.
> 4. Add the new page to the route table in `App.jsx` and to `NavList.jsx`.

This produces useful output. Vague prompts ("build a rental system") don't.

---

## Files an AI is most likely to want to read

- [prisma/schema.prisma](./prisma/schema.prisma) — full data model
- [src/routes/purchase-orders.js](./src/routes/purchase-orders.js) — best route pattern to copy (nested lines, joins)
- [src/routes/inventory.js](./src/routes/inventory.js) — multi-resource route (items + transactions)
- [client/src/pages/PurchaseOrdersPage.jsx](./client/src/pages/PurchaseOrdersPage.jsx) — best page pattern to copy (list + drawer + nested table)
- [client/src/pages/ProjectsPage.jsx](./client/src/pages/ProjectsPage.jsx) — card-grid alternative
- [client/src/components/DetailDrawer.jsx](./client/src/components/DetailDrawer.jsx) — drawer pattern
- [client/src/components/StatusChip.jsx](./client/src/components/StatusChip.jsx) — extend this when adding new status enums
- [client/src/theme.js](./client/src/theme.js) — theme overrides
