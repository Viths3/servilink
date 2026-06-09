import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar: restaurar sesión desde localStorage
  useEffect(() => {
    const storedToken   = localStorage.getItem('servilink_token');
    const storedUsuario = localStorage.getItem('servilink_usuario');
    if (storedToken && storedUsuario) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUsuario));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('servilink_token',   data.token);
    localStorage.setItem('servilink_usuario', JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('servilink_token');
    localStorage.removeItem('servilink_usuario');
    setToken(null);
    setUsuario(null);
  };

  const actualizarUsuario = (datosNuevos) => {
    const actualizado = { ...usuario, ...datosNuevos };
    localStorage.setItem('servilink_usuario', JSON.stringify(actualizado));
    setUsuario(actualizado);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
