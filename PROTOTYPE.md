# Rentals Prototype — Connector

This is the bridge between the [strategy brief](./docs/strategy-brief.md) (Part 1) and the
working code (Part 2). It maps every screen to the persona it serves and the brief
requirement it proves, then states plainly what is built, what is faked, and what is
deferred — and why.

**One-line thesis:** the brief argues for a narrow *rent-in wedge* whose moat is
integration. This prototype builds all six Phase 1 workflows on top of the existing
procurement app — reusing its POs, vendors, projects, and ERP seam — so the demo *is*
the argument: rentals as another ledger next to materials, not a bolt-on platform.

---

## Run it

```bash
npm install        # installs, migrates, seeds (deterministic)
npm start          # Express :3000 + Vite :5173
# open http://localhost:5173  → Rentals, Equipment, Schedule, Field in the nav
npm run db:reset   # restore the demo seed after poking at the field flow
```

Swagger for the rental endpoints: `http://localhost:5173/api/docs` (groups
*equipment*, *equipment-assignments*, *equipment-events*).

---

## Screens → persona → requirement

| Screen | Route | Persona | Brief requirement it proves | Workflow # |
|---|---|---|---|---|
| **Rentals Dashboard** | `/rentals` | Back-Office | Off-rent tracking + alerts; cost-to-job allocation; utilization rollup | 4, 5, 6 |
| **Equipment** | `/equipment` | Fleet / Back-Office | Combined owned + rented-in list; per-machine history & dispute evidence | 1 |
| **Schedule Board** | `/schedule` | Fleet Manager | Assign machine → project with date range; **warn on conflicts** | 2 |
| **Field Check** | `/field` | Superintendent | Mobile check-in/out, photo + condition, **works offline** | 3 |

The six workflows from the brief's "in scope (v1)" table, and where each lives:

1. **Combined equipment list (owned + rented-in)** → Equipment page (DataGrid + drawer).
2. **Assign to project with conflict warnings** → Schedule board (Assign dialog calls
   `GET /api/equipment-assignments/conflicts` live; non-blocking warn + "Schedule anyway").
3. **Mobile check-in/out, offline** → Field page (phone-framed; localStorage queue + sync).
4. **Off-rent tracking + alerts** → Dashboard KPI + alert list; per-machine waste in the
   Equipment drawer.
5. **Cost-per-project allocation** → Dashboard "Rental cost to job" (Σ dailyRate × days).
6. **Utilization view** → Dashboard "Utilization by machine" + per-machine % in the drawer.

---

## The money shots (what to demo)

1. **Off-rent waste, cold.** The dashboard opens on a non-zero *Off-Rent Waste* figure
   (~$10,192 across 3 overdue machines) derived from rental POs the procurement app
   already holds — exactly the "quantify waste before the first sales call" claim in the
   brief, made literal. The number climbs as you'd expect: still-out machines accrue
   another day's rate each day past their expected return.
2. **Field return in three taps, offline.** On `/field`, flip the connection toggle to
   Offline, check a machine in with a photo + DAMAGED condition, and watch it land in the
   localStorage queue with an "N queued" badge. Toggle back online → it batch-syncs to
   `POST /api/equipment-events` preserving the original `occurredAt`, the machine flips to
   AVAILABLE, and the event (with its offline gap) shows up in the Equipment drawer
   timeline. This is the adoption bet the whole strategy rests on.
3. **Double-booking caught before it happens.** The schedule board outlines the seeded
   `BKR-SS-204` overlap in red and surfaces a page-level alert; the Assign dialog warns
   live before you can create a fourth conflict.

---

## Architecture, in one screen

- **Data model** (`prisma/schema.prisma`): three new models — `Equipment`,
  `EquipmentAssignment`, `EquipmentEvent` — plus a single `rentalStart` field on
  `PurchaseOrder`. Reuses `Vendor`, `Project`, `User`, `PurchaseOrder`. No SQLite enums:
  every enum-like field is a `String` validated by a `VALID_X` constant in its route.
- **Derived, never stored** (`src/lib/rentalMath.js`): off-rent / overdue / dollars
  wasted / utilization % / current project are all computed per machine from assignment
  dates, against a single "today" anchor. One pure module, imported by all three routes —
  one definition of the overdue rule.
- **Three routers** (`src/routes/equipment*.js`) following the repo's existing
  `inventory.js` shape; OpenAPI generated from JSDoc.
- **Frontend** rides the existing plumbing: `api/client.js` + `useEntities` for reads,
  one new `useApiMutation` hook for writes, `StatusChip` for every status, page-vs-drawer
  pattern, MUI v5 Grid. The only genuinely new surfaces are the phone frame
  (`field/PhoneFrame.jsx`) and the offline queue (`field/offlineQueue.js`).

### Where the build diverged from the brief (and why)

The brief's data-model sketch was simplified during engineering review before any code
shipped. Two changes worth calling out in the walkthrough, because they show the
"narrow wedge" discipline applied at the schema level:

- **No `MaintenanceRecord` table.** A breakdown is `Equipment.status = DOWN` + an
  `EquipmentEvent(DOWN)` carrying the note. Drops a table, a seed array, and a dual-write;
  a full maintenance system is explicitly Phase 2, so modeling it now would be building
  ahead of the wedge.
