import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { api, UNIT_LABELS } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const EMPTY = {
  sku: '',
  name: '',
  description: '',
  unit: 'UNIDAD',
  stock: '',
  minStock: '',
  unitCost: '',
  supplier: '',
  categoryId: '',
  active: true,
};

/** Formulario para crear / editar un insumo. */
export default function ItemFormModal({ open, item, categories, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(item);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      item
        ? {
            sku: item.sku,
            name: item.name,
            description: item.description || '',
            unit: item.unit,
            stock: item.stock,
            minStock: item.minStock,
            unitCost: item.unitCost,
            supplier: item.supplier || '',
            categoryId: item.categoryId ?? '',
            active: item.active,
          }
        : EMPTY
    );
  }, [open, item]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = {
      ...form,
      minStock: form.minStock === '' ? 0 : form.minStock,
      unitCost: form.unitCost === '' ? 0 : form.unitCost,
    };
    if (isEdit) delete body.stock;
    else body.stock = form.stock === '' ? 0 : form.stock;

    try {
      const saved = await api(isEdit ? `/inventory/${item.id}` : '/inventory', {
        method: isEdit ? 'PUT' : 'POST',
        body,
      });
      toast.success(isEdit ? 'Insumo actualizado' : 'Insumo creado correctamente');
      onSaved(saved);
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const err = (k) => errors[k]?.[0] && <small className="field-error">{errors[k][0]}</small>;
  const cls = (k) => (errors[k] ? 'invalid' : '');

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Editar insumo' : 'Nuevo insumo'}
      subtitle={isEdit ? `${item.sku} · ${item.name}` : 'Registra un nuevo insumo en el inventario'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="item-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear insumo'}
          </button>
        </>
      }
    >
      <form id="item-form" onSubmit={submit} noValidate className="form-grid">
        <label className="field">
          <span>Código (SKU) *</span>
          <input className={cls('sku')} value={form.sku} onChange={set('sku')} placeholder="CAF-004" autoFocus />
          {err('sku')}
        </label>
        <label className="field span-2">
          <span>Nombre *</span>
          <input className={cls('name')} value={form.name} onChange={set('name')} placeholder="Café en grano Colombia" />
          {err('name')}
        </label>

        <label className="field">
          <span>Categoría</span>
          <select value={form.categoryId} onChange={set('categoryId')}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {err('categoryId')}
        </label>
        <label className="field">
          <span>Unidad de medida *</span>
          <select className={cls('unit')} value={form.unit} onChange={set('unit')}>
            {Object.entries(UNIT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {err('unit')}
        </label>
        <label className="field">
          <span>Proveedor</span>
          <input value={form.supplier} onChange={set('supplier')} placeholder="Nombre del proveedor" />
          {err('supplier')}
        </label>

        <label className="field">
          <span>{isEdit ? 'Stock actual' : 'Stock inicial'}</span>
          <input
            type="number"
            min="0"
            step="any"
            className={cls('stock')}
            value={form.stock}
            onChange={set('stock')}
            placeholder="0"
            disabled={isEdit}
          />
          {isEdit ? <small className="hint">Usa “Movimiento” para modificar el stock</small> : err('stock')}
        </label>
        <label className="field">
          <span>Stock mínimo</span>
          <input
            type="number"
            min="0"
            step="any"
            className={cls('minStock')}
            value={form.minStock}
            onChange={set('minStock')}
            placeholder="0"
          />
          {err('minStock') || <small className="hint">Se alertará al llegar a este nivel</small>}
        </label>
        <label className="field">
          <span>Costo unitario (USD)</span>
          <input
            type="number"
            min="0"
            step="any"
            className={cls('unitCost')}
            value={form.unitCost}
            onChange={set('unitCost')}
            placeholder="0.00"
          />
          {err('unitCost')}
        </label>

        <label className="field span-3">
          <span>Descripción</span>
          <textarea rows={2} value={form.description} onChange={set('description')} placeholder="Notas u observaciones" />
          {err('description')}
        </label>

        {isEdit && (
          <label className="switch span-3">
            <input type="checkbox" checked={form.active} onChange={set('active')} />
            <span className="switch-track" />
            <span>Insumo activo (los inactivos no cuentan en el panel)</span>
          </label>
        )}
      </form>
    </Modal>
  );
}
