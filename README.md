# ☕ CafeteriApp

Una plataforma web para gestionar pequeñas cafeterías. Tiene tres roles: **administrador**, **cajero** y **cliente**.

| Sprint | Alcance | Estado |
|---|---|---|
| **1** | Autenticación con roles + **CRUD e interfaz de inventario** | ✅ Terminado |
| 2 | Menú de productos y recetas (los insumos que consume cada producto) | Pendiente |
| 3 | Pedidos en tiempo real + descuento automático de stock | Pendiente |
| 4 | Chatbot basado en reglas para guiar al cliente y recomendar productos | Pendiente |

## Stack

- **Frontend:** React 18 + Vite + React Router + lucide-react (CSS propio, sin frameworks)
- **Backend:** Node.js + Express 5 + Zod (validaciones) + JWT + bcrypt
- **Base de datos:** SQLite con Prisma ORM. Se puede migrar a PostgreSQL cambiando solo el `provider`.

## Instalación y ejecución

Requisito: Node.js 18 o superior.

```bash
npm run setup     # instala dependencias, crea la BD, aplica migraciones y carga los datos de ejemplo
npm run dev       # levanta la API (http://localhost:4000) y la web (http://localhost:5173)
```

Otros comandos: `npm run seed` reinicia los datos de ejemplo. `npm --prefix server run db:studio` abre Prisma Studio.

### Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@cafeteria.com | admin123 |
| Cajero | cajero@cafeteria.com | cajero123 |
| Cliente | cliente@cafeteria.com | cliente123 |

## Funcionalidades del Sprint 1

**Inventario (insumos)**
- Crear, ver, editar y eliminar insumos. Cada insumo tiene código SKU, nombre, categoría, unidad, stock, stock mínimo, costo unitario, proveedor y estado activo/inactivo.
- Buscador con debounce (por nombre, SKU o proveedor). Filtros por categoría, estado de stock (disponible, bajo, agotado) y actividad. Ordenamiento por columnas.
- Indicadores: insumos activos, stock bajo, agotados y valor total del inventario.
- **Movimientos de stock:** entrada, salida o ajuste por conteo físico. Muestran el stock resultante antes de confirmar, no dejan que el stock quede negativo y guardan quién hizo cada movimiento.
- Historial de movimientos de cada insumo.
- El stock **no se edita directamente**: solo cambia mediante movimientos, para que quede trazabilidad. El stock inicial también se registra como una entrada.

**Categorías:** CRUD completo. Si borras una categoría, sus insumos pasan a "Sin categoría".

**Usuarios y roles:** registro público solo para clientes. El administrador crea usuarios, cambia roles y activa o desactiva cuentas.

### Permisos

| Acción | Admin | Cajero | Cliente |
|---|:-:|:-:|:-:|
| Ver inventario y panel | ✅ | ✅ | ❌ |
| Registrar movimientos de stock | ✅ | ✅ | ❌ |
| Crear, editar o eliminar insumos y categorías | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

## API REST

Todas las rutas (salvo las de auth) requieren el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | Público |
| GET | `/api/auth/me` | Cualquiera autenticado |
| GET | `/api/inventory?search=&categoryId=&status=ok\|low\|out&active=` | Admin, Cajero |
| GET | `/api/inventory/stats` · `/api/inventory/movements?limit=` | Admin, Cajero |
| GET | `/api/inventory/:id` · `/api/inventory/:id/movements` | Admin, Cajero |
| POST | `/api/inventory/:id/movements` `{type, quantity, reason}` | Admin, Cajero |
| POST · PUT · DELETE | `/api/inventory[/:id]` | Admin |
| GET | `/api/categories` | Admin, Cajero |
| POST · PUT · DELETE | `/api/categories[/:id]` | Admin |
| GET · POST · PATCH | `/api/users[/:id]` | Admin |

## Estructura

```
server/
  prisma/schema.prisma        Modelo de datos (User, Category, InventoryItem, StockMovement)
  prisma/seed.js              Datos de ejemplo
  src/routes/                 auth, users, categories, inventory
  src/services/stock.service.js   Lógica de movimientos de stock (se reutilizará en los pedidos)
  src/validators/schemas.js   Validaciones Zod
  src/middleware/             Autenticación JWT, autorización por rol, manejo de errores
client/
  src/pages/inventory/        Inventario, formulario, movimientos, historial
  src/pages/                  Login, Registro, Panel, Categorías, Usuarios, Menú (cliente)
  src/components/             Layout, Modal, ConfirmDialog, StockBadge, ProtectedRoute
  src/context/                AuthContext, ToastContext
```

> **Preparado para el Sprint 3:** cuando se confirme un pedido, `applyStockMovement()` registrará una `SALIDA` por cada insumo de la receta, dentro de la misma transacción.
