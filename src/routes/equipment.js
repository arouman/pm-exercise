import { Router } from 'express';
import { prisma } from '../db.js';
import { withDerived, utilizationPct } from '../lib/rentalMath.js';

const router = Router();

const VALID_OWNERSHIP = ['OWNED', 'RENTED'];
const VALID_STATUS = ['AVAILABLE', 'IN_USE', 'IDLE', 'DOWN', 'RETURNED'];
const VALID_CONDITION = ['NEW', 'USED', 'REFURBISHED'];

// Reject non-integer numerics before they reach Prisma (Number('abc') → NaN → 500). Returns an
// error string when invalid, or null when the value is absent (optional) or a valid integer.
function badInteger(value, field) {
  if (value == null) return null;
  return Number.isInteger(Number(value)) ? null : `${field} must be an integer`;
}
const VALID_CATEGORY = [
  'SKID_STEER',
  'LIFT',
  'COMPACTOR',
  'GENERATOR',
  'PUMP',
  'SAW',
  'TROWEL',
  'BREAKER',
  'EXCAVATOR',
  'OTHER',
];

// Standard include for deriving location / overdue / utilization. Assignments carry the canonical
// rental dates; project is pulled so the API can name the machine's current site.
const EQUIPMENT_INCLUDE = {
  vendor: true,
  purchaseOrder: true,
  assignments: { include: { project: true }, orderBy: { startDate: 'desc' } },
};

/**
 * @openapi
 * /api/equipment:
 *   get:
 *     tags: [Equipment]
 *     summary: Combined owned + rented equipment list, with derived rental fields
 *     description: |
 *       Each machine is returned with DERIVED fields computed in src/lib/rentalMath.js:
 *       `currentProjectId`/`currentProject` (from the ACTIVE assignment), `isOverdue`,
 *       `daysOverdue`, `wasteToDate` ($ burned past expected off-rent), and `utilizationPct`.
 *     parameters:
 *       - in: query
 *         name: ownership
 *         schema: { type: string, enum: [OWNED, RENTED] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [AVAILABLE, IN_USE, IDLE, DOWN, RETURNED] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: projectId
 *         description: Machines whose ACTIVE assignment is on this project
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Equipment list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Equipment' }
 *   post:
 *     tags: [Equipment]
 *     summary: Create an equipment record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Equipment' }
 *     responses:
 *       201: { description: Created }
 */
