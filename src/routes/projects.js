import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

const VALID_STATUSES = ['ACTIVE', 'COMPLETED', 'ON_HOLD'];

/**
 * @openapi
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: List projects
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, COMPLETED, ON_HOLD] }
 *     responses:
 *       200:
 *         description: Project list (with counts of POs, users, inventory items)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Project' }
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Project' }
 *     responses:
 *       201: { description: Created }
 */
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
    }
    const projects = await prisma.project.findMany({
      where: status ? { status } : undefined,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { purchaseOrders: true, users: true, inventoryItems: true } },
      },
    });
    res.json(projects);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, customer, address, status, startDate, projectedEndDate } = req.body;
    if (!name || !customer || !address || !status || !startDate) {
      return res.status(400).json({
        error: 'Missing required fields. Required: name, customer, address, status, startDate.',
      });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
    }
    const project = await prisma.project.create({
      data: {
        name,
        customer,
        address,
        status,
        startDate: new Date(startDate),
        projectedEndDate: projectedEndDate ? new Date(projectedEndDate) : null,
      },
    });
    res.status(201).json(project);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get one project (with users assigned)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Project detail }
 *       404: { description: Not found }
 *   put:
 *     tags: [Projects]
 *     summary: Update a project
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        users: { include: { user: true } },
        _count: {
          select: {
            purchaseOrders: true,
            inventoryItems: true,
            inventoryTransactions: true,
          },
        },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, customer, address, status, startDate, projectedEndDate } = req.body;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
    }
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name,
        customer,
        address,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        projectedEndDate:
          projectedEndDate === undefined ? undefined : projectedEndDate ? new Date(projectedEndDate) : null,
      },
    });
    res.json(project);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Project not found' });
    next(e);
  }
});

export default router;
