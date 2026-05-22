import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

const VALID_DELIVERY_STATUSES = ['PENDING', 'PARTIAL', 'COMPLETE'];

/**
 * @openapi
 * /api/deliveries:
 *   get:
 *     tags: [Deliveries]
 *     summary: List deliveries
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: purchaseOrderId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Delivery list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Delivery' }
 *   post:
 *     tags: [Deliveries]
 *     summary: Record a delivery against a PO
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [purchaseOrderId, deliveredAt, status, receivedById, lines]
 *             properties:
 *               purchaseOrderId: { type: string }
 *               deliveredAt: { type: string, format: date-time }
 *               status: { type: string }
 *               notes: { type: string, nullable: true }
 *               receivedById: { type: string }
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [purchaseOrderLineId, quantityReceived]
 *                   properties:
 *                     purchaseOrderLineId: { type: string }
 *                     quantityReceived: { type: number }
 *     responses:
 *       201: { description: Created }
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, purchaseOrderId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
    const deliveries = await prisma.delivery.findMany({
      where,
      orderBy: { deliveredAt: 'desc' },
      include: {
        receivedBy: true,
        purchaseOrder: { include: { vendor: true, project: true } },
        _count: { select: { lines: true } },
      },
    });
    res.json(deliveries);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { purchaseOrderId, deliveredAt, status, notes, receivedById, lines } = req.body;
    if (
      !purchaseOrderId ||
      !deliveredAt ||
      !status ||
      !receivedById ||
      !Array.isArray(lines)
    ) {
      return res.status(400).json({
        error:
          'Missing required fields. Required: purchaseOrderId, deliveredAt, status, receivedById, lines[].',
      });
    }
    if (!VALID_DELIVERY_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of ${VALID_DELIVERY_STATUSES.join(', ')}` });
    }
    const delivery = await prisma.delivery.create({
      data: {
        purchaseOrderId,
        deliveredAt: new Date(deliveredAt),
        status,
        notes,
        receivedById,
        lines: {
          create: lines.map((l) => ({
            purchaseOrderLineId: l.purchaseOrderLineId,
            quantityReceived: Number(l.quantityReceived),
          })),
        },
      },
      include: {
        receivedBy: true,
        purchaseOrder: { include: { vendor: true, project: true } },
        lines: true,
      },
    });
    res.status(201).json(delivery);
  } catch (e) {
    if (e.code === 'P2003') return res.status(400).json({ error: 'Invalid foreign key reference' });
    next(e);
  }
});

/**
 * @openapi
 * /api/deliveries/{id}:
 *   get:
 *     tags: [Deliveries]
 *     summary: Get one delivery (with PO + lines + material info)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Delivery detail }
 *       404: { description: Not found }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        receivedBy: true,
        purchaseOrder: { include: { vendor: true, project: true } },
        lines: {
          include: {
            purchaseOrderLine: { include: { material: true } },
          },
        },
      },
    });
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
  } catch (e) {
    next(e);
  }
});

export default router;