router.get('/', async (req, res, next) => {
  try {
    const { ownership, status, category, projectId } = req.query;
    if (ownership && !VALID_OWNERSHIP.includes(ownership)) {
      return res
        .status(400)
        .json({ error: `ownership must be one of ${VALID_OWNERSHIP.join(', ')}` });
    }
    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUS.join(', ')}` });
    }
    if (category && !VALID_CATEGORY.includes(category)) {
      return res
        .status(400)
        .json({ error: `category must be one of ${VALID_CATEGORY.join(', ')}` });
    }
    const where = {};
    if (ownership) where.ownership = ownership;
    if (status) where.status = status;
    if (category) where.category = category;
    if (projectId) where.assignments = { some: { projectId, status: 'ACTIVE' } };

    const machines = await prisma.equipment.findMany({
      where,
      orderBy: [{ ownership: 'asc' }, { assetTag: 'asc' }],
      include: EQUIPMENT_INCLUDE,
    });
    const today = new Date();
    res.json(machines.map((m) => withDerived(m, today)));
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/equipment/off-rent:
 *   get:
 *     tags: [Equipment]
 *     summary: Rented machines past their expected off-rent date, with $ waste
 *     description: Overdue rented machines (derived per-machine from the assignment), sorted by waste desc.
 *     responses:
 *       200:
 *         description: Overdue machines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Equipment' }
 */
router.get('/off-rent', async (req, res, next) => {
  try {
    const machines = await prisma.equipment.findMany({
      where: { ownership: 'RENTED', status: { in: ['IN_USE', 'IDLE'] } },
      include: EQUIPMENT_INCLUDE,
    });
    const today = new Date();
    const overdue = machines
      .map((m) => withDerived(m, today))
      .filter((m) => m.isOverdue)
      .sort((a, b) => b.wasteToDate - a.wasteToDate);
    res.json(overdue);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/equipment/utilization:
 *   get:
 *     tags: [Equipment]
 *     summary: Per-machine utilization plus a fleet rollup
 *     responses:
 *       200:
 *         description: Utilization report
 */
router.get('/utilization', async (req, res, next) => {
  try {
    const machines = await prisma.equipment.findMany({
      orderBy: [{ ownership: 'asc' }, { assetTag: 'asc' }],
      include: { assignments: true },
    });
    const today = new Date();
    const rows = machines.map((m) => ({
      id: m.id,
      assetTag: m.assetTag,
      name: m.name,
      ownership: m.ownership,
      status: m.status,
      utilizationPct: utilizationPct(m, today),
    }));
    const avg = rows.length
      ? Math.round(rows.reduce((sum, r) => sum + r.utilizationPct, 0) / rows.length)
      : 0;
    const fleet = {
      machineCount: machines.length,
      avgUtilizationPct: avg,
      onRentCount: machines.filter(
        (m) => m.ownership === 'RENTED' && ['IN_USE', 'IDLE'].includes(m.status),
      ).length,
      downCount: machines.filter((m) => m.status === 'DOWN').length,
    };
    res.json({ fleet, machines: rows });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/equipment/{id}:
 *   get:
 *     tags: [Equipment]
 *     summary: One machine with assignment history, event timeline, and derived fields
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Equipment detail }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Equipment]
 *     summary: Update a machine (status / fields)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const machine = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: {
        ...EQUIPMENT_INCLUDE,
        events: {
          include: { user: true, project: true, assignment: true },
          orderBy: { occurredAt: 'desc' },
        },
      },
    });
    if (!machine) return res.status(404).json({ error: 'Equipment not found' });
    res.json(withDerived(machine, new Date()));
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      assetTag,
      name,
      category,
      ownership,
      status,
      dailyRate,
      make,
      model,
      year,
      vendorId,
      purchaseOrderId,
      hoursUsed,
      acquisitionCondition,
      acquisitionCost,
      usefulLifeHours,
    } = req.body;
    if (!assetTag || !name || !category || !ownership || !status || dailyRate == null) {
      return res.status(400).json({
        error:
          'Missing required fields. Required: assetTag, name, category, ownership, status, dailyRate.',
      });
    }
    if (!VALID_CATEGORY.includes(category)) {
      return res
        .status(400)
        .json({ error: `category must be one of ${VALID_CATEGORY.join(', ')}` });
    }
    if (!VALID_OWNERSHIP.includes(ownership)) {
      return res
        .status(400)
        .json({ error: `ownership must be one of ${VALID_OWNERSHIP.join(', ')}` });
    }
    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUS.join(', ')}` });
    }
    if (acquisitionCondition != null && !VALID_CONDITION.includes(acquisitionCondition)) {
      return res
        .status(400)
        .json({ error: `acquisitionCondition must be one of ${VALID_CONDITION.join(', ')}` });
    }
    const intError =
      badInteger(year, 'year') ||
      badInteger(hoursUsed, 'hoursUsed') ||
      badInteger(usefulLifeHours, 'usefulLifeHours');
    if (intError) return res.status(400).json({ error: intError });
    if (acquisitionCost != null && !Number.isFinite(Number(acquisitionCost))) {
      return res.status(400).json({ error: 'acquisitionCost must be a number' });
    }
    const machine = await prisma.equipment.create({
      data: {
        assetTag,
        name,
        category,
        ownership,
        status,
        dailyRate: Number(dailyRate),
        make: make ?? null,
        model: model ?? null,
        year: year == null ? null : Number(year),
        vendorId: vendorId ?? null,
        purchaseOrderId: purchaseOrderId ?? null,
        hoursUsed: hoursUsed == null ? null : Number(hoursUsed),
        acquisitionCondition: acquisitionCondition ?? null,
        acquisitionCost: acquisitionCost == null ? null : Number(acquisitionCost),
        usefulLifeHours: usefulLifeHours == null ? null : Number(usefulLifeHours),
      },
    });
    res.status(201).json(machine);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'assetTag already exists' });
    if (e.code === 'P2003') return res.status(400).json({ error: 'Invalid foreign key reference' });
    next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const {
      name,
      status,
      dailyRate,
      make,
      model,
      year,
      hoursUsed,
      acquisitionCondition,
      acquisitionCost,
      usefulLifeHours,
    } = req.body;
    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUS.join(', ')}` });
    }
    if (acquisitionCondition != null && !VALID_CONDITION.includes(acquisitionCondition)) {
      return res
        .status(400)
        .json({ error: `acquisitionCondition must be one of ${VALID_CONDITION.join(', ')}` });
    }
    const intError =
      badInteger(year, 'year') ||
      badInteger(hoursUsed, 'hoursUsed') ||
      badInteger(usefulLifeHours, 'usefulLifeHours');
    if (intError) return res.status(400).json({ error: intError });
    if (acquisitionCost != null && !Number.isFinite(Number(acquisitionCost))) {
      return res.status(400).json({ error: 'acquisitionCost must be a number' });
    }
    const machine = await prisma.equipment.update({
      where: { id: req.params.id },
      data: {
        name,
        status,
        dailyRate: dailyRate == null ? undefined : Number(dailyRate),
        make,
        model,
        year: year == null ? undefined : Number(year),
        hoursUsed: hoursUsed == null ? undefined : Number(hoursUsed),
        acquisitionCondition: acquisitionCondition ?? undefined,
        acquisitionCost: acquisitionCost == null ? undefined : Number(acquisitionCost),
        usefulLifeHours: usefulLifeHours == null ? undefined : Number(usefulLifeHours),
      },
    });
    res.json(machine);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Equipment not found' });
    next(e);
  }
});

export default router;
