import { Navigate, Route, Routes } from 'react-router-dom';
import { homeFor, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/inventory/Inventory';
import Categories from './pages/Categories';
import Users from './pages/Users';
import ClientMenu from './pages/ClientMenu';

function HomeRedirect() {
  const { user, checking } = useAuth();
  if (checking) return <div className="page-loader">Cargando…</div>;
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route element={<ProtectedRoute roles={['ADMIN', 'CASHIER']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventario" element={<Inventory />} />
          </Route>
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/categorias" element={<Categories />} />
            <Route path="/usuarios" element={<Users />} />
          </Route>
          <Route element={<ProtectedRoute roles={['CLIENT']} />}>
            <Route path="/menu" element={<ClientMenu />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
