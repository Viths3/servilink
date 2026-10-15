import Imagen from './Imagen';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModalPerfil from './ModalPerfil';
import api from '../lib/axios';
import { imgUrl } from '../lib/imageUrl';
import { IconoSol, IconoLuna, IconoCampana } from './Iconos';

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

function IconoChat() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 2c-4.42 0-8 2.91-8 6.5 0 1.99 1.13 3.76 2.9 4.94-.1.83-.35 1.65-.68 2.34a.5.5 0 0 0 .58.68 6.9 6.9 0 0 0 2.87-1.47c.72.14 1.48.21 2.33.21 4.42 0 8-2.91 8-6.5S14.42 2 10 2Z" clipRule="evenodd" />
    </svg>
  );
}


// Alternador de modo claro/oscuro — persiste la preferencia del usuario.
export function BotonTema() {
  const [oscuro, setOscuro] = useState(() => document.documentElement.classList.contains('dark'));

  const alternar = () => {
    const nuevo = !oscuro;
    document.documentElement.classList.toggle('dark', nuevo);
    localStorage.setItem('servilink_tema', nuevo ? 'oscuro' : 'claro');
    setOscuro(nuevo);
  };

  return (
    <button
      onClick={alternar}
      title={oscuro ? 'Modo claro' : 'Modo oscuro'}
      className="p-2 rounded-full text-text-muted hover:text-text hover:bg-background transition-colors"
    >
      {oscuro ? <IconoSol className="w-5 h-5" /> : <IconoLuna className="w-5 h-5" />}
    </button>
  );
}

// Ícono de mensajes con contador de no leídos — visible en toda la app
// para usuarios autenticados (patrón del inbox de Airbnb).
export function BotonMensajes({ claro = false }) {
  const { usuario } = useAuth();
  const [noLeidos, setNoLeidos] = useState(0);

  useEffect(() => {
    if (!usuario) return;
    let cancelled = false;

    const cargar = () => {
      api.get('/api/messages/conversations')
        .then(({ data }) => {
          if (cancelled) return;
          const total = data.data.reduce((sum, c) => sum + (c.noLeidos ?? 0), 0);
          setNoLeidos(total);
        })
        .catch(() => {});
    };

    cargar();
    const intervalo = setInterval(cargar, 30000);
    return () => { cancelled = true; clearInterval(intervalo); };
  }, [usuario]);

  if (!usuario) return null;

  return (
    <Link
      to="/mensajes"
      title="Mensajes"
      className={`relative p-2 rounded-full transition-colors ${
        claro ? 'text-white/90 hover:bg-white/15' : 'text-text-muted hover:text-text hover:bg-background'
      }`}
    >
      <IconoChat />
      {noLeidos > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {noLeidos > 9 ? '9+' : noLeidos}
        </span>
      )}
    </Link>
  );
}

const tiempoRelativo = (fecha) => {
  const segundos = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
  if (segundos < 60) return 'ahora';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
};

