import { Router } from 'express';
import { prisma } from '../db.js';
import { rangesOverlap } from '../lib/rentalMath.js';

const router = Router();

const VALID_STATUS = ['SCHEDULED', 'ACTIVE', 'RETURNED'];

// Find assignments for a machine that overlap [startDate, endDate] and aren't already returned.
// Open-ended assignments (no actualEndDate) use expectedEndDate as their far edge.
async function findConflicts({ equipmentId, startDate, endDate, excludeId }) {
  const existing = await prisma.equipmentAssignment.findMany({
    where: {
      equipmentId,
      status: { not: 'RETURNED' },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { project: true },
  });
  return existing.filter((a) =>
    rangesOverlap(startDate, endDate, a.startDate, a.actualEndDate ?? a.expectedEndDate),
  );
}

/**
 * @openapi
 * /api/equipment-assignments:
 *   get:
 *     tags: [Equipment Assignments]
 *     summary: List equipment assignments
 *     parameters:
 *       - in: query
 *         name: equipmentId
 *         schema: { type: string }
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [SCHEDULED, ACTIVE, RETURNED] }
 *     responses:
 *       200:
 *         description: Assignment list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/EquipmentAssignment' }
 *   post:
 *     tags: [Equipment Assignments]
 *     summary: Assign a machine to a project for a date range (warns on conflicts, does not block)
 *     description: |
 *       Creates the assignment and returns any overlapping assignments for the same machine in a
 *       `conflicts` array. Conflicts are a WARNING, not a hard block — the fleet manager decides.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EquipmentAssignment' }
 *     responses:
 *       201: { description: 'Created — body includes the assignment and a conflicts array' }
 */
router.get('/', async (req, res, next) => {
  try {
    const { equipmentId, projectId, status } = req.query;
    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUS.join(', ')}` });
    }
    const where = {};
    if (equipmentId) where.equipmentId = equipmentId;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    const assignments = await prisma.equipmentAssignment.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: { equipment: true, project: true, createdBy: true },
    });
    res.json(assignments);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/equipment-assignments/conflicts:
 *   get:
 *     tags: [Equipment Assignments]
 *     summary: Check whether a proposed assignment would conflict (pre-submit warning)
 *     parameters:
 *       - in: query
 *         name: equipmentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: excludeId
 *         description: Assignment id to ignore (when editing an existing one)
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Overlapping assignments (empty array = no conflict)
 */
router.get('/conflicts', async (req, res, next) => {
  try {
    const { equipmentId, startDate, endDate, excludeId } = req.query;
    if (!equipmentId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'Required query params: equipmentId, startDate, endDate.' });
    }
    const conflicts = await findConflicts({ equipmentId, startDate, endDate, excludeId });
    res.json(conflicts);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      equipmentId,
      projectId,
      startDate,
      expectedEndDate,
      status,
      dailyRate,
      notes,
      createdById,
    } = req.body;
    if (!equipmentId || !projectId || !startDate || !expectedEndDate || !createdById) {
      return res.status(400).json({
        error:
          'Missing required fields. Required: equipmentId, projectId, startDate, expectedEndDate, createdById.',
      });
    }
    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUS.join(', ')}` });
    }
    // Snapshot the day rate from the machine if the caller didn't supply one (cost-to-job stability).
    let rate = dailyRate;
    if (rate == null) {
      const machine = await prisma.equipment.findUnique({ where: { id: equipmentId } });
      if (!machine) return res.status(400).json({ error: 'Invalid equipmentId' });
      rate = machine.dailyRate;
    }
    const conflicts = await findConflicts({ equipmentId, startDate, endDate: expectedEndDate });
    const assignment = await prisma.equipmentAssignment.create({
      data: {
        equipmentId,
        projectId,
        startDate: new Date(startDate),
        expectedEndDate: new Date(expectedEndDate),
        status: status || 'SCHEDULED',
        dailyRate: Number(rate),
        notes: notes ?? null,
        createdById,
      },
      include: { equipment: true, project: true, createdBy: true },
    });
    res.status(201).json({ assignment, conflicts });
  } catch (e) {
    if (e.code === 'P2003') return res.status(400).json({ error: 'Invalid foreign key reference' });
    next(e);
  }
});

/**
 * @openapi
 * /api/equipment-assignments/{id}:
 *   patch:
 *     tags: [Equipment Assignments]
 *     summary: Update an assignment (e.g. end it / change status)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { status, expectedEndDate, actualEndDate, notes } = req.body;
    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUS.join(', ')}` });
    }
    const assignment = await prisma.equipmentAssignment.update({
      where: { id: req.params.id },
      data: {
        status,
        notes,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : undefined,
        actualEndDate:
          actualEndDate === undefined ? undefined : actualEndDate ? new Date(actualEndDate) : null,
      },
      include: { equipment: true, project: true, createdBy: true },
    });
    res.json(assignment);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Assignment not found' });
    next(e);
  }
});

export default router;
