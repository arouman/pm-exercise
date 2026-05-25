# SubBase Take-Home — Starter Environment

Welcome. This repo is your starting point for the Senior PM (Enterprise Product) take-home. The full exercise brief is reproduced verbatim below so you (and any AI tool you give this repo to) have the assignment in one place. Code-level docs are in [ARCHITECTURE.md](./ARCHITECTURE.md), [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md), and [AI-CONTEXT.md](./AI-CONTEXT.md).

---

## The Exercise

### Take-Home Exercise — Senior Product Manager, Enterprise Product | SubBase


### Context

SubBase is a procurement platform for construction subcontractors. Our customers use SubBase to manage purchasing relationships with their material vendors — creating orders, tracking deliveries, reconciling invoices, and connecting it all to their ERP systems.

We already support basic inventory tracking with In/Out workflows for consumable materials. We're now evaluating whether to expand into rental equipment management — a significant adjacent opportunity where subcontractors who rent equipment to their own clients (or manage a fleet across job sites) need an end-to-end solution.

*This is a real decision we're weighing. Your work here will directly inform our thinking.*

### Key Constraints to Keep in Mind

These reflect real conditions at SubBase. Your recommendations should account for them:

- **Small team.** Our product + eng org is under 15 people. Anything you propose needs to be buildable by a team of this size.
- **Enterprise customers drive revenue.** Our largest customers (Turner, Baker, Nexgen) are concrete subcontractors with complex, multi-site operations. They have real procurement teams, field superintendents on job sites, and ERP systems that everything needs to flow into.
- **Field users are the real test.** The people who would use a rental system day-to-day are not sitting at desks. They're field superintendents and equipment coordinators on active job sites — checking equipment in and out, dealing with breakdowns, and coordinating across multiple projects simultaneously. Many are on mobile devices in conditions where connectivity is unreliable.
- **Existing product surface matters.** Rentals doesn't exist in a vacuum. It touches procurement (renting from external vendors), inventory (tracking owned vs. rented assets), project management (which job site has what equipment), and billing (rental periods, utilization rates, damage charges). How this connects to what we already have is as important as what it does standalone.

### The Assignment

Prepare a presentation (any format) that addresses:

#### Part 1: Strategy

1. **How would you size the opportunity?** Ground your estimate in real data or defensible assumptions — not just top-down TAM.
2. **What are the key requirements for a Rentals product?** Articulate your design for the core solution, including how it integrates with SubBase's existing procurement and inventory capabilities.
3. **Who are the users, and how do their workflows differ?** A fleet manager scheduling equipment across 8 job sites has different needs than a superintendent checking in a concrete pump on-site. Show us you've thought about both.
4. **What would the go-to-market strategy be?** How does this leverage SubBase's existing customer relationships and sales motion?
5. **Final recommendation:** Should SubBase invest in Rentals? Make a clear call with real reasoning. If yes, what's the phased approach? If no, what would change your mind?

#### Part 2: Build a Working Prototype

If SubBase decided to move forward:

1. Identify the primary workflows for a Rentals product and build a working prototype that covers them. This isn't about picking one narrow slice — we want to see your vision for the core product experience, brought to life.
2. You'll receive a pre-configured environment with a database, seed data, and a basic app shell. Use whatever tools you work fastest with (Cursor, Claude Code, Copilot, etc.) — work the way you normally would.
3. The prototype should be polished enough to demonstrate your UX sensibility. We're evaluating product craft — how the software feels to use, not just whether it functions. Think of this as something you'd put in front of a customer to get feedback, not an internal hackathon demo.
4. Describe how this prototype connects to the broader rental system you designed in Part 1. What's included, what's deferred, and why?

### What Happens Next: The Final Round

Once you submit your take-home (strategy presentation + working prototype), we'll schedule a single ~2 hour video call with two parts.

**Part 1: Strategy Presentation (60 min).** Present your take-home work and defend it under questioning. This is a strategy conversation, not a slide readout — we'll push on assumptions, ask about alternatives you considered, and explore how you'd adapt with different constraints.

**Part 2: Build Walkthrough (45 min).** Demo the working prototype you built. Walk us through the key decisions — data model, UX choices, what you scoped in and out, and what you'd do next with more time.

We'll ask questions about your approach — why you modeled things a certain way, how you used AI tooling, what broke and how you fixed it. Come prepared to share your screen and show the code, not just the UI.

### Logistics

- **Time investment:** We expect 6–10 hours of focused work across strategy and build. Don't spend more than 12.
- **Deliverables:** (1) A presentation in whatever format you prefer (slides, Notion doc, PDF). (2) A working prototype — push your code to the repo we share with you.
- **Seed data + starter environment:** This repo is your starting point. It already includes the existing SubBase domain (procurement, materials, projects, deliveries, inventory). The rental domain is intentionally left blank — that's yours to design.
- **Questions:** If anything is unclear, reach out to Charlie. Asking good questions is a signal, not a weakness.

### What We're Looking For

We're not looking for a perfect answer. We're looking for how you think:

