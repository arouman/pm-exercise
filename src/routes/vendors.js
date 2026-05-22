import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

const VALID_CATEGORIES = [
  'CONCRETE',
  'REBAR',
  'FASTENERS',
  'LUMBER',
  'ELECTRICAL',
  'TOOLS_RENTAL_EXTERNAL',
];

/**
 * @openapi
 * /api/vendors:
 *   get:
 *     tags: [Vendors]
 *     summary: List vendors
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [CONCRETE, REBAR, FASTENERS, LUMBER, ELECTRICAL, TOOLS_RENTAL_EXTERNAL] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Vendor list (includes material count)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Vendor' }
 *   post:
 *     tags: [Vendors]
 *     summary: Create a vendor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Vendor' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Vendor' }
 */
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res
        .status(400)
        .json({ error: `category must be one of ${VALID_CATEGORIES.join(', ')}` });
    }
    const vendors = await prisma.vendor.findMany({
      where: category ? { category } : undefined,
      orderBy: { name: 'asc' },
      include: { _count: { select: { materials: true, purchaseOrders: true } } },
      take: limit,
      skip: offset,
    });
    res.json(vendors);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category, contactEmail, contactPhone, paymentTerms } = req.body;
    if (!name || !category || !contactEmail || !contactPhone || !paymentTerms) {
      return res.status(400).json({
        error:
          'Missing required fields. Required: name, category, contactEmail, contactPhone, paymentTerms.',
      });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res
        .status(400)
        .json({ error: `category must be one of ${VALID_CATEGORIES.join(', ')}` });
    }
    const vendor = await prisma.vendor.create({
      data: { name, category, contactEmail, contactPhone, paymentTerms },
    });
    res.status(201).json(vendor);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/vendors/{id}:
 *   get:
 *     tags: [Vendors]
 *     summary: Get one vendor (with materials)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200:
 *         description: Vendor detail
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Vendor' }
 *       404:
 *         description: Not found
 *   put:
 *     tags: [Vendors]
 *     summary: Update a vendor
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Vendor' }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Vendors]
 *     summary: Delete a vendor
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       204: { description: Deleted }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        materials: { orderBy: { name: 'asc' } },
        _count: { select: { purchaseOrders: true } },
      },
    });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, contactEmail, contactPhone, paymentTerms } = req.body;
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res
        .status(400)
        .json({ error: `category must be one of ${VALID_CATEGORIES.join(', ')}` });
    }
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { name, category, contactEmail, contactPhone, paymentTerms },
    });
    res.json(vendor);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Vendor not found' });
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.vendor.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Vendor not found' });
    next(e);
  }
});

export default router;
