import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModalPerfil from './ModalPerfil';
import { imgUrl } from '../lib/imageUrl';

// Logo SVG Cúpulas Catedral Nueva
function LogoCatedral() {
  return (
    <svg className="w-5 h-5 inline-block" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="7" r="4" fill="currentColor" opacity="0.9" />
      <circle cx="14" cy="7" r="4" fill="currentColor" opacity="0.9" />
      <circle cx="10" cy="4" r="5" fill="currentColor" />
    </svg>
  );
}

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const [abierto, setAbierto]       = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [abierto]);

  return (
    <>
    {modalPerfil && <ModalPerfil onCerrar={() => setModalPerfil(false)} />}
    <nav className="fixed top-0 inset-x-0 z-50 bg-surface border-b border-border h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo con cúpulas de la Catedral */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary tracking-tight hover:text-primary-dark transition-colors">
          <LogoCatedral />
          ServiLink
        </Link>

        {/* Links centro */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-text-muted hover:text-text transition-colors">
            Explorar
          </Link>
          <Link to="/como-funciona" className="text-sm text-text-muted hover:text-text transition-colors">
            ¿Cómo funciona?
          </Link>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {usuario ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAbierto((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-background transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                  {usuario.fotoPerfil
                    ? <img src={imgUrl(usuario.fotoPerfil)} alt={usuario.nombre} className="w-full h-full rounded-full object-cover" />
                    : usuario.nombre?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-text max-w-30 truncate">
                  {usuario.nombre}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-text-muted transition-transform ${abierto ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>

              {abierto && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg py-1 text-sm">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="font-semibold text-text truncate">{usuario.nombre}</p>
                    <p className="text-xs text-text-muted truncate">{usuario.email}</p>
                  </div>
                  <button
                    onClick={() => { setModalPerfil(true); setAbierto(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-text hover:bg-background transition-colors"
                  >
                    <svg className="w-4 h-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
                    </svg>
                    Mi perfil
                  </button>
                  <Link
                    to="/dashboard"
                    onClick={() => setAbierto(false)}
                    className="flex items-center gap-2 px-4 py-2 text-text hover:bg-background transition-colors"
                  >
                    <svg className="w-4 h-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7Z" />
                    </svg>
                    Mi dashboard
                  </Link>
                  <button
                    onClick={() => { logout(); setAbierto(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-danger hover:bg-danger/5 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.08a.75.75 0 1 0-1.004-1.11l-2.5 2.562a.75.75 0 0 0 0 1.076l2.5 2.563a.75.75 0 1 0 1.004-1.11l-1.048-1.08h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Ingresar
              </Link>
              <Link
                to="/registro"
                className="text-sm font-medium bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
              >
                Registro
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}