- **Per-machine return dates live on the assignment, not the PO.** The brief proposed
  `expectedOffRent` / `actualOffRent` on `PurchaseOrder`. But a multi-machine PO can have
  machines returned independently, so the canonical grain is `EquipmentAssignment`
  (`expectedEndDate` / `actualEndDate`). "Rental spend" and "dollars wasted" roll up from
  there. The PO keeps only `rentalStart` (the contract start).

---

## What's faked (prototype shortcuts, called out honestly)

| Faked | Real version (deferred) |
|---|---|
| **Offline persistence** = a `localStorage` queue + manual/auto flush | Service worker + IndexedDB with real background sync |
| **Photo capture** = `<input capture>` → object-URL preview, stores a mock filename | Real upload to blob storage; the timeline renders a "photo attached" tile, not a 404'd `<img>` |
| **Auth** = a user-switcher dropdown on the field page | Real session; superintendent identity from login |
| **ERP push** = cost/utilization data is *shaped* for export but not transmitted | One-way batch sync to Sage/CMiC/etc. via the existing integration layer |
| **Event side effects** = sequential awaits, no `$transaction` | Wrap status + assignment-close in a transaction |
| **Utilization** = per-machine query loop | Single `include` query at scale |

These are all on the brief's "out of scope (v1)" or "Phase 2" list — the prototype fakes
the seam, not the strategy.

## Deferred on purpose (matches the brief's "out of scope")

These aren't unfinished work — each is a deliberate "not yet," and the reason matters
more than the omission. The through-line: **the moat is integration, not features.** Every
item below is something a competitor already does better, or something whose value only
shows up *after* the wedge has earned the right to expand. Building any of them now would
trade a defensible narrow position for the "go broad" fight the brief recommends against.

| Deferred | Why it's the right call to wait |
|---|---|
| **Telematics / GPS hardware** | This is EquipmentShare's home turf — they have ~$4.4B of revenue, sensor fleets, and *free* bundling. Competing on hardware data means losing on capital and time. Our edge is the procurement data we already hold; GPS adds cost and a hardware supply chain without strengthening the moat. Revisit in Phase 3 as an *integration* (read their telemetry), never as our own hardware. |
| **Full maintenance engine** | A real maintenance system (PM schedules, work orders, parts, labor) is its own product. In the wedge, "is this machine down?" is answered by `status = DOWN` + a `DOWN` event — enough to keep utilization honest without building ahead of demand. We don't yet know if customers want us to own maintenance or just reflect it; Phase 2 decides that with real usage, not a guess. |
| **Customer-facing rent-out storefront / billing** | This inverts the business — turning SubBase into a marketplace/rental house. It's a different buyer, different GTM, and competes with our own customers' vendors. Phase 3 at the earliest, and only if Phase 2 economics hold. Building it now would blur the "equipment ledger next to your material ledger" positioning into "we're a rental platform," which is exactly the fight we said we'd avoid. |
| **Real bidirectional ERP sync** | The brief's core requirement is *one-way/batch* utilization → billing data into the ERP, because that's the integration customers actually need and the one we can ship reliably. Bidirectional sync multiplies failure modes (conflict resolution, write-back errors into someone's accounting system) for marginal value at this stage. We shape the export now and prove the data is clean; full sync is a Phase 2 hardening task once the data is trusted. |
| **Real auth / per-user identity** | Out of scope for the *starter* by design, but also strategically deferred: the pricing model says **never charge per field user**, so heavyweight per-seat identity is the wrong thing to optimize early. A user-switcher proves the workflow; real SSO/role enforcement is back-office plumbing that adds nothing to the adoption question Phase 0/1 is built to answer. |

Two sequencing principles tie these together:
- **Adoption is the only risk that matters first.** The brief's #1 kill switch is "the field
  won't use check-in/out." Everything deferred above is back-office or capital-heavy polish
  that can't save a product with no field data underneath it — so none of it earns a place
  ahead of the field flow.
- **Defer anything that isn't reversible-cheap.** The whole wedge thesis is "cheap,
  reversible, reuses existing plumbing." Telematics hardware, a rent-out marketplace, and
  bidirectional ERP writes are each expensive and sticky to unwind — the opposite of a
  wedge. They wait until the data proves they'll pay off.

## Known limitations (tracked)

Low-severity items from the Milestone 2 code review live in [`TODOS.md`](./TODOS.md).
Two worth naming before a code-review walkthrough:

- **Offline replay isn't idempotent yet.** Re-flushing the same `CHECK_IN`/`OFF_RENT`
  after a flaky reconnect can overwrite an already-`RETURNED` assignment's
  `actualEndDate`. Fix is a no-op guard when `status === 'RETURNED'`. This is the one nit
  that touches the demo's headline feature (offline sync), so it's first in line.
- **Photo-attached date renders in UTC.** Cosmetic; the captured `occurredAt` is stored
  correctly, only the tile's display formatting is naive.

Neither blocks the demo. Both are the kind of thing the field-test phase (Phase 0/1)
would surface and the team would close before GA.

---

## Map to the brief's kill switches

The prototype is built so the Phase 0/1 go/no-go signals are observable, not abstract:

- *"Field crews won't use check-in/out"* → the `/field` flow is the thing to put in front
  of a superintendent in usability testing. If three taps is still too many, the strategy
  says stop.
- *"Off-rent waste under ~2% of spend"* → the dashboard's waste figure is the exact
  number a design-partner analysis would produce; if it comes back small, re-scope to
  scheduling (the `/schedule` board already stands on its own).
</content>
