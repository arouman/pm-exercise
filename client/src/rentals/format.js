// Shared formatting + date math for the rental surfaces. The rest of the app inlines a per-page
// `fmtDate`, but the rentals pages all deal in money and elapsed-day spans, so these live in one
// place to keep the dashboard, equipment list, and drawer consistent.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Whole days from `from` to `to` (floored, never negative). Mirrors src/lib/rentalMath.daysBetween
// but clamps at 0 — the UI only ever asks "how many days has this been running".
export function daysBetween(from, to = new Date()) {
  const d = Math.floor((new Date(to) - new Date(from)) / MS_PER_DAY);
  return d > 0 ? d : 0;
}

export function fmtUSD(n, { cents = false } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(n || 0);
}

export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Human label for a category enum (SKID_STEER -> "Skid Steer").
export function titleCase(s) {
  if (!s) return '';
  return s
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
