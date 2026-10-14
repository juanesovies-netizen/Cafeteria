import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { api, formatQty, UNITS } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { MOVEMENT_META } from '../Dashboard';

const HELP = {
  ENTRADA: 'Suma unidades al stock (compras, reposición).',
  SALIDA: 'Resta unidades del stock (mermas, consumo interno, vencidos).',
  AJUSTE: 'Fija el stock al valor contado físicamente.',
};

/** Registrar una entrada, salida o ajuste de stock. */
export default function MovementModal({ open, item, onClose, onSaved }) {
  const toast = useToast();
  const [type, setType] = useState('ENTRADA');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType('ENTRADA');
      setQuantity('');
      setReason('');
      setErrors({});
    }
  }, [open]);

  if (!item) return null;

  const q = Number(quantity) || 0;
  const preview = type === 'ENTRADA' ? item.stock + q : type === 'SALIDA' ? item.stock - q : q;
  const unit = UNITS[item.unit];

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const res = await api(`/inventory/${item.id}/movements`, {
        method: 'POST',
        body: { type, quantity: quantity === '' ? undefined : quantity, reason },
      });
      toast.success(`${MOVEMENT_META[type].label} registrada: ${item.name}`);
      onSaved(res.item);
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar movimiento"
      subtitle={`${item.sku} · ${item.name}`}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="movement-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Registrando…' : 'Registrar'}
          </button>
        </>
      }
    >
      <form id="movement-form" onSubmit={submit} noValidate>
        <div className="segmented">
          {Object.entries(MOVEMENT_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <button
                type="button"
                key={key}
                className={`segment ${meta.cls} ${type === key ? 'active' : ''}`}
                onClick={() => setType(key)}
              >
                <Icon size={18} />
                {meta.label}
              </button>
            );
          })}
        </div>
        <p className="hint mb">{HELP[type]}</p>

        <label className="field">
          <span>{type === 'AJUSTE' ? `Nuevo stock (${unit})` : `Cantidad (${unit})`} *</span>
          <input
            type="number"
            min="0"
            step="any"
            autoFocus
            className={errors.quantity ? 'invalid' : ''}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
          {errors.quantity?.[0] && <small className="field-error">{errors.quantity[0]}</small>}
        </label>

        <label className="field">
          <span>Motivo</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={type === 'ENTRADA' ? 'Compra a proveedor' : type === 'SALIDA' ? 'Merma / producto vencido' : 'Conteo físico'}
          />
          {errors.reason?.[0] && <small className="field-error">{errors.reason[0]}</small>}
        </label>

        <div className="stock-preview">
          <div>
            <small>Stock actual</small>
            <strong>
              {formatQty(item.stock)} {unit}
            </strong>
          </div>
          <span className="arrow">→</span>
          <div>
            <small>Stock resultante</small>
            <strong className={preview < 0 ? 'text-danger' : preview <= item.minStock ? 'text-warning' : 'text-success'}>
              {formatQty(preview)} {unit}
            </strong>
          </div>
        </div>
        {preview < 0 && <p className="field-error">La salida supera el stock disponible.</p>}
      </form>
    </Modal>
  );
}
