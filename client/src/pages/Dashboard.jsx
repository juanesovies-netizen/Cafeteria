import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, XCircle, DollarSign, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { api, formatDate, formatMoney, formatQty, UNITS } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StockBadge from '../components/StockBadge';

export const MOVEMENT_META = {
  ENTRADA: { label: 'Entrada', icon: ArrowDownCircle, cls: 'mv-in' },
  SALIDA: { label: 'Salida', icon: ArrowUpCircle, cls: 'mv-out' },
  AJUSTE: { label: 'Ajuste', icon: SlidersHorizontal, cls: 'mv-adj' },
};

export function StatCards({ stats }) {
  const cards = [
    { label: 'Insumos activos', value: stats?.totalItems ?? '—', icon: Package, tone: 'brown' },
    { label: 'Stock bajo', value: stats?.lowStock ?? '—', icon: AlertTriangle, tone: 'amber' },
    { label: 'Agotados', value: stats?.outOfStock ?? '—', icon: XCircle, tone: 'red' },
    { label: 'Valor del inventario', value: stats ? formatMoney(stats.totalValue) : '—', icon: DollarSign, tone: 'green' },
  ];
  return (
    <div className="stats-grid">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="stat-card">
          <div className={`stat-icon tone-${tone}`}>
            <Icon size={22} />
          </div>
          <div>
            <p className="stat-label">{label}</p>
            <p className="stat-value">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [movements, setMovements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/inventory/stats'), api('/inventory/movements', { params: { limit: 8 } })])
      .then(([s, m]) => {
        setStats(s);
        setMovements(m);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>¡Hola, {user.name.split(' ')[0]}! ☕</h1>
          <p className="muted">Resumen del estado de tu cafetería</p>
        </div>
        <Link to="/inventario" className="btn btn-primary">
          Ir al inventario <ArrowRight size={16} />
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <StatCards stats={stats} />

      <div className="dashboard-grid">
        <section className="card">
          <header className="card-header">
            <h3>Alertas de stock</h3>
            <span className="muted small">{stats?.alerts.length ?? 0} insumos</span>
          </header>
          {stats && stats.alerts.length === 0 && <p className="empty">Todo el inventario está en niveles óptimos 🎉</p>}
          <ul className="list">
            {stats?.alerts.map((a) => (
              <li key={a.id} className="list-row">
                <div>
                  <strong>{a.name}</strong>
                  <small className="muted">
                    {a.sku} · mínimo {formatQty(a.minStock)} {UNITS[a.unit]}
                  </small>
                </div>
                <div className="list-row-end">
                  <span className="qty">
                    {formatQty(a.stock)} {UNITS[a.unit]}
                  </span>
                  <StockBadge status={a.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <header className="card-header">
            <h3>Últimos movimientos</h3>
          </header>
          {movements.length === 0 && <p className="empty">Aún no hay movimientos registrados</p>}
          <ul className="list">
            {movements.map((m) => {
              const meta = MOVEMENT_META[m.type];
              const Icon = meta.icon;
              return (
                <li key={m.id} className="list-row">
                  <div className="mv-row">
                    <span className={`mv-icon ${meta.cls}`}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <strong>{m.item.name}</strong>
                      <small className="muted">
                        {meta.label} · {m.reason || 'Sin motivo'} · {m.user?.name || 'Sistema'}
                      </small>
                    </div>
                  </div>
                  <div className="list-row-end column">
                    <span className={`qty ${meta.cls}`}>
                      {m.type === 'SALIDA' ? '−' : m.quantity >= 0 ? '+' : '−'}
                      {formatQty(Math.abs(m.quantity))} {UNITS[m.item.unit]}
                    </span>
                    <small className="muted">{formatDate(m.createdAt)}</small>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
