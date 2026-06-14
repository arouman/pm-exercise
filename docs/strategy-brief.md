# Strategy Brief: SubBase Rentals Opportunity

> Part 1 of the SubBase Senior PM exercise. The canonical version lives in Notion;
> this is the in-repo markdown port, kept alongside the prototype it argues for.
> The connector between this strategy and the working prototype is [`PROTOTYPE.md`](../PROTOTYPE.md).

---

## Recommendation

**Build it — narrow wedge only.** Ship rent-in PO tracking with off-rent alerts, a
combined equipment list, and mobile check-in/out. Do **not** build a standalone fleet
platform, maintenance engine, or telematics in v1.

> **Kill switches (decide before commit):** Stop if field crews won't use mobile
> check-in/out after two rounds of testing — all downstream data depends on field
> capture. Re-scope to fleet scheduling if measured off-rent waste is under ~2% of
> rental spend at design partners. Kill the project if the customer base skews
> low-equipment or is too small for add-on revenue to matter.

| Stay narrow (rent-in wedge) | Go broad (full platform) |
|---|---|
| Cheap, reversible, reuses existing plumbing | Expensive, slow, new infrastructure |
| Provable ROI from data we already hold | Competing on features we can't match |
| Defensible — integration is the moat | Fighting EquipmentShare on their turf |
| ✅ **Recommended** | ❌ Avoid |

---

## Market Opportunity

Target: ~7,000 US specialty-trade contractors with $10M+ revenue in equipment-heavy
trades (concrete, sitework, mechanical, masonry, steel). Our anchors — **Baker**,
running their fleet on an outdated system, and **Miller & Long**, already in SubBase
with rental items in the mix — define the ICP (ideal customer profile): multi-site
concrete subs tracking owned and rented equipment in spreadsheets alongside SubBase.

| Layer | Math | Result |
|---|---|---|
| SAM (serviceable addressable market) | ~7,000 companies × ~$10K ACV (annual contract value) | ~$70M/year |
| SOM — first 2 years | 30–40% of eligible existing customers adopt | Low-single-digit $M (depends on base size) |
| SOM — years 3–5 | 5–8% of SAM as word spreads | ~$4–6M/year |

ACV planning number: **~$10K/year**, validated three ways — under standalone equipment
software pricing (~$10–25K), ~0.5% of a mid-size sub's rental spend (~$1.5–2.5M), and
consistent as a share of revenue.

**The unfair advantage:** SubBase already processes customers' rental POs (purchase
orders). We can quantify each customer's rental waste — *before the first sales call* —
using data they already gave us. No competitor can do that cold.

---

## Competitive Landscape

| Player | What they are | Their edge | Their blind spot |
|---|---|---|---|
| EquipmentShare (T3) | Rental company with software arm (~$4.4B revenue) | GPS/sensor data; T3 is free bundled with rentals | No view into purchasing across all vendors |
| United Rentals / Sunbelt | Two giant rental houses (~22–25% of market) | Free portals bundled with rentals | Each portal sees only their own machines |
| Tenna / HCSS Equipment360 | Standalone fleet-tracking software | Deep equipment features, hardware tags | No procurement or invoice-reconciliation integration |
| **SubBase** | Procurement platform adding rentals | We hold the POs, projects, and ERP sync | Smallest player; no telematics data |

