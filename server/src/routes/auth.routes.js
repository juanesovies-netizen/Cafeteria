import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { HttpError } from '../lib/utils.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';

const router = Router();

const publicUser = ({ password, ...u }) => u;

// POST /api/auth/register  -> registro público (siempre rol CLIENT)
router.post('/register', async (req, res) => {
  const data = registerSchema.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new HttpError(409, 'El correo ya está registrado', { email: ['El correo ya está registrado'] });

  const user = await prisma.user.create({
    data: { ...data, password: await bcrypt.hash(data.password, 10), role: 'CLIENT' },
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }
  if (!user.active) throw new HttpError(403, 'Tu cuenta está desactivada. Contacta al administrador.');

  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user || !user.active) throw new HttpError(401, 'Sesión inválida');
  res.json(publicUser(user));
});

export default router;
