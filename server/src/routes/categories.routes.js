import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { categorySchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'CASHIER'));

// GET /api/categories
router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { items: true } } },
  });
  res.json(categories);
});

// POST /api/categories
router.post('/', authorize('ADMIN'), async (req, res) => {
  const data = categorySchema.parse(req.body);
  const category = await prisma.category.create({ data });
  res.status(201).json(category);
});

// PUT /api/categories/:id
router.put('/:id', authorize('ADMIN'), async (req, res) => {
  const data = categorySchema.parse(req.body);
  const category = await prisma.category.update({ where: { id: Number(req.params.id) }, data });
  res.json(category);
});

// DELETE /api/categories/:id  (los insumos asociados quedan "Sin categoría")
router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  await prisma.category.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export default router;