// Centro de notificaciones: campana con contador + panel desplegable de
// eventos recientes (solicitud aceptada, pago liberado, reseña recibida, etc.).
export function BotonNotificaciones({ claro = false }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!usuario) return;
    let cancelled = false;
    const cargarConteo = () => {
      api.get('/api/notifications/unread-count')
        .then(({ data }) => { if (!cancelled) setNoLeidas(data.noLeidas); })
        .catch(() => {});
    };
    cargarConteo();
    const intervalo = setInterval(cargarConteo, 30000);
    return () => { cancelled = true; clearInterval(intervalo); };
  }, [usuario]);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [abierto]);

  const abrir = () => {
    setAbierto((v) => !v);
    if (!abierto) {
      setCargando(true);
      api.get('/api/notifications')
        .then(({ data }) => { setNotificaciones(data.data); setNoLeidas(data.noLeidas); })
        .catch(() => {})
        .finally(() => setCargando(false));
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch { /* silencioso */ }
  };

  const clicNotificacion = async (n) => {
    setAbierto(false);
    if (!n.leida) {
      setNoLeidas((v) => Math.max(0, v - 1));
      api.patch(`/api/notifications/${n._id}/read`).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  if (!usuario) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={abrir}
        title="Notificaciones"
        className={`relative p-2 rounded-full transition-colors ${
          claro ? 'text-white/90 hover:bg-white/15' : 'text-text-muted hover:text-text hover:bg-background'
        }`}
      >
        <IconoCampana className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-surface border border-border rounded-2xl shadow-xl overflow-hidden text-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-semibold text-text">Notificaciones</p>
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} className="text-xs font-medium text-primary hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {cargando ? (
              <p className="px-4 py-6 text-center text-text-muted text-xs">Cargando…</p>
            ) : notificaciones.length === 0 ? (
              <p className="px-4 py-6 text-center text-text-muted text-xs">No tienes notificaciones aún.</p>
            ) : (
              notificaciones.map((n) => (
                <button
                  key={n._id}
                  onClick={() => clicNotificacion(n)}
                  className={`w-full text-left flex items-start gap-2.5 px-4 py-3 border-b border-border last:border-0 hover:bg-background transition-colors ${
                    !n.leida ? 'bg-primary/5' : ''
                  }`}
                >
                  {!n.leida && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  <div className={n.leida ? 'pl-4.5' : ''}>
                    <p className="text-text leading-snug">{n.mensaje}</p>
                    <p className="text-xs text-text-muted mt-0.5">{tiempoRelativo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const [abierto, setAbierto]         = useState(false);
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
    <nav className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo con cúpulas de la Catedral */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary tracking-tight hover:text-primary-dark transition-colors">
          <LogoCatedral />
          ServiLink
        </Link>

        {/* Links centro */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className="text-sm font-medium text-text px-4 py-2 rounded-full hover:bg-background transition-colors">
            Explorar
          </Link>
          <Link to="/como-funciona" className="text-sm font-medium text-text-muted px-4 py-2 rounded-full hover:bg-background hover:text-text transition-colors">
            ¿Cómo funciona?
          </Link>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1.5">
          <BotonTema />
          <BotonNotificaciones />
          <BotonMensajes />
          {usuario ? (
            <div className="relative" ref={dropdownRef}>
              {/* Píldora avatar estilo Airbnb */}
              <button
                onClick={() => setAbierto((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border pl-3 pr-1.5 py-1.5 hover:shadow-md transition-shadow bg-surface"
              >
                <svg className="w-4 h-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                </svg>
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                  {usuario.fotoPerfil && usuario.fotoPerfil !== 'REMOVED_BY_MODERATOR'
                    ? <Imagen tipo="avatar" src={imgUrl(usuario.fotoPerfil)} alt={usuario.nombre} className="w-full h-full object-cover" />
                    : usuario.nombre?.[0]?.toUpperCase() ?? '?'}
                </div>
              </button>

              {abierto && (
                <div className="absolute right-0 mt-2 w-52 bg-surface border border-border rounded-2xl shadow-xl py-1.5 text-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="font-semibold text-text truncate">{usuario.nombre}</p>
                    <p className="text-xs text-text-muted truncate">{usuario.email}</p>
                  </div>
                  <button
                    onClick={() => { setModalPerfil(true); setAbierto(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-text hover:bg-background transition-colors"
                  >
                    <svg className="w-4 h-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
                    </svg>
                    Mi perfil
                  </button>
                  <Link
                    to="/mensajes"
                    onClick={() => setAbierto(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-text hover:bg-background transition-colors"
                  >
                    <span className="text-text-muted"><IconoChat /></span>
                    Mensajes
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setAbierto(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-text hover:bg-background transition-colors"
                  >
                    <svg className="w-4 h-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7Z" />
                    </svg>
                    Mi dashboard
                  </Link>
                  <button
                    onClick={() => { logout(); setAbierto(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-danger hover:bg-danger/5 transition-colors border-t border-border"
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
                className="text-sm font-medium text-text px-4 py-2 rounded-full hover:bg-background transition-colors"
              >
                Ingresar
              </Link>
              <Link
                to="/registro"
                className="text-sm font-semibold bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full transition-colors"
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
