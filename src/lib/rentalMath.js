// Pure rental math — no DB, no req/res. Imported by the equipment routes so the overdue rule,
// the "today" anchor, and the $-waste formula live in exactly one place (eng-review Issue 4).
//
// All derivations work off EquipmentAssignment dates, NOT PurchaseOrder dates: one rental PO can
// carry several machines returned independently, so per-machine return is the canonical grain.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Whole days from `from` to `to` (negative if `to` is earlier). Floors partial days.
export function daysBetween(from, to) {
  return Math.floor((new Date(to) - new Date(from)) / MS_PER_DAY);
}

// The machine's ACTIVE assignment (where it currently lives / what it's on), or null.
export function activeAssignment(equipment) {
  return (equipment.assignments || []).find((a) => a.status === 'ACTIVE') || null;
}

// Current project is DERIVED, never stored: the project of the ACTIVE assignment (null = yard).
export function currentProjectId(equipment) {
  const a = activeAssignment(equipment);
  return a ? a.projectId : null;
}

// Days a rented machine is past its assignment's expectedEndDate (0 if on-time / not applicable).
export function daysOverdue(equipment, today = new Date()) {
  if (equipment.ownership !== 'RENTED') return 0;
  if (!['IN_USE', 'IDLE'].includes(equipment.status)) return 0;
  const a = activeAssignment(equipment);
  if (!a || a.actualEndDate) return 0;
  const over = daysBetween(a.expectedEndDate, today);
  return over > 0 ? over : 0;
}

export function isOverdue(equipment, today = new Date()) {
  return daysOverdue(equipment, today) > 0;
}

// Dollars burned holding a rented machine past its expected off-rent date.
export function wasteToDate(equipment, today = new Date()) {
  return +(daysOverdue(equipment, today) * (equipment.dailyRate || 0)).toFixed(2);
}

// Utilization = deployed days / available days across the machine's assignment window, capped 100%.
// Available window runs from the earliest of (createdAt, first assignment start) to today.
export function utilizationPct(equipment, today = new Date()) {
  const assignments = equipment.assignments || [];
  if (assignments.length === 0) return 0;
  const starts = assignments.map((a) => new Date(a.startDate).getTime());
  const windowStart = Math.min(new Date(equipment.createdAt).getTime(), ...starts);
  const windowDays = Math.max(1, daysBetween(windowStart, today));
  let usedDays = 0;
  for (const a of assignments) {
    const rawEnd = a.actualEndDate ? new Date(a.actualEndDate) : new Date(today);
    const end = rawEnd > new Date(today) ? today : rawEnd;
    usedDays += Math.max(0, daysBetween(a.startDate, end));
  }
  return Math.min(100, Math.round((usedDays / windowDays) * 100));
}

// Assumed resale floor as a fraction of acquisition cost — the part of the asset that is NOT
// depreciated away (units-of-production depreciates `cost - salvage` over the machine's life).
const SALVAGE_FRACTION = 0.15;

// Units-of-production (hours-based) depreciation for an OWNED machine with a known cost basis.
// Returns null fields when not computable (rented machine, or missing cost / useful-life), so the
// API and UI can cleanly skip depreciation for anything we don't depreciate.
export function depreciation(equipment) {
  const cost = equipment.acquisitionCost;
  const life = equipment.usefulLifeHours;
  if (equipment.ownership !== 'OWNED' || cost == null || !(life > 0)) {
    return { bookValue: null, accumulatedDepreciation: null, depreciationPct: null };
  }
  const depreciableBase = cost * (1 - SALVAGE_FRACTION);
  const lifeUsedFraction = Math.min(1, (equipment.hoursUsed || 0) / life);
  const accumulatedDepreciation = +(depreciableBase * lifeUsedFraction).toFixed(2);
  return {
    bookValue: +(cost - accumulatedDepreciation).toFixed(2),
    accumulatedDepreciation,
    depreciationPct: Math.round(lifeUsedFraction * 100),
  };
}

// Two date ranges [aStart,aEnd] and [bStart,bEnd] overlap (inclusive). Open-ended (null) end =
// treated as far future, so a still-out machine conflicts with anything starting after it.
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const FAR_FUTURE = 8640000000000000; // max date
  const a0 = new Date(aStart).getTime();
  const a1 = aEnd ? new Date(aEnd).getTime() : FAR_FUTURE;
  const b0 = new Date(bStart).getTime();
  const b1 = bEnd ? new Date(bEnd).getTime() : FAR_FUTURE;
  return a0 <= b1 && b0 <= a1;
}

// Attach all derived fields to an equipment record for API responses. `assignments` (and their
// `project`, if included) drive the derivation.
export function withDerived(equipment, today = new Date()) {
  const a = activeAssignment(equipment);
  return {
    ...equipment,
    currentProjectId: currentProjectId(equipment),
    currentProject: a ? (a.project ?? null) : null,
    isOverdue: isOverdue(equipment, today),
    daysOverdue: daysOverdue(equipment, today),
    wasteToDate: wasteToDate(equipment, today),
    utilizationPct: utilizationPct(equipment, today),
    ...depreciation(equipment),
  };
}
