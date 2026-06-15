# Rentals Prototype — Connector

Connects the [strategy brief](./docs/strategy-brief.md) (Part 1) to the working code
(Part 2). Maps each screen to its persona and the brief requirement it implements, and
documents what is built, what is faked, and what is deferred.

**Thesis:** the brief recommends a narrow rent-in wedge whose moat is integration. This
prototype implements all six Phase 1 workflows on the existing procurement app, reusing
its POs, vendors, projects, and ERP seam. Rentals function as another ledger alongside
materials, not a separate platform.

---

## Run it

```bash
npm install        # installs, migrates, seeds (deterministic)
npm start          # Express :3000 + Vite :5173
# http://localhost:5173 → Rentals, Equipment, Schedule, Field in the nav
npm run db:reset   # restore the demo seed after exercising the field flow
```

Swagger for the rental endpoints: `http://localhost:5173/api/docs` (groups *equipment*,
*equipment-assignments*, *equipment-events*).

---

## Screens → persona → requirement

| Screen | Route | Persona | Brief requirement | Workflow # |
|---|---|---|---|---|
| **Rentals Dashboard** | `/rentals` | Back-Office | Off-rent tracking + alerts; cost-to-job allocation; utilization rollup | 4, 5, 6 |
| **Equipment** | `/equipment` | Fleet / Back-Office | Combined owned + rented-in list; per-machine history + dispute evidence | 1 |
| **Schedule Board** | `/schedule` | Fleet Manager | Assign machine → project with date range; **warn on conflicts** | 2 |
| **Field Check** | `/field` | Superintendent | Mobile check-in/out, photo + condition, **works offline** | 3 |

The six in-scope workflows and where each is implemented:

1. **Combined equipment list (owned + rented-in)** — Equipment page (DataGrid + drawer).
2. **Assign to project with conflict warnings** — Schedule board. Assign dialog calls
   `GET /api/equipment-assignments/conflicts` live; non-blocking warn + "Schedule anyway".
3. **Mobile check-in/out, offline** — Field page (phone-framed; localStorage queue + sync).
4. **Off-rent tracking + alerts** — Dashboard KPI + alert list; per-machine waste in the
   Equipment drawer.
5. **Cost-per-project allocation** — Dashboard "Rental cost to job" (Σ dailyRate × days).
6. **Utilization view** — Dashboard "Utilization by machine" + per-machine % in the drawer.

---

## Demo sequence

Three journeys, ordered by strategic weight:

1. **Off-rent waste, cold.** The dashboard opens on a non-zero *Off-Rent Waste* figure
   (~$10,192 across 3 overdue machines), derived from rental POs the procurement app
   already holds. Implements the brief's "quantify waste before the first sales call"
   claim. The figure increases by one day's rate per still-out machine each day past
   expected return.
2. **Field return, offline.** On `/field`, set the connection toggle to Offline and check
   a machine in with a photo + DAMAGED condition. The event enters the localStorage queue
   with an "N queued" badge. Toggle back online: it batch-syncs to
   `POST /api/equipment-events` preserving the original `occurredAt`, the machine flips to
   AVAILABLE, and the event appears (with its offline gap) in the Equipment drawer
   timeline. This is the prototype's primary adoption bet.
3. **Double-booking caught.** The schedule board outlines the seeded `BKR-SS-204` overlap
   in red and surfaces a page-level alert; the Assign dialog warns before a new conflict
   can be created.

---

## Architecture

- **Data model** (`prisma/schema.prisma`): three new models — `Equipment`,
  `EquipmentAssignment`, `EquipmentEvent` — plus one `rentalStart` field on
  `PurchaseOrder`. Reuses `Vendor`, `Project`, `User`, `PurchaseOrder`. No SQLite enums:
  every enum-like field is a `String` validated by a `VALID_X` constant in its route.
- **Derived, never stored** (`src/lib/rentalMath.js`): off-rent, overdue, dollars wasted,
  utilization %, and current project are computed per machine from assignment dates
  against a single "today" anchor. One pure module, imported by all three routes.
- **Three routers** (`src/routes/equipment*.js`) follow the existing `inventory.js` shape;
  OpenAPI generated from JSDoc.
- **Frontend** reuses existing plumbing: `api/client.js` + `useEntities` for reads, one new
  `useApiMutation` hook for writes, `StatusChip` for every status, page-vs-drawer pattern,
  MUI v5 Grid. New surfaces are the phone frame (`field/PhoneFrame.jsx`) and the offline
  queue (`field/offlineQueue.js`).

### Divergences from the brief

The brief's data-model sketch was simplified during engineering review before
implementation. Two changes:

- **No `MaintenanceRecord` table.** A breakdown is `Equipment.status = DOWN` + an
  `EquipmentEvent(DOWN)` carrying the note. Removes a table, a seed array, and a
  dual-write. A full maintenance system is Phase 2.
