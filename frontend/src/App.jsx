import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowsePage from './pages/BrowsePage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrdersPage from './pages/OrdersPage';
import ComplaintsPage from './pages/ComplaintsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierProfilePage from './pages/SupplierProfilePage';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/browse" />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
    if (user.role === 'supplier') return <Navigate to="/supplier/dashboard" />;
    return <Navigate to="/browse" />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Buyer */}
      <Route path="/browse" element={<ProtectedRoute roles={['buyer', 'supplier', 'admin']}><BrowsePage /></ProtectedRoute>} />
      <Route path="/products/:id" element={<ProtectedRoute roles={['buyer', 'supplier', 'admin']}><ProductDetailPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute roles={['buyer']}><OrdersPage /></ProtectedRoute>} />
      <Route path="/complaints" element={<ProtectedRoute roles={['buyer']}><ComplaintsPage /></ProtectedRoute>} />

      {/* Supplier */}
      <Route path="/supplier/dashboard" element={<ProtectedRoute roles={['supplier']}><SupplierDashboard /></ProtectedRoute>} />
      <Route path="/supplier/products" element={<ProtectedRoute roles={['supplier']}><SupplierDashboard /></ProtectedRoute>} />
      <Route path="/supplier/orders" element={<ProtectedRoute roles={['supplier']}><OrdersPage /></ProtectedRoute>} />
      <Route path="/supplier/:id" element={<ProtectedRoute roles={['buyer', 'supplier', 'admin']}><SupplierProfilePage /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

      {/* Shared */}
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Default */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2236',
              color: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.1)',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
