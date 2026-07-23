import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import PrivateRoute from './components/PrivateRoute';
import GaleriaPage from './pages/GaleriaPage';
import LoginPage from './pages/LoginPage';
import RegistroClientePage from './pages/RegistroClientePage';
import RegistroProveedorPage from './pages/RegistroProveedorPage';
import DetalleAnuncioPage from './pages/DetalleAnuncioPage';
import DashboardPage from './pages/DashboardPage';
import MensajesPage from './pages/MensajesPage';
import PagoConfirmacionPage from './pages/PagoConfirmacionPage';
import AdminPage from './pages/AdminPage';
import ComoFuncionaPage from './pages/ComoFuncionaPage';
import PerfilPublicoPage from './pages/PerfilPublicoPage';

export default function App() {
  return (
    <AuthProvider>
    <ToastProvider>
    <ConfirmProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/"                    element={<GaleriaPage />} />
          <Route path="/login"               element={<LoginPage />} />
          <Route path="/registro"            element={<RegistroClientePage />} />
          <Route path="/registro-proveedor"  element={<RegistroProveedorPage />} />
          <Route path="/anuncios/:id"        element={<DetalleAnuncioPage />} />
          <Route path="/como-funciona"       element={<ComoFuncionaPage />} />
          <Route path="/usuarios/:id/public" element={<PerfilPublicoPage />} />

          {/* Rutas privadas — requieren sesión activa */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/mensajes"  element={<MensajesPage />} />
            <Route path="/pagos/confirmacion/:pagoId" element={<PagoConfirmacionPage />} />
            <Route path="/admin"     element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
    </ToastProvider>
    </AuthProvider>
  );
}