- **Per-machine return dates on the assignment, not the PO.** The brief proposed
  `expectedOffRent` / `actualOffRent` on `PurchaseOrder`. A multi-machine PO can have
  machines returned independently, so the canonical grain is `EquipmentAssignment`
  (`expectedEndDate` / `actualEndDate`); rental spend and dollars wasted roll up from
  there. The PO keeps only `rentalStart`.

---

## Prototype shortcuts (faked seams)

| Faked | Real version |
|---|---|
| **Offline persistence** = `localStorage` queue + manual/auto flush | Service worker + IndexedDB with background sync |
| **Photo capture** = `<input capture>` → object-URL preview, mock filename | Upload to blob storage; the timeline renders a "photo attached" tile, not a 404'd `<img>` |
| **Auth** = user-switcher dropdown on the field page | Real session; superintendent identity from login |
| **ERP push** = cost/utilization data shaped for export, not transmitted | One-way batch sync to Sage/CMiC/etc. via the existing integration layer |
| **Event side effects** = sequential awaits, no `$transaction` | Wrap status + assignment-close in a transaction |
| **Utilization** = per-machine query loop | Single `include` query at scale |

Each item is on the brief's "out of scope (v1)" or "Phase 2" list. The prototype fakes the
seam, not the strategy.

## Deferred on purpose

Each item below is a deliberate deferral, not unfinished work. The principle is that the
moat is integration, not features: every item is either something a competitor does better
or something whose value depends on the wedge first earning the right to expand. Building
any now trades a defensible narrow position for the "go broad" path the brief rejects.

| Deferred | Rationale |
|---|---|
| **Telematics / GPS hardware** | EquipmentShare's strength (~$4.4B revenue, sensor fleets, free bundling). Competing on hardware data loses on capital and time, and adds a hardware supply chain without strengthening the moat. Revisit in Phase 3 as an integration that reads vendor telemetry, not as owned hardware. |
| **Full maintenance engine** | PM schedules, work orders, parts, and labor constitute a separate product. The wedge answers "is this machine down?" with `status = DOWN` + a `DOWN` event, enough to keep utilization accurate. Whether customers want SubBase to own maintenance or only reflect it is a Phase 2 question answered with real usage. |
| **Customer-facing rent-out storefront / billing** | Inverts the model into a marketplace: different buyer, different GTM, and competes with customers' own vendors. Phase 3 at the earliest, contingent on Phase 2 economics. It would also dilute the "equipment ledger next to your material ledger" positioning. |
| **Real bidirectional ERP sync** | The core requirement is one-way/batch utilization → billing data, which is shippable reliably. Bidirectional sync adds failure modes (conflict resolution, write-back errors into accounting systems) for marginal value. The export is shaped now; full sync is Phase 2 hardening once the data is trusted. |
| **Real auth / per-user identity** | Out of scope for the starter, and strategically deferred: pricing never charges per field user, so per-seat identity is the wrong early optimization. A user-switcher proves the workflow; SSO/role enforcement does not affect the Phase 0/1 adoption question. |

Two sequencing principles:

- **Adoption is the first risk.** The brief's primary kill switch is field non-adoption of
  check-in/out. Every deferred item is back-office or capital-heavy work that cannot
  compensate for missing field data, so none precedes the field flow.
- **Defer anything not reversible-cheap.** The wedge is cheap, reversible, and reuses
  existing plumbing. Telematics hardware, a rent-out marketplace, and bidirectional ERP
  writes are each expensive and hard to unwind. They wait until the data justifies them.

## Known limitations

Low-severity items from the Milestone 2 code review are tracked in [`TODOS.md`](./TODOS.md).
Two to note before a code-review walkthrough:

- **Offline replay is not idempotent.** Re-flushing the same `CHECK_IN`/`OFF_RENT` after a
  flaky reconnect can overwrite an already-`RETURNED` assignment's `actualEndDate`. Fix: a
  no-op guard when `status === 'RETURNED'`. This touches the offline-sync feature, so it
  ranks first.
- **Photo-attached date renders in UTC.** Cosmetic. The captured `occurredAt` is stored
  correctly; only the tile's display formatting is naive.

Neither blocks the demo. Both are the kind of issue the field-test phase (Phase 0/1) would
surface and close before GA.

---

## Kill-switch observability

The prototype makes the Phase 0/1 go/no-go signals observable:

- *"Field crews won't use check-in/out"* — the `/field` flow is the artifact for
  superintendent usability testing. If three taps is too many, the strategy says stop.
- *"Off-rent waste under ~2% of spend"* — the dashboard waste figure is the same number a
  design-partner analysis would produce. If it returns small, re-scope to scheduling (the
  `/schedule` board stands alone).
</content>
