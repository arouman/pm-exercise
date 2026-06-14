// Simulated offline support for the field view. NOT a real service worker / IndexedDB / background
// sync — per the prototype scope it's a localStorage-backed queue plus a manual "online" toggle.
// The point it proves: a superintendent can capture check-in/out events with no signal, and they
// replay later with their ORIGINAL field timestamp (occurredAt) so the office sees the true sequence
// and the offline gap (syncedAt - occurredAt).

import { api } from '../api/client';

const QUEUE_KEY = 'subbase.field.queue';

function read() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  // Same-tab listeners: the native 'storage' event only fires in OTHER tabs, so we emit our own.
  window.dispatchEvent(new Event('field-queue-change'));
}

export function getQueue() {
  return read();
}

export function queueCount() {
  return read().length;
}

// Add an event to the queue. `occurredAt` is stamped now (field time) and preserved through sync.
export function enqueue(event) {
  const items = read();
  items.push({
    ...event,
    occurredAt: event.occurredAt || new Date().toISOString(),
    _queuedAt: Date.now(),
  });
  write(items);
  return items.length;
}

export function clearQueue() {
  write([]);
}

// Flush the whole queue to the server in one batch POST. The events endpoint accepts an array and
// returns { created, errors }; we drop the successfully-created ones and keep any that errored so a
// partial failure doesn't lose the rest. Returns { created, errors }.
export async function flushQueue() {
  const items = read();
  if (items.length === 0) return { created: [], errors: [] };
  // Strip our local-only bookkeeping field before sending.
  const payload = items.map(({ _queuedAt, ...e }) => e);
  const res = await api.post('/api/equipment-events', payload);
  const { created = [], errors = [] } = res || {};
  if (errors.length === 0) {
    clearQueue();
  } else {
    // Keep only the events whose index errored, so the user can retry just those.
    const failedIdx = new Set(errors.map((e) => e.index));
    write(items.filter((_, i) => failedIdx.has(i)));
  }
  return { created, errors };
}

// Subscribe to queue changes (same tab + cross tab). Returns an unsubscribe fn.
export function onQueueChange(handler) {
  const local = () => handler(read());
  window.addEventListener('field-queue-change', local);
  window.addEventListener('storage', local);
  return () => {
    window.removeEventListener('field-queue-change', local);
    window.removeEventListener('storage', local);
  };
}
