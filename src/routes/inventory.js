import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

const VALID_TXN_TYPES = ['IN', 'OUT', 'TRANSFER'];

/**
 * @openapi
 * /api/inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: Current stock by (material, project) — joins material + project
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *       - in: query
 *         name: materialId
 *         schema: { type: string }
 *       - in: query
 *         name: lowStock
 *         description: If true, only items with quantityOnHand < 100
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Inventory list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/InventoryItem' }
 */
router.get('/', async (req, res, next) => {
  try {
    const { projectId, materialId, lowStock } = req.query;
    const where = {};
    if (projectId) where.projectId = projectId;
    if (materialId) where.materialId = materialId;
    if (lowStock === 'true') where.quantityOnHand = { lt: 100 };
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: [{ project: { name: 'asc' } }, { material: { name: 'asc' } }],
      include: { material: { include: { vendor: true } }, project: true },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/inventory/transactions:
 *   get:
 *     tags: [Inventory]
 *     summary: List inventory transactions (IN / OUT / TRANSFER)
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *       - in: query
 *         name: materialId
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [IN, OUT, TRANSFER] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200:
 *         description: Transaction list, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/InventoryTransaction' }
 *   post:
 *     tags: [Inventory]
 *     summary: Record an inventory transaction
 *     description: |
 *       Posts an IN, OUT, or TRANSFER transaction. This endpoint does NOT update the
 *       materialized `InventoryItem.quantityOnHand` automatically — that's intentionally
 *       left to the candidate to design if they need it for their rental flows.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/InventoryTransaction' }
 *     responses:
 *       201: { description: Created }
 */
router.get('/transactions', async (req, res, next) => {
  try {
    const { projectId, materialId, type } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const where = {};
    if (projectId) where.projectId = projectId;
    if (materialId) where.materialId = materialId;
    if (type) {
      if (!VALID_TXN_TYPES.includes(type)) {
        return res
          .status(400)
          .json({ error: `type must be one of ${VALID_TXN_TYPES.join(', ')}` });
      }
      where.type = type;
    }
    const txns = await prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        material: true,
        project: true,
        fromProject: true,
        user: true,
      },
    });
    res.json(txns);
  } catch (e) {
    next(e);
  }
});

router.post('/transactions', async (req, res, next) => {
  try {
    const { type, quantity, reference, materialId, projectId, fromProjectId, userId } = req.body;
    if (!type || quantity == null || !materialId || !projectId || !userId) {
      return res.status(400).json({
        error:
          'Missing required fields. Required: type, quantity, materialId, projectId, userId.',
      });
    }
    if (!VALID_TXN_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of ${VALID_TXN_TYPES.join(', ')}` });
    }
    if (type === 'TRANSFER' && !fromProjectId) {
      return res.status(400).json({ error: 'TRANSFER requires fromProjectId' });
    }
    const txn = await prisma.inventoryTransaction.create({
      data: {
        type,
        quantity: Number(quantity),
        reference,
        materialId,
        projectId,
        fromProjectId: type === 'TRANSFER' ? fromProjectId : null,
        userId,
      },
      include: { material: true, project: true, fromProject: true, user: true },
    });
    res.status(201).json(txn);
  } catch (e) {
    if (e.code === 'P2003') return res.status(400).json({ error: 'Invalid foreign key reference' });
    next(e);
  }
});

export default router;
