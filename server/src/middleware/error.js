import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/utils.js';

export function notFound(req, res) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Datos inválidos',
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = [].concat(err.meta?.target || []);
      const details = Object.fromEntries(fields.map((f) => [f, ['Este valor ya está registrado']]));
      return res.status(409).json({ message: 'Ya existe un registro con ese valor', details });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
  }

  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
}
