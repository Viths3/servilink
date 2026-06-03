import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

// ── Constantes ────────────────────────────────────────────────────
const ESTADO_STYLE = {
  pendiente:  'bg-yellow-100 text-yellow-800',
  aceptada:   'bg-success/10 text-success',
  rechazada:  'bg-danger/10 text-danger',
  reagendada: 'bg-primary/10 text-primary',
  completada: 'bg-gray-100 text-gray-600',
  cancelada:  'bg-gray-100 text-gray-500',
};

const CATEGORIAS = {
  electricidad: 'Electricidad', plomeria: 'Plomería',
  medicina: 'Medicina', carpinteria: 'Carpintería',
  asesoria: 'Asesoría', otro: 'Otro',
};

const fmt = (fecha) =>
  new Date(fecha).toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ── Piezas reutilizables ──────────────────────────────────────────
function BadgeEstado({ estado }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${ESTADO_STYLE[estado] ?? 'bg-gray-100 text-gray-500'}`}>
      {estado}
    </span>
  );
}

function Skeleton({ filas = 2 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="h-20 bg-white/10 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function Vacio({ texto }) {
  return (
    <div className="bg-white/10 rounded-xl px-5 py-8 text-center">
      <p className="text-sm text-white/60">{texto}</p>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────
function DashboardNav({ usuario, onLogout }) {
  return (
    <nav className="bg-primary border-b border-primary-dark h-16 flex items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white tracking-tight">ServiLink</Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">
              {usuario.nombre?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm text-white/90 hidden sm:block font-medium">{usuario.nombre}</span>
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

// ── Tarjeta solicitud ENVIADA (vista cliente) ─────────────────────
function TarjetaEnviada({ solicitud }) {
  const fecha = fmt(solicitud.fechaPropuesta);
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">
          {solicitud.anuncio?.titulo ?? solicitud.descripcion}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {solicitud.proveedor?.nombre ?? '—'} · {fecha}
        </p>
        {solicitud.motivoRechazo && (
          <p className="text-xs text-danger mt-1 line-clamp-1">Motivo: {solicitud.motivoRechazo}</p>
        )}
        {solicitud.fechaConfirmada && solicitud.estado === 'aceptada' && (
          <p className="text-xs text-success mt-1">Confirmada: {fmt(solicitud.fechaConfirmada)}</p>
        )}
      </div>
      <BadgeEstado estado={solicitud.estado} />
    </div>
  );
}

// ── Tarjeta solicitud RECIBIDA (vista proveedor) con acciones ─────
function TarjetaRecibida({ solicitud, onUpdate }) {
  const [modo, setModo]         = useState(null); // null | 'rechazar' | 'reagendar'
  const [valor, setValor]       = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorAcc, setErrorAcc] = useState('');

  const cancelar = () => { setModo(null); setValor(''); setErrorAcc(''); };

  const ejecutar = async () => {
    setErrorAcc('');
    if (modo === 'rechazar' && !valor.trim()) {
      setErrorAcc('El motivo es requerido.'); return;
    }
    if (modo === 'reagendar' && !valor) {
      setErrorAcc('Selecciona una nueva fecha.'); return;
    }
    setCargando(true);
    try {
      const endpoint = `/api/service-requests/${solicitud._id}/${modo}`;
      const body = modo === 'rechazar'
        ? { motivoRechazo: valor.trim() }
        : { fechaPropuesta: new Date(valor).toISOString() };
      const { data } = await api.patch(endpoint, body);
      onUpdate(solicitud._id, data.data);
      cancelar();
    } catch (err) {
      setErrorAcc(err.response?.data?.error ?? 'Error al ejecutar la acción.');
    } finally {
      setCargando(false);
    }
  };

  const aceptar = async () => {
    setCargando(true);
    setErrorAcc('');
    try {
      const { data } = await api.patch(`/api/service-requests/${solicitud._id}/accept`);
      onUpdate(solicitud._id, data.data);
    } catch (err) {
      setErrorAcc(err.response?.data?.error ?? 'Error al aceptar.');
    } finally {
      setCargando(false);
    }
  };

  const puedeAceptarRechazar = solicitud.estado === 'pendiente';
  const puedeReagendar = ['pendiente', 'aceptada'].includes(solicitud.estado);

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-3">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">
            {solicitud.cliente?.nombre ?? '—'}
          </p>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{solicitud.descripcion}</p>
          <p className="text-xs text-text-muted mt-1">
            Fecha propuesta: <span className="font-medium text-text">{fmt(solicitud.fechaPropuesta)}</span>
          </p>
          {solicitud.anuncio?.titulo && (
            <p className="text-xs text-primary mt-0.5">Anuncio: {solicitud.anuncio.titulo}</p>
          )}
        </div>
        <BadgeEstado estado={solicitud.estado} />
      </div>

      {/* Formulario inline (rechazar / reagendar) */}
      {modo === 'rechazar' && (
        <div className="space-y-2">
          <textarea
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            rows={2}
            placeholder="Motivo del rechazo…"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
          />
        </div>
      )}
      {modo === 'reagendar' && (
        <div>
          <input
            type="datetime-local"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text"
          />
        </div>
      )}

      {errorAcc && (
        <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-1.5">
          {errorAcc}
        </p>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        {modo === null ? (
          <>
            {puedeAceptarRechazar && (
              <button
                onClick={aceptar}
                disabled={cargando}
                className="text-xs font-semibold bg-success/10 hover:bg-success/20 text-success px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {cargando ? '…' : 'Aceptar'}
              </button>
            )}
            {puedeAceptarRechazar && (
              <button
                onClick={() => setModo('rechazar')}
                className="text-xs font-semibold bg-danger/10 hover:bg-danger/20 text-danger px-3 py-1.5 rounded-lg transition-colors"
              >
                Rechazar
              </button>
            )}
            {puedeReagendar && (
              <button
                onClick={() => setModo('reagendar')}
                className="text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg transition-colors"
              >
                Reagendar
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={ejecutar}
              disabled={cargando}
              className="text-xs font-semibold bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {cargando ? 'Guardando…' : 'Confirmar'}
            </button>
            <button
              onClick={cancelar}
              className="text-xs font-semibold text-text-muted hover:text-text px-3 py-1.5 rounded-lg border border-border transition-colors"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tarjeta de anuncio propio ─────────────────────────────────────
function TarjetaAnuncio({ anuncio }) {
  return (
    <Link
      to={`/anuncios/${anuncio._id}`}
      className="bg-white border border-border rounded-xl p-4 flex items-start justify-between gap-3 hover:shadow-sm transition-shadow"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate">{anuncio.titulo}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {CATEGORIAS[anuncio.categoria] ?? anuncio.categoria}
          {anuncio.precioRef != null && <> · <span className="text-primary font-medium">${anuncio.precioRef}</span></>}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{fmt(anuncio.createdAt)}</p>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
        anuncio.estado === 'activo' ? 'bg-success/10 text-success' :
        anuncio.estado === 'suspendido' ? 'bg-danger/10 text-danger' :
        'bg-gray-100 text-gray-500'
      }`}>
        {anuncio.estado}
      </span>
    </Link>
  );
}

