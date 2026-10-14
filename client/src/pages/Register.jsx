import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Coffee, UserPlus } from 'lucide-react';
import { homeFor, useAuth } from '../context/AuthContext';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setErrors({ confirm: ['Las contraseñas no coinciden'] });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { confirm, ...data } = form;
      const u = await register(data);
      navigate(homeFor(u.role), { replace: true });
    } catch (err) {
      setError(err.message);
      setErrors(err.details || {});
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (k) => errors[k]?.[0] && <small className="field-error">{errors[k][0]}</small>;

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="brand-icon lg">
            <Coffee size={32} />
          </div>
          <h1>Bienvenido</h1>
          <p>Crea tu cuenta de cliente para explorar el menú, recibir recomendaciones y hacer tus pedidos.</p>
        </div>
      </div>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={submit} noValidate>
          <h2>Crear cuenta</h2>
          <p className="muted">Registro para clientes</p>

          {error && <div className="alert alert-error">{error}</div>}

          <label className="field">
            <span>Nombre completo</span>
            <input value={form.name} onChange={set('name')} placeholder="Tu nombre" />
            {fieldError('name')}
          </label>
          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" value={form.email} onChange={set('email')} placeholder="tu@correo.com" />
            {fieldError('email')}
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Contraseña</span>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Mín. 6 caracteres" />
              {fieldError('password')}
            </label>
            <label className="field">
              <span>Confirmar</span>
              <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repite la contraseña" />
              {fieldError('confirm')}
            </label>
          </div>

          <button className="btn btn-primary btn-block" disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Creando cuenta…' : 'Registrarme'}
          </button>

          <p className="auth-switch">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
