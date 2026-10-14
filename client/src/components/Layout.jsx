import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Coffee, LayoutDashboard, Package, Tags, Users, LogOut, Menu as MenuIcon, UtensilsCrossed, ClipboardList, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../api/client';

const NAV = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard, roles: ['ADMIN', 'CASHIER'] },
  { to: '/inventario', label: 'Inventario', icon: Package, roles: ['ADMIN', 'CASHIER'] },
  { to: '/categorias', label: 'Categorías', icon: Tags, roles: ['ADMIN'] },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
  { to: '/menu', label: 'Menú', icon: UtensilsCrossed, roles: ['CLIENT'] },
];

// Módulos planificados para próximos sprints (se muestran deshabilitados)
const UPCOMING = [
  { label: 'Pedidos en tiempo real', icon: ClipboardList, roles: ['ADMIN', 'CASHIER'] },
  { label: 'Asistente virtual', icon: Bot, roles: ['CLIENT'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Coffee size={22} />
          </div>
          <div>
            <strong>CafeteriApp</strong>
            <small>Gestión de cafetería</small>
          </div>
        </div>

        <nav className="nav">
          {NAV.filter((n) => n.roles.includes(user.role)).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="nav-link" onClick={() => setOpen(false)}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {UPCOMING.some((n) => n.roles.includes(user.role)) && <p className="nav-section">Próximamente</p>}
          {UPCOMING.filter((n) => n.roles.includes(user.role)).map(({ label, icon: Icon }) => (
            <span key={label} className="nav-link disabled" title="Disponible en un próximo sprint">
              <Icon size={18} />
              {label}
            </span>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <strong>{user.name}</strong>
            <small>{ROLE_LABELS[user.role]}</small>
          </div>
          <button className="icon-btn light" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <MenuIcon size={22} />
          </button>
          <span className="topbar-date">
            {new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </span>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
