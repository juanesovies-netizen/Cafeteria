import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { HttpError } from '../lib/utils.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { itemCreateSchema, itemUpdateSchema, movementSchema } from '../validators/schemas.js';
import { applyStockMovement, stockStatus } from '../services/stock.service.js';

const router = Router();
// Inventario: visible para ADMIN y CASHIER. Solo ADMIN crea/edita/elimina insumos.
router.use(authenticate, authorize('ADMIN', 'CASHIER'));

const withStatus = (item) => ({ ...item, status: stockStatus(item) });

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'ID inválido');
  return id;
};

// GET /api/inventory?search=&categoryId=&status=ok|low|out&active=true|false
router.get('/', async (req, res) => {
  const { search, categoryId, status, active } = req.query;
  const minStockRef = prisma.inventoryItem.fields.minStock;
  const where = { AND: [] };

  if (search) {
    where.AND.push({
      OR: [{ name: { contains: search } }, { sku: { contains: search } }, { supplier: { contains: search } }],
    });
  }
  if (categoryId === 'none') where.AND.push({ categoryId: null });
  else if (categoryId) where.AND.push({ categoryId: Number(categoryId) });

  if (status === 'out') where.AND.push({ stock: { lte: 0 } });
  else if (status === 'low') where.AND.push({ stock: { gt: 0 } }, { stock: { lte: minStockRef } });
  else if (status === 'ok') where.AND.push({ stock: { gt: 0 } }, { stock: { gt: minStockRef } });

  if (active === 'true' || active === 'false') where.AND.push({ active: active === 'true' });

  const items = await prisma.inventoryItem.findMany({
    where,
    include: { category: true },
    orderBy: { name: 'asc' },
  });
  res.json(items.map(withStatus));
});

// GET /api/inventory/stats -> resumen para el panel
router.get('/stats', async (req, res) => {
  const items = await prisma.inventoryItem.findMany({
    where: { active: true },
    select: { id: true, sku: true, name: true, unit: true, stock: true, minStock: true, unitCost: true },
    orderBy: { stock: 'asc' },
  });

  const alerts = items.map(withStatus).filter((i) => i.status !== 'ok');
  res.json({
    totalItems: items.length,
    lowStock: alerts.filter((i) => i.status === 'low').length,
    outOfStock: alerts.filter((i) => i.status === 'out').length,
    totalValue: Math.round(items.reduce((acc, i) => acc + i.stock * i.unitCost, 0) * 100) / 100,
    alerts,
  });
});

// GET /api/inventory/movements?limit=20 -> últimos movimientos de todo el inventario
router.get('/movements', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const movements = await prisma.stockMovement.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      item: { select: { id: true, name: true, sku: true, unit: true } },
      user: { select: { id: true, name: true } },
    },
  });
  res.json(movements);
});

// GET /api/inventory/:id
router.get('/:id', async (req, res) => {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: parseId(req.params.id) },
    include: { category: true },
  });
  if (!item) throw new HttpError(404, 'Insumo no encontrado');
  res.json(withStatus(item));
});

// POST /api/inventory
router.post('/', authorize('ADMIN'), async (req, res) => {
  const { stock, ...data } = itemCreateSchema.parse(req.body);

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.inventoryItem.create({ data: { ...data, stock: 0 } });
    if (stock > 0) {
      // El stock inicial se registra como movimiento para mantener trazabilidad
      const { item: updated } = await applyStockMovement(tx, {
        itemId: created.id,
        type: 'ENTRADA',
        quantity: stock,
        reason: 'Stock inicial',
        userId: req.user.id,
      });
      return updated;
    }
    return tx.inventoryItem.findUnique({ where: { id: created.id }, include: { category: true } });
  });

  res.status(201).json(withStatus(item));
});

// PUT /api/inventory/:id  (el stock se modifica solo mediante movimientos)
router.put('/:id', authorize('ADMIN'), async (req, res) => {
  const data = itemUpdateSchema.parse(req.body);
  const item = await prisma.inventoryItem.update({
    where: { id: parseId(req.params.id) },
    data,
    include: { category: true },
  });
  res.json(withStatus(item));
});

// DELETE /api/inventory/:id
router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  await prisma.inventoryItem.delete({ where: { id: parseId(req.params.id) } });
  res.status(204).end();
});

// GET /api/inventory/:id/movements
router.get('/:id/movements', async (req, res) => {
  const movements = await prisma.stockMovement.findMany({
    where: { itemId: parseId(req.params.id) },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { id: true, name: true } } },
  });
  res.json(movements);
});

// POST /api/inventory/:id/movements  -> ENTRADA | SALIDA | AJUSTE (ADMIN y CASHIER)
router.post('/:id/movements', async (req, res) => {
  const data = movementSchema.parse(req.body);
  const result = await prisma.$transaction((tx) =>
    applyStockMovement(tx, { ...data, itemId: parseId(req.params.id), userId: req.user.id })
  );
  res.status(201).json({ movement: result.movement, item: withStatus(result.item) });
});

export default router;
