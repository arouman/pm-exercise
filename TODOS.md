# TODOs

Deferred follow-ups. Captured from the Milestone 2 code review (`/code-review`, high effort).
Severities are low; none block the prototype demo. Fix opportunistically.

## Rentals backend — deferred review findings

- [ ] **Idempotency on event replay** — `src/routes/equipment-events.js` (assignment-close side effect).
  - **What:** Re-posting `OFF_RENT`/`CHECK_IN` for an already-`RETURNED` assignment overwrites its
    `actualEndDate` with the duplicate's `occurredAt`.
  - **Why:** Offline queues can flush the same event twice after a flaky reconnect; the second one
    silently rewrites the recorded return date (and any cost-to-job derived from it).
  - **Fix:** Skip / no-op the assignment update when `assignment.status === 'RETURNED'`, or only set
    `actualEndDate` if currently null.

- [ ] **Validate numeric `year`** — `src/routes/equipment.js` (POST ~263, PATCH ~290).
  - **What:** `Number(year)` on a non-numeric string yields `NaN`; Prisma rejects `NaN` for the Int
    column with an unmapped error → 500 instead of 400.
  - **Fix:** Validate `Number.isInteger(Number(year))` (or `Number.isFinite`) and return 400 on bad input.

- [ ] **`utilizationPct` NaN guard** — `src/lib/rentalMath.js:51`.
  - **What:** `Math.max(1, daysBetween(...))` returns `NaN` if `createdAt`/a date is missing, because
    `Math.max(1, NaN) === NaN`; `utilizationPct` then returns `NaN` (serializes to null).
  - **Why:** Not reachable today (routes always select `createdAt`), but the module is exported and a
    future caller passing a partial object would break the fleet rollup average.
  - **Fix:** Coerce a missing/invalid `windowStart` to a safe default, or guard `Number.isFinite`.

- [ ] **Friendly batch errors** — `src/routes/equipment-events.js:164`.
  - **What:** The offline-batch `errors[]` pushes raw `err.message` (full Prisma text) for FK/validation
    failures instead of the mapped friendly message.
  - **Fix:** Map known Prisma codes (P2003 → "Invalid foreign key reference") inside `processEvent` or
    the batch catch before recording the per-item error.

- [ ] **`utilizationPct` double-counts overlapping assignments** — `src/lib/rentalMath.js:54`.
  - **What:** Overlapping assignments are summed independently into `usedDays`, double-counting deployed
    days for a double-booked machine (capped at 100%, so it's hidden but inaccurate).
  - **Why:** Not visible in the current seed, but the product exists to surface double-bookings, so the
    number is meaningless for exactly the machines it's meant to flag.
  - **Fix:** Merge overlapping intervals before summing (union of `[start, end]` ranges).

- [ ] **(P3 from eng-review) `node:assert` smoke test** — `rentalMath` + conflict overlap, wired as
  `npm run test:rentals`. Cheap because `rentalMath` is already a pure module.
