import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

// ── Badge de estado ───────────────────────────────────────────────
const ESTADO_STYLE = {
  pendiente:   'bg-yellow-100 text-yellow-800',
  aceptada:    'bg-success/10 text-success',
  rechazada:   'bg-danger/10 text-danger',
  reagendada:  'bg-primary/10 text-primary',
  completada:  'bg-gray-100 text-gray-600',
  cancelada:   'bg-gray-100 text-gray-500',
};

function BadgeEstado({ estado }) {
  const style = ESTADO_STYLE[estado] ?? 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${style}`}>
      {estado}
    </span>
  );
}

// ── Tarjeta de solicitud ──────────────────────────────────────────
function TarjetaSolicitud({ solicitud }) {
  const otro = solicitud.proveedor ?? solicitud.cliente;
  const fecha = new Date(solicitud.fechaPropuesta).toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">
          {solicitud.anuncio?.titulo ?? solicitud.descripcion}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {otro?.nombre ?? '—'} · {fecha}
        </p>
        {solicitud.motivoRechazo && (
          <p className="text-xs text-danger mt-1 line-clamp-1">
            Motivo: {solicitud.motivoRechazo}
          </p>
        )}
      </div>
      <BadgeEstado estado={solicitud.estado} />
    </div>
  );
}

// ── Sección con título y lista ────────────────────────────────────
function Seccion({ titulo, solicitudes, loading, vacio }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white/90 mb-3">{titulo}</h2>
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-white/10 rounded-xl px-5 py-6 text-center">
          <p className="text-sm text-white/60">{vacio}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudes.map((s) => (
            <TarjetaSolicitud key={s._id} solicitud={s} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Navbar del dashboard ──────────────────────────────────────────
function DashboardNav({ usuario, onLogout }) {
  return (
    <nav className="bg-primary border-b border-primary-dark h-16 flex items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white tracking-tight">
          ServiLink
        </Link>

        <div className="flex items-center gap-4">
          {/* Avatar + nombre */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">
              {usuario.nombre?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm text-white/90 hidden sm:block font-medium">
              {usuario.nombre}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="text-xs font-semibold text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function DashboardPage() {
  const { usuario, logout } = useAuth();

  const esProveedor = usuario?.roles?.includes('proveedor');
  const esCliente   = usuario?.roles?.includes('cliente');

  const [enviadas, setEnviadas]       = useState([]);
  const [loadEnviadas, setLoadEnviadas] = useState(true);

  // Solicitudes enviadas (siempre se cargan — todo usuario puede enviar)
  useEffect(() => {
    api.get('/api/service-requests/sent')
      .then(({ data }) => setEnviadas(data.data))
      .catch(() => setEnviadas([]))
      .finally(() => setLoadEnviadas(false));
  }, []);

  return (
    <div className="min-h-screen bg-primary">
      <DashboardNav usuario={usuario} onLogout={logout} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera de bienvenida */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hola, {usuario?.nombre?.split(' ')[0]} 👋
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {usuario?.roles?.map((rol) => (
              <span key={rol} className="text-xs font-semibold bg-white/15 text-white px-2.5 py-1 rounded-full capitalize">
                {rol}
              </span>
            ))}
          </div>
        </div>

        {/* Sección cliente: solicitudes enviadas */}
        {esCliente && (
          <Seccion
            titulo="Mis solicitudes enviadas"
            solicitudes={enviadas}
            loading={loadEnviadas}
            vacio="No tienes solicitudes enviadas aún."
          />
        )}

        {/* Secciones exclusivas de proveedor */}
        {esProveedor && (
          <>
            <SeccionRecibidas />
            <SeccionAnuncios />
          </>
        )}

        {/* Accesos rápidos */}
        <section>
          <h2 className="text-base font-semibold text-white/90 mb-3">Accesos rápidos</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="text-sm font-medium bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Explorar servicios
            </Link>
            {esCliente && !esProveedor && (
              <Link
                to="/registro-proveedor"
                className="text-sm font-medium bg-white text-primary hover:bg-white/90 px-4 py-2 rounded-lg transition-colors"
              >
                Convertirme en proveedor
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Secciones de proveedor (con su propio fetch) ──────────────────
function SeccionRecibidas() {
  const [recibidas, setRecibidas]     = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    api.get('/api/service-requests/received')
      .then(({ data }) => setRecibidas(data.data))
      .catch(() => setRecibidas([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Seccion
      titulo="Solicitudes recibidas"
      solicitudes={recibidas}
      loading={loading}
      vacio="No has recibido solicitudes aún."
    />
  );
}

function SeccionAnuncios() {
  return (
    <section>
      <h2 className="text-base font-semibold text-white/90 mb-3">Mis anuncios</h2>
      <div className="bg-white/10 rounded-xl px-5 py-6 text-center">
        <p className="text-sm text-white/60 mb-3">Gestiona tus anuncios de servicios.</p>
        <Link
          to="/"
          className="text-xs font-semibold text-white border border-white/40 hover:border-white px-4 py-2 rounded-lg transition-colors"
        >
          Ver en galería
        </Link>
      </div>
    </section>
  );
}
