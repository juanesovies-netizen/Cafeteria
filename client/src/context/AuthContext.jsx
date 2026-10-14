import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [checking, setChecking] = useState(!!localStorage.getItem('token'));

  const saveSession = ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Valida el token guardado al iniciar la app
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api('/auth/me')
      .then((u) => {
        localStorage.setItem('user', JSON.stringify(u));
        setUser(u);
      })
      .catch(logout)
      .finally(() => setChecking(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const login = async (email, password) =>
    saveSession(await api('/auth/login', { method: 'POST', body: { email, password } }));

  const register = async (data) => saveSession(await api('/auth/register', { method: 'POST', body: data }));

  return (
    <AuthContext.Provider value={{ user, checking, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Ruta inicial según el rol del usuario. */
export const homeFor = (role) => (role === 'CLIENT' ? '/menu' : '/dashboard');
