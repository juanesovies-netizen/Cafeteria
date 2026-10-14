import { useCallback, useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { api, formatDate, ROLE_LABELS } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const EMPTY = { name: '', email: '', password: '', role: 'CASHIER' };

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api('/users').then(setUsers).catch((e) => toast.error(e.message));
  }, [toast]);

  useEffect(load, [load]);

  const close = useCallback(() => setOpen(false), []);

  const update = async (u, data) => {
    try {
      const updated = await api(`/users/${u.id}`, { method: 'PATCH', body: data });
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
      toast.success('Usuario actualizado');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/users', { method: 'POST', body: form });
      toast.success('Usuario creado');
      setOpen(false);
      load();
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const err = (k) => errors[k]?.[0] && <small className="field-error">{errors[k][0]}</small>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p className="muted">Administra el personal y los roles de acceso</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(EMPTY);
            setErrors({});
            setOpen(true);
          }}
        >
          <UserPlus size={18} /> Nuevo usuario
        </button>
      </div>

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registrado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u.id === me.id;
                return (
                  <tr key={u.id} className={u.active ? '' : 'inactive'}>
                    <td>
                      <strong>{u.name}</strong> {isMe && <span className="tag">Tú</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="select-sm"
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => update(u, { role: e.target.value })}
                        aria-label={`Rol de ${u.name}`}
                      >
                        {Object.entries(ROLE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={u.active}
                          disabled={isMe}
                          onChange={(e) => update(u, { active: e.target.checked })}
                        />
                        <span className="switch-track" />
                        <span className="small">{u.active ? 'Activo' : 'Inactivo'}</span>
                      </label>
                    </td>
                    <td className="muted nowrap">{formatDate(u.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={open}
        onClose={close}
        title="Nuevo usuario"
        footer={
          <>
            <button className="btn btn-ghost" onClick={close} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" form="user-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creando…' : 'Crear usuario'}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={create} noValidate>
          <label className="field">
            <span>Nombre *</span>
            <input autoFocus value={form.name} onChange={set('name')} />
            {err('name')}
          </label>
          <label className="field">
            <span>Correo *</span>
            <input type="email" value={form.email} onChange={set('email')} />
            {err('email')}
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Contraseña *</span>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Mín. 6 caracteres" />
              {err('password')}
            </label>
            <label className="field">
              <span>Rol *</span>
              <select value={form.role} onChange={set('role')}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              {err('role')}
            </label>
          </div>
        </form>
      </Modal>
    </>
  );
}
