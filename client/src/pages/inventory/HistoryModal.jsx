import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { api, formatDate, formatQty, UNITS } from '../../api/client';
import { MOVEMENT_META } from '../Dashboard';

/** Historial de movimientos de un insumo. */
export default function HistoryModal({ open, item, onClose }) {
  const [movements, setMovements] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !item) return;
    setMovements(null);
    setError('');
    api(`/inventory/${item.id}/movements`)
      .then(setMovements)
      .catch((e) => setError(e.message));
  }, [open, item]);

  if (!item) return null;
  const unit = UNITS[item.unit];

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Historial de movimientos" subtitle={`${item.sku} · ${item.name}`}>
      {error && <div className="alert alert-error">{error}</div>}
      {!movements && !error && <p className="empty">Cargando…</p>}
      {movements?.length === 0 && <p className="empty">Este insumo aún no tiene movimientos.</p>}
      {movements?.length > 0 && (
        <div className="table-wrap">
          <table className="table compact">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th className="num">Cantidad</th>
                <th className="num">Stock</th>
                <th>Motivo</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const meta = MOVEMENT_META[m.type];
                const sign = m.type === 'SALIDA' || m.quantity < 0 ? '−' : '+';
                return (
                  <tr key={m.id}>
                    <td className="nowrap">{formatDate(m.createdAt)}</td>
                    <td>
                      <span className={`tag ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className={`num ${meta.cls}`}>
                      {sign}
                      {formatQty(Math.abs(m.quantity))} {unit}
                    </td>
                    <td className="num nowrap">
                      {formatQty(m.previousStock)} → <strong>{formatQty(m.newStock)}</strong>
                    </td>
                    <td>{m.reason || <span className="muted">—</span>}</td>
                    <td>{m.user?.name || <span className="muted">Sistema</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
