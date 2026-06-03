import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-text-muted text-sm">Cargando...</span>
      </div>
    );
  }

  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}
