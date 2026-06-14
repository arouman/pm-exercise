import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

const VALID_TYPE = ['CHECK_OUT', 'CHECK_IN', 'OFF_RENT', 'DOWN', 'TRANSFER'];
const VALID_CONDITION = ['GOOD', 'DAMAGED', 'NEEDS_SERVICE'];

// What a machine's status becomes after each event type.
const STATUS_AFTER = {
  CHECK_OUT: 'IN_USE',
  CHECK_IN: 'AVAILABLE',
  OFF_RENT: 'RETURNED',
  DOWN: 'DOWN',
  TRANSFER: 'IN_USE',
};

// Event types that end a machine's time on its current assignment.
const ENDS_ASSIGNMENT = new Set(['CHECK_IN', 'OFF_RENT']);

// Create one event and apply its side effects.
//
// NOTE (eng-review Issue 3, accepted prototype limitation): these are plain sequential awaits, NOT
// a prisma.$transaction. A mid-sequence failure can leave the event written but the status/assignment
// un-updated. Acceptable at prototype scale; the production fix is to wrap this in $transaction.
async function processEvent(body) {
  const {
    type,
    condition,
    photoUrl,
    notes,
    equipmentId,
    assignmentId,
    projectId,
    userId,
    occurredAt,
    syncedAt,
  } = body;
  if (!type || !equipmentId || !userId) {
    const err = new Error('Missing required fields. Required: type, equipmentId, userId.');
    err.status = 400;
    throw err;
  }
  if (!VALID_TYPE.includes(type)) {
    const err = new Error(`type must be one of ${VALID_TYPE.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (condition && !VALID_CONDITION.includes(condition)) {
    const err = new Error(`condition must be one of ${VALID_CONDITION.join(', ')}`);
    err.status = 400;
    throw err;
  }

  // Guard: a referenced assignment must belong to THIS machine. Without this, a CHECK_IN/OFF_RENT
  // with a mismatched assignmentId would close a different machine's assignment. Checked before any
  // write so a bad reference fails cleanly instead of corrupting state.
  if (assignmentId) {
    const asg = await prisma.equipmentAssignment.findUnique({ where: { id: assignmentId } });
    if (!asg) {
      const err = new Error('Invalid assignmentId');
      err.status = 400;
      throw err;
    }
    if (asg.equipmentId !== equipmentId) {
      const err = new Error('assignmentId does not belong to equipmentId');
      err.status = 400;
      throw err;
    }
  }

  const occurred = occurredAt ? new Date(occurredAt) : new Date();

  const event = await prisma.equipmentEvent.create({
    data: {
      type,
      condition: condition ?? null,
      photoUrl: photoUrl ?? null,
      notes: notes ?? null,
      equipmentId,
      assignmentId: assignmentId ?? null,
      projectId: projectId ?? null,
      userId,
      occurredAt: occurred,
      // syncedAt = when the server received it. The gap from occurredAt is the offline window.
      syncedAt: syncedAt ? new Date(syncedAt) : new Date(),
    },
  });

  // Side effect 1: advance the machine's status.
  await prisma.equipment.update({
    where: { id: equipmentId },
    data: { status: STATUS_AFTER[type] },
  });

  // Side effect 2: a CHECK_IN / OFF_RENT against an assignment ends that assignment.
  if (assignmentId && ENDS_ASSIGNMENT.has(type)) {
    await prisma.equipmentAssignment.update({
      where: { id: assignmentId },
      data: { status: 'RETURNED', actualEndDate: occurred },
    });
  }

  return event;
}

/**
 * @openapi
 * /api/equipment-events:
 *   get:
 *     tags: [Equipment Events]
 *     summary: List equipment events (field check-in/out, off-rent, breakdowns), newest first
 *     parameters:
 *       - in: query
 *         name: equipmentId
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [CHECK_OUT, CHECK_IN, OFF_RENT, DOWN, TRANSFER] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200:
 *         description: Event list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/EquipmentEvent' }
 *   post:
 *     tags: [Equipment Events]
 *     summary: Record a field event (single object) or flush an offline batch (array)
 *     description: |
 *       Accepts either one event object or an ARRAY of events (the offline queue flush). Each event
 *       advances `Equipment.status` and, for CHECK_IN/OFF_RENT with an `assignmentId`, ends that
 *       assignment. Pass `occurredAt` to preserve the original field time when replaying a queue;
 *       the server stamps `syncedAt` on receipt. A batch returns `{ created, errors }` so one bad
 *       queued event doesn't poison the whole sync.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EquipmentEvent' }
 *     responses:
 *       201: { description: 'Created — a single event, or a batch result with created and errors arrays' }
 */
router.get('/', async (req, res, next) => {
  try {
    const { equipmentId, type } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    if (type && !VALID_TYPE.includes(type)) {
      return res.status(400).json({ error: `type must be one of ${VALID_TYPE.join(', ')}` });
    }
    const where = {};
    if (equipmentId) where.equipmentId = equipmentId;
    if (type) where.type = type;
    const events = await prisma.equipmentEvent.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: { equipment: true, user: true, project: true, assignment: true },
    });
    res.json(events);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    // Batch flush (offline queue): array of events, per-item resilience so one failure doesn't
    // drop the rest of the queue.
    if (Array.isArray(req.body)) {
      const created = [];
      const errors = [];
      for (const [i, item] of req.body.entries()) {
        try {
          created.push(await processEvent(item));
        } catch (err) {
          errors.push({ index: i, error: err.message });
        }
      }
      return res.status(201).json({ created, errors });
    }

    // Single event.
    const event = await processEvent(req.body);
    res.status(201).json(event);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    if (e.code === 'P2003') return res.status(400).json({ error: 'Invalid foreign key reference' });
    next(e);
  }
});

export default router;
