/** Error HTTP con código de estado, usado en controladores y servicios. */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const ROLES = ['ADMIN', 'CASHIER', 'CLIENT'];
export const UNITS = ['UNIDAD', 'KG', 'G', 'L', 'ML', 'PAQUETE'];
export const MOVEMENT_TYPES = ['ENTRADA', 'SALIDA', 'AJUSTE'];

/** Redondea a 3 decimales para evitar errores de coma flotante en el stock. */
export const round3 = (n) => Math.round(n * 1000) / 1000;
