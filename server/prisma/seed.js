import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos de ejemplo...');

  await prisma.stockMovement.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const users = [
    { name: 'Administrador', email: 'admin@cafeteria.com', password: 'admin123', role: 'ADMIN' },
    { name: 'Carla Cajera', email: 'cajero@cafeteria.com', password: 'cajero123', role: 'CASHIER' },
    { name: 'Cliente Demo', email: 'cliente@cafeteria.com', password: 'cliente123', role: 'CLIENT' },
  ];
  const created = {};
  for (const u of users) {
    created[u.role] = await prisma.user.create({
      data: { ...u, password: await bcrypt.hash(u.password, 10) },
    });
  }

  const categoryNames = {
    cafe: ['Café y granos', 'Granos, café molido y cápsulas'],
    lacteos: ['Lácteos', 'Leches, cremas y alternativas vegetales'],
    endulzantes: ['Endulzantes y jarabes', 'Azúcar, edulcorantes y jarabes saborizados'],
    panaderia: ['Panadería y repostería', 'Croissants, pasteles, galletas'],
    desechables: ['Desechables', 'Vasos, tapas, servilletas, removedores'],
    otros: ['Otros insumos', 'Tés, chocolate, frutas y varios'],
  };
  const cat = {};
  for (const [key, [name, description]] of Object.entries(categoryNames)) {
    cat[key] = await prisma.category.create({ data: { name, description } });
  }

  const items = [
    ['CAF-001', 'Café en grano Arábica', 'KG', 12, 5, 18.5, 'Tostaduría Andina', 'cafe'],
    ['CAF-002', 'Café molido Espresso', 'KG', 3, 4, 16.0, 'Tostaduría Andina', 'cafe'],
    ['CAF-003', 'Café descafeinado', 'KG', 1.5, 1, 21.0, 'Tostaduría Andina', 'cafe'],
    ['LAC-001', 'Leche entera', 'L', 24, 10, 1.1, 'Lácteos del Valle', 'lacteos'],
    ['LAC-002', 'Leche de almendras', 'L', 4, 6, 3.2, 'NutriVeg', 'lacteos'],
    ['LAC-003', 'Crema para batir', 'L', 0, 2, 4.5, 'Lácteos del Valle', 'lacteos'],
    ['END-001', 'Azúcar blanca (sobres)', 'UNIDAD', 800, 200, 0.02, 'Distribuidora Central', 'endulzantes'],
    ['END-002', 'Jarabe de vainilla', 'ML', 1500, 500, 0.012, 'Sabores Gourmet', 'endulzantes'],
    ['END-003', 'Jarabe de caramelo', 'ML', 300, 500, 0.012, 'Sabores Gourmet', 'endulzantes'],
    ['PAN-001', 'Croissant de mantequilla', 'UNIDAD', 18, 10, 0.6, 'Panadería La Espiga', 'panaderia'],
    ['PAN-002', 'Muffin de arándanos', 'UNIDAD', 6, 8, 0.8, 'Panadería La Espiga', 'panaderia'],
    ['DES-001', 'Vaso 12 oz', 'UNIDAD', 450, 150, 0.08, 'EcoPack', 'desechables'],
    ['DES-002', 'Tapa para vaso 12 oz', 'UNIDAD', 420, 150, 0.04, 'EcoPack', 'desechables'],
    ['DES-003', 'Servilletas', 'PAQUETE', 2, 5, 1.5, 'EcoPack', 'desechables'],
    ['OTR-001', 'Chocolate en polvo', 'KG', 2.5, 1, 9.0, 'Cacao Real', 'otros'],
    ['OTR-002', 'Té verde (bolsitas)', 'UNIDAD', 120, 40, 0.1, 'Herbal House', 'otros'],
  ];

  for (const [sku, name, unit, stock, minStock, unitCost, supplier, catKey] of items) {
    const item = await prisma.inventoryItem.create({
      data: { sku, name, unit, stock, minStock, unitCost, supplier, categoryId: cat[catKey].id },
    });
    if (stock > 0) {
      await prisma.stockMovement.create({
        data: {
          type: 'ENTRADA',
          quantity: stock,
          previousStock: 0,
          newStock: stock,
          reason: 'Stock inicial',
          itemId: item.id,
          userId: created.ADMIN.id,
        },
      });
    }
  }

  console.log('✅ Datos creados. Usuarios de prueba:');
  users.forEach((u) => console.log(`   ${u.role.padEnd(8)} ${u.email} / ${u.password}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
