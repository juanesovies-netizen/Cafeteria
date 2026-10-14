import { PrismaClient } from '@prisma/client';

// Instancia única de Prisma para toda la aplicación
const prisma = new PrismaClient();

export default prisma;