// ── Pestaña PROVEEDOR ─────────────────────────────────────────────
function PestanaProveedor({ usuarioId }) {
  const [recibidas, setRecibidas]   = useState([]);
  const [loadRec, setLoadRec]       = useState(true);
  const [anuncios, setAnuncios]     = useState([]);
  const [loadAnu, setLoadAnu]       = useState(true);

  useEffect(() => {
    api.get('/api/service-requests/received')
      .then(({ data }) => setRecibidas(data.data))
      .catch(() => setRecibidas([]))
      .finally(() => setLoadRec(false));

    api.get('/api/announcements', { params: { limit: 100 } })
      .then(({ data }) => {
        const propios = data.data.filter(
          (a) => (a.proveedor?._id ?? a.proveedor) === usuarioId
        );
        setAnuncios(propios);
      })
      .catch(() => setAnuncios([]))
      .finally(() => setLoadAnu(false));
  }, [usuarioId]);

  const actualizarSolicitud = useCallback((id, nueva) => {
    setRecibidas((prev) => prev.map((s) => (s._id === id ? { ...s, ...nueva } : s)));
  }, []);

  return (
    <div className="space-y-8">
      {/* Solicitudes recibidas */}
      <section>
        <h2 className="text-base font-semibold text-white/90 mb-3">Solicitudes recibidas</h2>
        {loadRec ? (
          <Skeleton />
        ) : recibidas.length === 0 ? (
          <Vacio texto="No has recibido solicitudes aún." />
        ) : (
          <div className="space-y-3">
            {recibidas.map((s) => (
              <TarjetaRecibida key={s._id} solicitud={s} onUpdate={actualizarSolicitud} />
            ))}
          </div>
        )}
      </section>

      {/* Mis anuncios */}
      <section>
        <h2 className="text-base font-semibold text-white/90 mb-3">Mis anuncios</h2>
        {loadAnu ? (
          <Skeleton />
        ) : anuncios.length === 0 ? (
          <Vacio texto="No tienes anuncios publicados aún." />
        ) : (
          <div className="space-y-3">
            {anuncios.map((a) => (
              <TarjetaAnuncio key={a._id} anuncio={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Pestaña CLIENTE ───────────────────────────────────────────────
function PestanaCliente() {
  const [enviadas, setEnviadas] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/api/service-requests/sent')
      .then(({ data }) => setEnviadas(data.data))
      .catch(() => setEnviadas([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2 className="text-base font-semibold text-white/90 mb-3">Mis solicitudes enviadas</h2>
      {loading ? (
        <Skeleton />
      ) : enviadas.length === 0 ? (
        <Vacio texto="No tienes solicitudes enviadas aún." />
      ) : (
        <div className="space-y-3">
          {enviadas.map((s) => <TarjetaEnviada key={s._id} solicitud={s} />)}
        </div>
      )}
    </section>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function DashboardPage() {
  const { usuario, logout } = useAuth();

  const esProveedor = usuario?.roles?.includes('proveedor');
  const esCliente   = usuario?.roles?.includes('cliente');
  const rolDual     = esProveedor && esCliente;

  const [pestana, setPestana] = useState(esProveedor ? 'proveedor' : 'cliente');

  return (
    <div className="min-h-screen bg-primary">
      <DashboardNav usuario={usuario} onLogout={logout} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cabecera */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hola, {usuario?.nombre?.split(' ')[0]} 👋
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {usuario?.roles?.map((r) => (
              <span key={r} className="text-xs font-semibold bg-white/15 text-white px-2.5 py-1 rounded-full capitalize">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Pestañas — solo si tiene rol dual */}
        {rolDual && (
          <div className="flex gap-1 bg-white/10 p-1 rounded-xl w-fit">
            {[
              { key: 'proveedor', label: 'Como proveedor' },
              { key: 'cliente',   label: 'Como cliente' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPestana(key)}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  pestana === key
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Contenido según pestaña activa */}
        {pestana === 'proveedor' && esProveedor && (
          <PestanaProveedor usuarioId={usuario._id} />
        )}
        {(pestana === 'cliente' || !esProveedor) && esCliente && (
          <PestanaCliente />
        )}

        {/* Accesos rápidos */}
        <section className="pt-2">
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
