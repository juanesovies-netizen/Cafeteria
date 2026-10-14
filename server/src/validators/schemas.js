import { z } from 'zod';
import { ROLES, UNITS, MOVEMENT_TYPES } from '../lib/utils.js';

/** String opcional: '' o solo espacios se convierte en null. */
const optionalText = (max) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().max(max, `Máximo ${max} caracteres`).nullable().optional()
  );

/** ID opcional: '', null o undefined => null. */
const nullableId = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number({ invalid_type_error: 'ID inválido' }).int().positive().nullable()
);

const nonNegative = (label) =>
  z.coerce
    .number({ invalid_type_error: `${label} debe ser un número` })
    .min(0, `${label} no puede ser negativo`)
    .max(1_000_000_000, `${label} es demasiado grande`);

// ---------- Auth / Usuarios ----------
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
});

export const userCreateSchema = registerSchema.extend({
  role: z.enum(ROLES, { errorMap: () => ({ message: 'Rol inválido' }) }),
});

export const userUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    role: z.enum(ROLES),
    active: z.boolean(),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
  })
  .partial();

// ---------- Categorías ----------
export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(60, 'Máximo 60 caracteres'),
  description: optionalText(200),
});

// ---------- Inventario ----------
export const itemCreateSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[A-Za-z0-9_-]+$/, 'Solo letras, números, guiones y guion bajo')
    .transform((s) => s.toUpperCase()),
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  description: optionalText(500),
  unit: z.enum(UNITS, { errorMap: () => ({ message: 'Unidad inválida' }) }),
  stock: nonNegative('El stock').default(0),
  minStock: nonNegative('El stock mínimo').default(0),
  unitCost: nonNegative('El costo').default(0),
  supplier: optionalText(100),
  categoryId: nullableId,
  active: z.boolean().optional(),
});

// El stock NO se edita directamente: se modifica mediante movimientos (trazabilidad).
export const itemUpdateSchema = itemCreateSchema.omit({ stock: true }).partial();

export const movementSchema = z
  .object({
    type: z.enum(MOVEMENT_TYPES, { errorMap: () => ({ message: 'Tipo de movimiento inválido' }) }),
    quantity: nonNegative('La cantidad'),
    reason: optionalText(200),
  })
  .refine((d) => d.type === 'AJUSTE' || d.quantity > 0, {
    message: 'La cantidad debe ser mayor a 0',
    path: ['quantity'],
  });
