import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import POS from '../pages/POS';
import Purchases from '../pages/Purchases';
import PurchaseHistory from '../pages/PurchaseHistory';
import Sales from '../pages/Sales';
import Treasury from '../pages/Treasury';
import Clients from '../pages/Clients';
import CashHistory from '../pages/CashHistory';
import Users from '../pages/Users';
import Profile from '../pages/Profile';
import Inventory from '../pages/Inventory';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import DataCenter from '../pages/DataCenter';
import Settings from '../pages/Settings';

// Componente para validar roles
const RoleRoute = ({ children, roles }: { children: React.ReactNode; roles: string[] }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;

  const user = JSON.parse(userStr);
  if (!roles.includes(user.role)) {
    // Si no tiene permiso, lo mandamos al dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rutas accesibles para todos los logueados */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <Layout>
                <POS />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Layout>
                <Sales />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Rutas SOLO para Admin y Manager */}
        <Route
          path="/purchases"
          element={
            <ProtectedRoute>
              <Layout>
                <RoleRoute roles={['ADMIN', 'MANAGER']}>
                  <Purchases />
                </RoleRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases/history"
          element={
            <ProtectedRoute>
              <Layout>
                <RoleRoute roles={['ADMIN', 'MANAGER']}>
                  <PurchaseHistory />
                </RoleRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/treasury"
          element={
            <ProtectedRoute>
              <Layout>
                <RoleRoute roles={['ADMIN', 'MANAGER']}>
                  <Treasury />
                </RoleRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cash-history"
          element={
            <ProtectedRoute>
              <Layout>
                <RoleRoute roles={['ADMIN', 'MANAGER']}>
                  <CashHistory />
                </RoleRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Layout>
                <RoleRoute roles={['ADMIN', 'MANAGER']}>
                  <Inventory />
                </RoleRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Layout>
                <RoleRoute roles={['ADMIN', 'MANAGER', 'USER']}>
                  <Clients />
                </RoleRoute>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Rutas SOLO para Admin */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <RoleRoute roles={['ADMIN']}>
                  <Users />
                </RoleRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-center"
          element={
            <ProtectedRoute>
              <Layout>
                <RoleRoute roles={['ADMIN', 'MANAGER']}>
                  <DataCenter />
                </RoleRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <RoleRoute roles={['ADMIN', 'MANAGER']}>
                  <Settings />
                </RoleRoute>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
