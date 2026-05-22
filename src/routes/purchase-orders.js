import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

const VALID_PO_STATUSES = ['DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'];

/**
 * @openapi
 * /api/purchase-orders:
 *   get:
 *     tags: [Purchase Orders]
 *     summary: List POs (joined with vendor, project, createdBy)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *       - in: query
 *         name: vendorId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PO list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/PurchaseOrder' }
 *   post:
 *     tags: [Purchase Orders]
 *     summary: Create a PO (nested lines)
 *     description: |
 *       Creates a Purchase Order with nested `lines[]`. Each line must reference a `materialId`
 *       and provide `quantity` + `unitPrice`. `lineTotal` and PO `total` are computed by the server.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [poNumber, status, vendorId, projectId, createdById, lines]
 *             properties:
 *               poNumber: { type: string }
 *               status: { type: string }
 *               expectedDelivery: { type: string, format: date-time, nullable: true }
 *               vendorId: { type: string }
 *               projectId: { type: string }
 *               createdById: { type: string }
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [materialId, quantity, unitPrice]
 *                   properties:
 *                     materialId: { type: string }
 *                     quantity: { type: number }
 *                     unitPrice: { type: number }
 *     responses:
 *       201: { description: Created }
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, projectId, vendorId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (vendorId) where.vendorId = vendorId;
    const pos = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: true,
        project: true,
        createdBy: true,
        _count: { select: { lines: true, deliveries: true } },
      },
    });
    res.json(pos);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { poNumber, status, expectedDelivery, vendorId, projectId, createdById, lines } =
      req.body;
    if (!poNumber || !status || !vendorId || !projectId || !createdById || !Array.isArray(lines)) {
      return res.status(400).json({
        error:
          'Missing required fields. Required: poNumber, status, vendorId, projectId, createdById, lines[].',
      });
    }
    if (!VALID_PO_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of ${VALID_PO_STATUSES.join(', ')}` });
    }
    const enrichedLines = lines.map((l) => {
      const q = Number(l.quantity);
      const p = Number(l.unitPrice);
      return {
        materialId: l.materialId,
        quantity: q,
        unitPrice: p,
        lineTotal: +(q * p).toFixed(2),
      };
    });
    const total = +enrichedLines.reduce((acc, l) => acc + l.lineTotal, 0).toFixed(2);

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        status,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        total,
        vendorId,
        projectId,
        createdById,
        lines: { create: enrichedLines },
      },
      include: {
        vendor: true,
        project: true,
        createdBy: true,
        lines: { include: { material: true } },
      },
    });
    res.status(201).json(po);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'PO number already exists' });
    if (e.code === 'P2003') return res.status(400).json({ error: 'Invalid foreign key reference' });
    next(e);
  }
});

/**
 * @openapi
 * /api/purchase-orders/{id}:
 *   get:
 *     tags: [Purchase Orders]
 *     summary: Get one PO (with lines, vendor, project, deliveries)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: PO detail }
 *       404: { description: Not found }
 *   put:
 *     tags: [Purchase Orders]
 *     summary: Update a PO (top-level fields only; line edits not supported here)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        project: true,
        createdBy: true,
        lines: { include: { material: true } },
        deliveries: {
          orderBy: { deliveredAt: 'desc' },
          include: { receivedBy: true, lines: true },
        },
      },
    });
    if (!po) return res.status(404).json({ error: 'PurchaseOrder not found' });
    res.json(po);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { status, expectedDelivery, poNumber } = req.body;
    if (status && !VALID_PO_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of ${VALID_PO_STATUSES.join(', ')}` });
    }
    const po = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: {
        status,
        poNumber,
        expectedDelivery:
          expectedDelivery === undefined ? undefined : expectedDelivery ? new Date(expectedDelivery) : null,
      },
      include: { vendor: true, project: true, createdBy: true, lines: { include: { material: true } } },
    });
    res.json(po);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'PurchaseOrder not found' });
    next(e);
  }
});

export default router;
