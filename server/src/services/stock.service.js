import { HttpError, round3 } from '../lib/utils.js';

/**
 * Aplica un movimiento de stock dentro de una transacción de Prisma.
 * - ENTRADA: suma la cantidad.
 * - SALIDA:  resta la cantidad (no permite stock negativo).
 * - AJUSTE:  establece el stock al valor indicado (conteo físico).
 *
 * Este servicio será reutilizado en el sprint de pedidos para descontar
 * automáticamente los insumos al confirmar una venta.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 */
export async function applyStockMovement(tx, { itemId, type, quantity, reason, userId }) {
  const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'Insumo no encontrado');

  const previousStock = item.stock;
  let newStock;
  let recordedQty = quantity;

  switch (type) {
    case 'ENTRADA':
      newStock = previousStock + quantity;
      break;
    case 'SALIDA':
      if (quantity > previousStock) {
        throw new HttpError(400, `Stock insuficiente. Disponible: ${previousStock} ${item.unit}`, {
          quantity: ['La cantidad supera el stock disponible'],
        });
      }
      newStock = previousStock - quantity;
      break;
    case 'AJUSTE':
      newStock = quantity;
      recordedQty = newStock - previousStock; // diferencia (puede ser negativa)
      break;
    default:
      throw new HttpError(400, 'Tipo de movimiento inválido');
  }

  newStock = round3(newStock);

  const movement = await tx.stockMovement.create({
    data: {
      type,
      quantity: round3(recordedQty),
      previousStock,
      newStock,
      reason: reason || null,
      itemId,
      userId: userId ?? null,
    },
  });
  const updatedItem = await tx.inventoryItem.update({
    where: { id: itemId },
    data: { stock: newStock },
    include: { category: true },
  });

  return { movement, item: updatedItem };
}

/** Estado de stock calculado: 'out' (agotado), 'low' (bajo mínimo) u 'ok'. */
export function stockStatus(item) {
  if (item.stock <= 0) return 'out';
  if (item.stock <= item.minStock) return 'low';
  return 'ok';
}
