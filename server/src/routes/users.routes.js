import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { HttpError } from '../lib/utils.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { userCreateSchema, userUpdateSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

const select = { id: true, name: true, email: true, role: true, active: true, createdAt: true };

// GET /api/users
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({ select, orderBy: [{ role: 'asc' }, { name: 'asc' }] });
  res.json(users);
});

// POST /api/users  -> el administrador crea cajeros, otros administradores o clientes
router.post('/', async (req, res) => {
  const data = userCreateSchema.parse(req.body);
  const user = await prisma.user.create({
    data: { ...data, password: await bcrypt.hash(data.password, 10) },
    select,
  });
  res.status(201).json(user);
});

// PATCH /api/users/:id
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const data = userUpdateSchema.parse(req.body);

  if (id === req.user.id && (data.active === false || (data.role && data.role !== 'ADMIN'))) {
    throw new HttpError(400, 'No puedes desactivar ni quitarte el rol de administrador a ti mismo');
  }
  if (data.password) data.password = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.update({ where: { id }, data, select });
  res.json(user);
});

export default router;
