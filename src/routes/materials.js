import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

const VALID_UNITS = ['EA', 'LF', 'CY', 'LB', 'BAG'];

/**
 * @openapi
 * /api/materials:
 *   get:
 *     tags: [Materials]
 *     summary: List materials (joined with vendor)
 *     parameters:
 *       - in: query
 *         name: vendorId
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 200 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Material list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Material' }
 *   post:
 *     tags: [Materials]
 *     summary: Create a material
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Material' }
 *     responses:
 *       201: { description: Created }
 */
router.get('/', async (req, res, next) => {
  try {
    const { vendorId, category } = req.query;
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const offset = Number(req.query.offset) || 0;
    const where = {};
    if (vendorId) where.vendorId = vendorId;
    if (category) where.category = category;
    const materials = await prisma.material.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { vendor: true },
      take: limit,
      skip: offset,
    });
    res.json(materials);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { sku, name, category, unit, unitPrice, vendorId } = req.body;
    if (!sku || !name || !category || !unit || unitPrice == null || !vendorId) {
      return res.status(400).json({
        error: 'Missing required fields. Required: sku, name, category, unit, unitPrice, vendorId.',
      });
    }
    if (!VALID_UNITS.includes(unit)) {
      return res.status(400).json({ error: `unit must be one of ${VALID_UNITS.join(', ')}` });
    }
    const material = await prisma.material.create({
      data: { sku, name, category, unit, unitPrice: Number(unitPrice), vendorId },
      include: { vendor: true },
    });
    res.status(201).json(material);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'SKU already exists' });
    if (e.code === 'P2003') return res.status(400).json({ error: 'Invalid vendorId' });
    next(e);
  }
});

/**
 * @openapi
 * /api/materials/{id}:
 *   get:
 *     tags: [Materials]
 *     summary: Get one material
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Material detail, content: { application/json: { schema: { $ref: '#/components/schemas/Material' } } } }
 *       404: { description: Not found }
 *   put:
 *     tags: [Materials]
 *     summary: Update a material
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Materials]
 *     summary: Delete a material
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       204: { description: Deleted }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: req.params.id },
      include: { vendor: true },
    });
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json(material);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { sku, name, category, unit, unitPrice, vendorId } = req.body;
    if (unit && !VALID_UNITS.includes(unit)) {
      return res.status(400).json({ error: `unit must be one of ${VALID_UNITS.join(', ')}` });
    }
    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: {
        sku,
        name,
        category,
        unit,
        unitPrice: unitPrice != null ? Number(unitPrice) : undefined,
        vendorId,
      },
      include: { vendor: true },
    });
    res.json(material);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Material not found' });
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.material.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Material not found' });
    next(e);
  }
});

export default router;
