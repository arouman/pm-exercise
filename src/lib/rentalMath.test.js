// Smoke tests for the pure rental math. Run with `npm run test:rentals` (node --test, no deps).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { depreciation, rangesOverlap } from './rentalMath.js';

test('depreciation: hours-based book value for an owned machine', () => {
  // cost 78000, salvage 15% → base 66300; 9100/12000 = 0.7583 consumed.
  const d = depreciation({
    ownership: 'OWNED',
    acquisitionCost: 78000,
    usefulLifeHours: 12000,
    hoursUsed: 9100,
  });
  assert.equal(d.depreciationPct, 76);
  assert.equal(d.accumulatedDepreciation, 50277.5);
  assert.equal(d.bookValue, 27722.5);
});

test('depreciation: caps at 100% past useful life (never negative book value below salvage)', () => {
  const d = depreciation({
    ownership: 'OWNED',
    acquisitionCost: 10000,
    usefulLifeHours: 1000,
    hoursUsed: 5000, // 5x past life
  });
  assert.equal(d.depreciationPct, 100);
  assert.equal(d.accumulatedDepreciation, 8500); // base = 10000 * 0.85
  assert.equal(d.bookValue, 1500); // floored at the 15% salvage value
});

test('depreciation: null for a rented machine (you do not depreciate a rental)', () => {
  const d = depreciation({
    ownership: 'RENTED',
    acquisitionCost: 50000,
    usefulLifeHours: 10000,
    hoursUsed: 1000,
  });
  assert.deepEqual(d, { bookValue: null, accumulatedDepreciation: null, depreciationPct: null });
});

test('depreciation: null when cost basis is missing', () => {
  const d = depreciation({ ownership: 'OWNED', acquisitionCost: null, usefulLifeHours: 10000 });
  assert.equal(d.bookValue, null);
  assert.equal(d.depreciationPct, null);
});

test('rangesOverlap: open-ended assignment conflicts with a later booking', () => {
  assert.equal(rangesOverlap('2026-01-01', null, '2026-06-01', '2026-07-01'), true);
  assert.equal(rangesOverlap('2026-01-01', '2026-02-01', '2026-06-01', '2026-07-01'), false);
});
