import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Coffee, LogIn } from 'lucide-react';
import { homeFor, useAuth } from '../context/AuthContext';

const DEMO = [
  { label: 'Admin', email: 'admin@cafeteria.com', password: 'admin123' },
  { label: 'Cajero', email: 'cajero@cafeteria.com', password: 'cajero123' },
  { label: 'Cliente', email: 'cliente@cafeteria.com', password: 'cliente123' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      const from = location.state?.from?.pathname;
      navigate(from && from !== '/' ? from : homeFor(u.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="brand-icon lg">
            <Coffee size={32} />
          </div>
          <h1>CafeteriApp</h1>
          <p>Gestiona tu inventario, atiende pedidos en tiempo real y guía a tus clientes desde una sola plataforma.</p>
        </div>
      </div>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={submit} noValidate>
          <h2>Iniciar sesión</h2>
          <p className="muted">Ingresa con tu cuenta para continuar</p>

          {error && <div className="alert alert-error">{error}</div>}

          <label className="field">
            <span>Correo electrónico</span>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@correo.com"
              required
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </label>

          <button className="btn btn-primary btn-block" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          <p className="auth-switch">
            ¿Eres cliente nuevo? <Link to="/register">Crea tu cuenta</Link>
          </p>

          <div className="demo-box">
            <small>Cuentas de prueba:</small>
            <div className="demo-buttons">
              {DEMO.map((d) => (
                <button
                  type="button"
                  key={d.label}
                  className="chip"
                  onClick={() => setForm({ email: d.email, password: d.password })}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