**Why SubBase beats the rental co's own portal:** United's portal sees United's iron.
Sunbelt's portal sees Sunbelt's iron. A contractor renting from both — and running
owned equipment — has three disconnected views with no job-cost context. SubBase sees
cross-vendor rental activity, project-level costs, and ERP (enterprise resource
planning — the customer's accounting system) sync in one place. No portal can do that.

The moat is **integration, not features** — and it only holds for the narrow rent-in
slice. Building a full fleet platform means fighting EquipmentShare on capital, sensor
data, and free bundling. We lose that fight.

---

## User Workflows & Personas

### Fleet Manager
**Problem:** No single view of owned and rented equipment across sites. A machine
sitting idle on Site A gets duplicated by a rental on Site B. Utilization data lives in
a spreadsheet or outdated tool — never inside the system tracking project costs.

Thinks in weeks to months, works from a desktop. Needs a scheduling board with conflict
warnings, a cross-vendor equipment list, and utilization data that flows directly to
job costing.

### Superintendent
**Problem:** Already uses SubBase mobile daily for deliveries and inventory in/out.
Off-renting a machine is the one step in their workflow still stuck on a phone call or a
form. The rental meter runs until the office catches it — days or weeks later.

Works from a phone, often in spotty signal. Needs return to feel like any other
check-out they already do: scan → photo → condition → done in under 30 seconds, queued
offline and synced when signal returns.

### Back-Office / Procurement
**Problem:** Rental invoices routinely bill past the return date and include disputable
damage charges. Without a timestamped return record and photo, there's no evidence to
push back. Utilization data that should flow to the ERP for billing is assembled
manually from vendor portals and spreadsheets.

Works from a desktop. Needs field check-out records as dispute evidence and clean cost
data flowing to the ERP without manual assembly.

| | Fleet Manager | Superintendent | Back-Office |
|---|---|---|---|
| Cares about | Utilization, conflicts | "Is it here and working?" | Accurate bills + ERP sync |
| Time horizon | Weeks–months | Today | Billing cycle |
| Device | Desktop | Phone (often offline) | Desktop |
| Tolerance for forms | Medium | Zero | Medium |

> The field captures events; the office consumes state. Nobody works in anybody else's
> interface.

---

## Core Product Requirements

**Core requirement:** track equipment utilization → get billing data cleanly into the
ERP. Data flows one-way/batch to Sage 300 CRE, CMiC, Foundation, Acumatica,
Viewpoint/Vista, Procore, and QuickBooks via the existing integration layer.

| In scope (v1) | Out of scope (v1) |
|---|---|
| Combined equipment list — owned and rented-in together | GPS/telematics hardware |
| Assign equipment to project with date range; warn on conflicts | Full maintenance system |
| Mobile check-in/out with photo + condition capture (works offline) | Customer-facing rental storefront |
| Off-rent tracking tied to the PO, with alerts when need-by date passes | Invoicing engine (push billing data to ERP instead) |
| Cost-per-project allocation (daily rate × days on site) into job costing | |
| Utilization view (days used ÷ days available) | |

| Build new | Reuse what's there |
|---|---|
| `Equipment` (serial-numbered asset with status) | `Vendor` — rental houses already exist |
| `EquipmentAssignment` (machine × project × date range) | `PurchaseOrder` — rent-ins are POs with dates |
| `EquipmentEvent` (check-in/out, off-rent, down, transfer) | `Project` — tells us where a machine is |
| Rental date field on the PO (`rentalStart`) | `FLEET_MANAGER` role — already seeded |
| | Site-to-site `TRANSFER` pattern — equipment moves work the same way |

> **Note on the build:** the brief originally proposed a `MaintenanceRecord` table and
> three PO return-date fields. Engineering review simplified both: a breakdown is now
> `Equipment.status = DOWN` + an `EquipmentEvent(DOWN)`, and per-machine return dates
> live on `EquipmentAssignment` (the canonical grain) rather than the PO. See
> [`PROTOTYPE.md`](../PROTOTYPE.md) for the rationale.

---

## Technical Feasibility

Very buildable for a small team — we reuse the PO, vendor, project, and ERP machinery
rather than starting fresh.

> **The one real gap:** POs today have an `expectedDelivery` date but no return date and
> no return event. Until we add a rental start, an expected return, and an actual-return
> event, the product can show *days on rent* but cannot show *dollars wasted*. Don't
> demo the dollar figure until the capture is built. *(The prototype closes this gap —
> see below.)*

**Field connectivity:** check-in/out must save offline and sync later. Superintendents
are already on SubBase mobile daily — rental check-in/out is a habit extension, not a
cold start. Spotty connectivity is the design constraint.

**Risk is adoption, not technical complexity.** Will the field actually use it? That's
what Phase 0 and Phase 1 are designed to answer.

---

## Financial Projections & Unit Economics

ACV: **~$10K/year per customer** — validated as under standalone equipment software
pricing, ~0.5% of a mid-size sub's equipment spend, and consistent as a share of
revenue.

| Customer spending $1.8M/year on rentals | Amount |
|---|---|
| Recoverable waste (6–10% of spend) | ~$110–180K/year |
| Portion our workflow can fix (~70%) | ~$80–130K/year |
| What we charge them | ~$10K/year |
| Payback | 8–13× over |

On top of a ~$20–40K core contract, Rentals is a **25–50% account expansion**.
Multi-module customers churn far less — this protects existing revenue while adding new.

> **Soft spots:** construction is price-sensitive (ACV may land at the low end); the
> 6–10% waste figure is borrowed from neighboring industries, not yet confirmed from our
> own data; total revenue depends on customer base size.

---

## Go-to-Market

**Start with existing customers, concrete subs first.** Baker and Miller & Long are the
first design partners. Rental spend is the one thing not yet in SubBase for these
customers — CS leads the QBR conversation with an industry benchmark pitch, not a cold
call.

> "Your rental spend is the one thing missing from your SubBase picture. Industry data
> puts recoverable waste at 6–10% of rental spend — for a company your size, that's real
> money. Let's get it in the platform and find out where it's going."

| Don't position as | Do position as |
|---|---|
| A rival to Tenna/EquipmentShare on features | "The equipment ledger next to your material ledger" |
| A standalone fleet platform | One system for everything that shows up on a job site |
| A telematics/GPS product | Simple field check-in + POs, job costs, and ERP already connected |

**Pricing:** flat module fee, tiered by fleet size — ~$500/$1,000/$1,800/month for
small/medium/large fleets. Two rules: never charge per field user (adoption dies if
every super needs a paid seat), and keep the entry price lower than the off-rent savings
alone.

---

## Implementation Roadmap

| Phase | Length | What we build | Go signal |
|---|---|---|---|
| **0 — Prove it** | ~4 weeks | No code. Analyze rental spend; interview 8–10 fleet managers and supers at Baker, Miller & Long, and other enterprise accounts. | ≥3 design partners committed; real waste quantified at ≥2 accounts |
| **1 — The wedge** | ~1 quarter | Equipment list, rent-in POs with off-rent alerts, mobile check-in/out, basic scheduling | Field crews use check-in/out weekly; documented dollars saved from catching off-rents |
| **2 — The platform** | ~2 quarters | Scheduling board, utilization reports, cost-to-job-cost, maintenance log, ERP sync | 25%+ of eligible customers attach; field DAU/MAU above 40% |
| **3 — Expansion** | Later | Rent-out billing, telematics integrations, marketplace options | Phase 2 economics holding at scale |

> **Kill if the field won't bite.** If design-partner superintendents won't use
> check-in/out after two rounds of field testing, stop — back-office polish can't save a
> product with no field data underneath it.

> **Re-scope if the savings aren't there.** If off-rent waste comes back under ~2% of
> rental spend at design partners, pivot Phase 1 toward fleet scheduling instead.
</content>
</invoke>
