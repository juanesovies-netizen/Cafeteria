const BASE_URL = '/api';

/**
 * Cliente HTTP mínimo sobre fetch.
 * - Agrega el token JWT automáticamente.
 * - Lanza un Error con `status` y `details` (errores por campo) si la respuesta falla.
 */
export async function api(path, { method = 'GET', body, params } = {}) {
  const token = localStorage.getItem('token');

  let url = BASE_URL + path;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    ).toString();
    if (qs) url += `?${qs}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    const error = new Error(data?.message || `Error ${res.status}`);
    error.status = res.status;
    error.details = data?.details || {};
    throw error;
  }
  return data;
}

export const UNITS = {
  UNIDAD: 'und',
  KG: 'kg',
  G: 'g',
  L: 'L',
  ML: 'ml',
  PAQUETE: 'paq',
};

export const UNIT_LABELS = {
  UNIDAD: 'Unidad',
  KG: 'Kilogramo',
  G: 'Gramo',
  L: 'Litro',
  ML: 'Mililitro',
  PAQUETE: 'Paquete',
};

export const ROLE_LABELS = { ADMIN: 'Administrador', CASHIER: 'Cajero', CLIENT: 'Cliente' };

export const formatMoney = (n) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', maximumFractionDigits: 3 }).format(n || 0);

export const formatQty = (n) => new Intl.NumberFormat('es', { maximumFractionDigits: 3 }).format(n || 0);

export const formatDate = (d) =>
  new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
