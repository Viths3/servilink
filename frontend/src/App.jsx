import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import GaleriaPage from './pages/GaleriaPage';
import LoginPage from './pages/LoginPage';
import RegistroClientePage from './pages/RegistroClientePage';
import RegistroProveedorPage from './pages/RegistroProveedorPage';
import DetalleAnuncioPage from './pages/DetalleAnuncioPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/"                    element={<GaleriaPage />} />
          <Route path="/login"               element={<LoginPage />} />
          <Route path="/registro"            element={<RegistroClientePage />} />
          <Route path="/registro-proveedor"  element={<RegistroProveedorPage />} />
          <Route path="/anuncios/:id"        element={<DetalleAnuncioPage />} />

          {/* Rutas privadas — requieren sesión activa */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