- Does your market sizing use real data or defensible estimates, not hand-waving?
- Do your product requirements reflect genuine understanding of rental workflows (asset lifecycle, scheduling, maintenance, utilization, billing) — or are they surface-level?
- Have you thought about the field user experience specifically, not just the back-office view?
- Does your GTM strategy leverage SubBase's existing position, or is it generic?
- Does the prototype cover the right workflows? Did you identify the primary user journeys, or did you cherry-pick the easiest thing to build?
- Does the prototype feel like a real product? We're looking for UX craft — thoughtful layout, clear information hierarchy, sensible interaction patterns. Not pixel-perfect design, but evidence that you care about how software feels to use.
- Is your recommendation clear, opinionated, and backed by reasoning?

---

## Quick Start

**Prerequisites:** Node.js 20 or newer (`node --version`). No database server required — SQLite ships in the repo.

```bash
npm install      # installs root + client deps, sets up DB, seeds — all automatic
npm start        # boots API on :3000 and web on :5173 with hot reload
```

Then open **http://localhost:5173** in your browser.

> The `postinstall` hook handles everything: client dependency install, Prisma client generation, migrations, and seed. You should never need to run those by hand.

### URLs you'll use

| URL | What it is |
|---|---|
| http://localhost:5173 | The web app (Vite dev server). Start here. |
| http://localhost:5173/api/docs | Interactive Swagger API docs (proxied from Express). |
| http://localhost:3000 | Express API direct (you usually don't need this). |
| http://localhost:3000/api/openapi.json | Raw OpenAPI spec — useful for AI prompting. |

---

## What's in the Box

### The stack at a glance

- **Backend:** Node.js 20 + Express 4, plain JavaScript (ESM)
- **Database:** SQLite via Prisma ORM
- **API docs:** swagger-ui-express, auto-generated from JSDoc on each route
- **Frontend:** React 18 + Vite + Material UI v5, plain JavaScript (JSX)
- **State / data fetching:** TanStack Query (react-query)
- **Tables:** MUI X DataGrid (Community)
- **Routing:** React Router v6

No TypeScript, no Redux, no form libraries. Keep dependencies small; add what you need.

### Data model (the existing SubBase surface)

| Entity | Purpose |
|---|---|
| `User` | Procurement, superintendent, or fleet-manager roles |
| `Vendor` | External material suppliers |
| `Material` | SKUs sold by vendors |
| `Project` | Job sites with customer, address, status |
| `PurchaseOrder` + `PurchaseOrderLine` | Orders raised against vendors |
| `Delivery` + `DeliveryLine` | Receipts against PO lines |
| `InventoryItem` | Current stock by (material, project) |
| `InventoryTransaction` | IN / OUT / TRANSFER history |

The full Prisma schema is at [prisma/schema.prisma](./prisma/schema.prisma). The data model rationale and conventions are in [ARCHITECTURE.md](./ARCHITECTURE.md).

### Pages provided

- **Dashboard** — KPIs + recent inventory activity + POs by status
- **Projects** — Card grid with detail drawers showing team & totals
- **Purchase Orders** — DataGrid with PO line items in detail drawer
- **Deliveries** — DataGrid with received-item breakdown in detail drawer
- **Inventory** — Filterable stock view with per-(material × project) transaction history
- **Materials** — Filterable SKU catalog joined with vendor
- **Vendors** — Vendor directory with linked materials

Reusable components and the MUI theme are documented in [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md). Use them — they encode the design decisions we've already made so you can focus on rental UX.

### API surface

15 endpoints across 7 resources. Browse the full reference at http://localhost:5173/api/docs once the app is running. The OpenAPI JSON is at `/api/openapi.json` — paste it into AI tools as context.

---

## Resetting the Data

If you've created test data and want to start fresh:

```bash
npm run db:reset
```

This wipes the SQLite file, re-runs migrations, and re-seeds. Deterministic — you get the exact same data back.

---

## Where to Look Next

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Backend conventions (errors, pagination, naming), frontend conventions (when to add a page vs a drawer), data model rationale, what's intentionally out of scope.
- **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** — Theme tokens, available components with usage examples, and a walkthrough for adding a new page that fits the existing look.
- **[AI-CONTEXT.md](./AI-CONTEXT.md)** — Single-file dump optimized for pasting into Cursor / Claude Code / Copilot. Contains the schema, endpoints, sample payloads, and a "how to extend for rentals" section.
- **http://localhost:5173/api/docs** — Interactive Swagger UI.

---

## Production-style build (optional)

```bash
npm run build         # bundles the React app to client/dist
npm run start:prod    # Express serves both the API and the built static UI on :3000
```

You don't need this for the exercise — it's just here if you want to see how the prod packaging works.

---

## Out of Scope (Intentional)

The starter intentionally does **not** include:

- Authentication or authorization — single shared dataset
- Real-time / websockets — REST only
- File uploads or image storage
- Tests — add your own as you see fit
- Docker — SQLite + Node only
- Any rental-domain models, routes, or UI — **that's your deliverable**

Good luck. We're excited to see what you build.
