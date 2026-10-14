import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, ArrowLeftRight, History, PackageOpen, ArrowUpDown, RotateCcw } from 'lucide-react';
import { api, formatMoney, formatQty, UNITS } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StockBadge from '../../components/StockBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { StatCards } from '../Dashboard';
import ItemFormModal from './ItemFormModal';
import MovementModal from './MovementModal';
import HistoryModal from './HistoryModal';

const INITIAL_FILTERS = { search: '', categoryId: '', status: '', active: '' };

export default function Inventory() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'ADMIN';

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  // Modal activo: { type: 'form' | 'movement' | 'history' | 'delete', item }
  const [modal, setModal] = useState(null);
  const closeModal = useCallback(() => setModal(null), []);

  // Búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search })), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([api('/inventory', { params: filters }), api('/inventory/stats')]);
      setItems(list);
      setStats(s);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    api('/categories').then(setCategories).catch((e) => toast.error(e.message));
  }, [toast]);

  const sorted = useMemo(() => {
    const getter = {
      name: (i) => i.name.toLowerCase(),
      sku: (i) => i.sku,
      category: (i) => i.category?.name?.toLowerCase() || '~',
      stock: (i) => i.stock,
      unitCost: (i) => i.unitCost,
      value: (i) => i.stock * i.unitCost,
    }[sort.key];
    return [...items].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      const r = va < vb ? -1 : va > vb ? 1 : 0;
      return sort.dir === 'asc' ? r : -r;
    });
  }, [items, sort]);

  const toggleSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const SortTh = ({ k, children, className = '' }) => (
    <th className={`sortable ${className}`} onClick={() => toggleSort(k)}>
      <span>
        {children}
        <ArrowUpDown size={13} className={sort.key === k ? 'active' : ''} />
      </span>
    </th>
  );

  const handleSaved = () => {
    closeModal();
    loadItems();
  };

  const handleDelete = async () => {
    try {
      await api(`/inventory/${modal.item.id}`, { method: 'DELETE' });
      toast.success(`"${modal.item.name}" eliminado`);
      closeModal();
      loadItems();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const hasFilters = search || filters.categoryId || filters.status || filters.active;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Inventario</h1>
          <p className="muted">Controla los insumos de tu cafetería y sus niveles de stock</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal({ type: 'form', item: null })}>
            <Plus size={18} /> Nuevo insumo
          </button>
        )}
      </div>

      <StatCards stats={stats} />

      <section className="card">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, código o proveedor…"
              aria-label="Buscar insumos"
            />
          </div>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="none">Sin categoría</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="ok">Disponible</option>
            <option value="low">Stock bajo</option>
            <option value="out">Agotado</option>
          </select>
          <select
            value={filters.active}
            onChange={(e) => setFilters({ ...filters, active: e.target.value })}
            aria-label="Filtrar por actividad"
          >
            <option value="">Activos e inactivos</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>
          {hasFilters && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setSearch('');
                setFilters(INITIAL_FILTERS);
              }}
            >
              <RotateCcw size={16} /> Limpiar
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <SortTh k="sku">Código</SortTh>
                <SortTh k="name">Insumo</SortTh>
                <SortTh k="category">Categoría</SortTh>
                <SortTh k="stock" className="num">Stock</SortTh>
                <th className="num">Mínimo</th>
                <SortTh k="unitCost" className="num">Costo unit.</SortTh>
                <SortTh k="value" className="num">Valor</SortTh>
                <th>Estado</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    <td colSpan={9}>
                      <div className="skeleton" />
                    </td>
                  </tr>
                ))}

              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <PackageOpen size={40} />
                      <p>{hasFilters ? 'No hay insumos que coincidan con los filtros' : 'Aún no hay insumos registrados'}</p>
                      {isAdmin && !hasFilters && (
                        <button className="btn btn-primary" onClick={() => setModal({ type: 'form', item: null })}>
                          <Plus size={16} /> Agregar el primero
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {sorted.map((item) => (
                <tr key={item.id} className={item.active ? '' : 'inactive'}>
                  <td>
                    <code>{item.sku}</code>
                  </td>
                  <td>
                    <div className="cell-main">
                      <strong>{item.name}</strong>
                      <small className="muted">
                        {item.supplier || 'Sin proveedor'}
                        {!item.active && ' · Inactivo'}
                      </small>
                    </div>
                  </td>
                  <td>{item.category?.name || <span className="muted">Sin categoría</span>}</td>
                  <td className="num">
                    <strong>{formatQty(item.stock)}</strong> <span className="muted">{UNITS[item.unit]}</span>
                  </td>
                  <td className="num muted">{formatQty(item.minStock)}</td>
                  <td className="num">{formatMoney(item.unitCost)}</td>
                  <td className="num">{formatMoney(item.stock * item.unitCost)}</td>
                  <td>
                    <StockBadge status={item.status} />
                  </td>
                  <td className="actions-col">
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        title="Registrar movimiento"
                        aria-label="Registrar movimiento"
                        onClick={() => setModal({ type: 'movement', item })}
                      >
                        <ArrowLeftRight size={17} />
                      </button>
                      <button
                        className="icon-btn"
                        title="Ver historial"
                        aria-label="Ver historial"
                        onClick={() => setModal({ type: 'history', item })}
                      >
                        <History size={17} />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            className="icon-btn"
                            title="Editar"
                            aria-label="Editar"
                            onClick={() => setModal({ type: 'form', item })}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            className="icon-btn danger"
                            title="Eliminar"
                            aria-label="Eliminar"
                            onClick={() => setModal({ type: 'delete', item })}
                          >
                            <Trash2 size={17} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table-footer muted small">
          Mostrando {sorted.length} insumo{sorted.length === 1 ? '' : 's'}
        </p>
      </section>

      <ItemFormModal
        open={modal?.type === 'form'}
        item={modal?.type === 'form' ? modal.item : null}
        categories={categories}
        onClose={closeModal}
        onSaved={handleSaved}
      />
      <MovementModal
        open={modal?.type === 'movement'}
        item={modal?.type === 'movement' ? modal.item : null}
        onClose={closeModal}
        onSaved={handleSaved}
      />
      <HistoryModal
        open={modal?.type === 'history'}
        item={modal?.type === 'history' ? modal.item : null}
        onClose={closeModal}
      />
      <ConfirmDialog
        open={modal?.type === 'delete'}
        title="Eliminar insumo"
        message={
          modal?.type === 'delete'
            ? `¿Seguro que deseas eliminar "${modal.item.name}"? También se eliminará su historial de movimientos. Si solo quieres dejar de usarlo, puedes marcarlo como inactivo.`
            : ''
        }
        onConfirm={handleDelete}
        onClose={closeModal}
      />
    </>
  );
}
