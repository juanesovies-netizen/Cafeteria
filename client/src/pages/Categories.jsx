import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'form' | 'delete', category }
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api('/categories')
      .then(setCategories)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(load, [load]);

  const close = useCallback(() => setModal(null), []);

  const openForm = (category = null) => {
    setForm({ name: category?.name || '', description: category?.description || '' });
    setErrors({});
    setModal({ type: 'form', category });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const cat = modal.category;
    try {
      await api(cat ? `/categories/${cat.id}` : '/categories', { method: cat ? 'PUT' : 'POST', body: form });
      toast.success(cat ? 'Categoría actualizada' : 'Categoría creada');
      close();
      load();
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api(`/categories/${modal.category.id}`, { method: 'DELETE' });
      toast.success('Categoría eliminada');
      close();
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Categorías</h1>
          <p className="muted">Organiza los insumos del inventario</p>
        </div>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <Plus size={18} /> Nueva categoría
        </button>
      </div>

      {!loading && categories.length === 0 && (
        <div className="card empty-state">
          <Tags size={40} />
          <p>Aún no hay categorías</p>
        </div>
      )}

      <div className="category-grid">
        {categories.map((c) => (
          <div key={c.id} className="card category-card">
            <div className="category-icon">
              <Tags size={20} />
            </div>
            <div className="category-info">
              <h3>{c.name}</h3>
              <p className="muted small">{c.description || 'Sin descripción'}</p>
              <span className="tag">
                {c._count.items} insumo{c._count.items === 1 ? '' : 's'}
              </span>
            </div>
            <div className="row-actions">
              <button className="icon-btn" title="Editar" aria-label="Editar" onClick={() => openForm(c)}>
                <Pencil size={17} />
              </button>
              <button
                className="icon-btn danger"
                title="Eliminar"
                aria-label="Eliminar"
                onClick={() => setModal({ type: 'delete', category: c })}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modal?.type === 'form'}
        onClose={close}
        size="sm"
        title={modal?.category ? 'Editar categoría' : 'Nueva categoría'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={close} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" form="category-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={save} noValidate>
          <label className="field">
            <span>Nombre *</span>
            <input
              autoFocus
              className={errors.name ? 'invalid' : ''}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Lácteos"
            />
            {errors.name?.[0] && <small className="field-error">{errors.name[0]}</small>}
          </label>
          <label className="field">
            <span>Descripción</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Opcional"
            />
            {errors.description?.[0] && <small className="field-error">{errors.description[0]}</small>}
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={modal?.type === 'delete'}
        title="Eliminar categoría"
        message={
          modal?.type === 'delete'
            ? `¿Eliminar "${modal.category.name}"? Sus ${modal.category._count.items} insumo(s) quedarán como "Sin categoría".`
            : ''
        }
        onConfirm={remove}
        onClose={close}
      />
    </>
  );
}
