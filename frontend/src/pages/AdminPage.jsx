import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

const TABS = ['Estadísticas', 'Verificaciones', 'Usuarios', 'Anuncios reportados'];

const CATEGORIAS = {
  electricidad: 'Electricidad', plomeria: 'Plomería',
  medicina: 'Medicina', carpinteria: 'Carpintería',
  asesoria: 'Asesoría', otro: 'Otro',
};

const fmt = (fecha) =>
  new Date(fecha).toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ── Navbar ────────────────────────────────────────────────────────
function AdminNav({ usuario, onLogout }) {
  return (
    <nav className="bg-primary border-b border-primary-dark h-16 flex items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-bold text-white tracking-tight">ServiLink</Link>
          <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
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

// ── Piezas reutilizables ──────────────────────────────────────────
function Skeleton({ filas = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function Vacio({ texto }) {
  return (
    <div className="bg-white/10 rounded-xl px-5 py-10 text-center">
      <p className="text-sm text-white/60">{texto}</p>
    </div>
  );
}

function ErrorMsg({ texto }) {
  return (
    <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-2">
      {texto}
    </p>
  );
}

// ── Tab: Estadísticas ─────────────────────────────────────────────
function TabEstadisticas() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => setError('No se pudieron cargar las estadísticas.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton filas={2} />;
  if (error)   return <ErrorMsg texto={error} />;
  if (!stats)  return null;

  const solicitudesActivas =
    (stats.solicitudes.porEstado.pendiente  ?? 0) +
    (stats.solicitudes.porEstado.aceptada   ?? 0) +
    (stats.solicitudes.porEstado.reagendada ?? 0);

  const tarjetas = [
    { label: 'Total usuarios',              valor: stats.usuarios.total,                   sub: `${stats.usuarios.activos} activos` },
    { label: 'Proveedores',                 valor: stats.usuarios.proveedores,              sub: `${stats.usuarios.clientes} clientes` },
    { label: 'Verificaciones pendientes',   valor: stats.pendientes.verificaciones,         sub: `${stats.pendientes.upgrades} upgrades` },
    { label: 'Anuncios con reportes',       valor: stats.anuncios.conReportesActivos,       sub: `${stats.anuncios.suspendidos} suspendidos` },
    { label: 'Solicitudes activas',         valor: solicitudesActivas,                      sub: `${stats.solicitudes.total} total` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {tarjetas.map(({ label, valor, sub }) => (
          <div key={label} className="bg-white rounded-xl p-5 space-y-1 shadow-sm">
            <p className="text-2xl font-bold text-primary">{valor}</p>
            <p className="text-xs font-semibold text-text">{label}</p>
            <p className="text-xs text-text-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Desglose solicitudes por estado */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-text mb-3">Solicitudes por estado</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats.solicitudes.porEstado).map(([estado, total]) => (
            <div key={estado} className="text-xs font-medium bg-background border border-border rounded-lg px-3 py-1.5">
              <span className="capitalize text-text">{estado}</span>
              <span className="ml-2 font-bold text-primary">{total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Desglose anuncios */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-text mb-3">Anuncios</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Total',      valor: stats.anuncios.total },
            { label: 'Activos',    valor: stats.anuncios.activos },
            { label: 'Suspendidos',valor: stats.anuncios.suspendidos },
          ].map(({ label, valor }) => (
            <div key={label} className="text-xs font-medium bg-background border border-border rounded-lg px-3 py-1.5">
              <span className="text-text">{label}</span>
              <span className="ml-2 font-bold text-primary">{valor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta verificación ──────────────────────────────────────────
function TarjetaVerificacion({ proveedor, onProcesado }) {
  const [modo, setModo]         = useState(null); // null | 'rechazar'
  const [comentario, setComentario] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  const ejecutar = async (accion) => {
    setError('');
    if (accion === 'rechazar' && !comentario.trim()) {
      setError('El comentario es requerido para rechazar.'); return;
    }
    setCargando(true);
    try {
      await api.patch(`/api/admin/verifications/${proveedor._id}`, {
        accion,
        ...(comentario.trim() ? { comentario: comentario.trim() } : {}),
      });
      onProcesado(proveedor._id);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al procesar la verificación.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">{proveedor.nombre}</p>
          <p className="text-xs text-text-muted">{proveedor.email} · {proveedor.telefono}</p>
          <p className="text-xs text-text-muted mt-0.5">
            Cédula: <span className="font-medium text-text">{proveedor.providerData?.cedula ?? '—'}</span>
            {' · '}Categoría: <span className="font-medium text-text">{CATEGORIAS[proveedor.providerData?.categoria] ?? '—'}</span>
          </p>
          {proveedor.providerData?.descripcion && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">{proveedor.providerData.descripcion}</p>
          )}
          <p className="text-xs text-text-muted mt-0.5">Registrado: {fmt(proveedor.createdAt)}</p>
        </div>
        <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full shrink-0">
          Pendiente
        </span>
      </div>

      {modo === 'rechazar' && (
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={2}
          placeholder="Motivo del rechazo…"
          className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
        />
      )}

      {error && <ErrorMsg texto={error} />}

      <div className="flex flex-wrap gap-2">
        {modo === null ? (
          <>
            <button
              onClick={() => ejecutar('aprobar')}
              disabled={cargando}
              className="text-xs font-semibold bg-success/10 hover:bg-success/20 text-success px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {cargando ? '…' : 'Aprobar'}
            </button>
            <button
              onClick={() => setModo('rechazar')}
              className="text-xs font-semibold bg-danger/10 hover:bg-danger/20 text-danger px-3 py-1.5 rounded-lg transition-colors"
            >
              Rechazar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => ejecutar('rechazar')}
              disabled={cargando}
              className="text-xs font-semibold bg-danger hover:bg-danger/80 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {cargando ? 'Guardando…' : 'Confirmar rechazo'}
            </button>
            <button
              onClick={() => { setModo(null); setComentario(''); setError(''); }}
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

// ── Tab: Verificaciones ───────────────────────────────────────────
function TabVerificaciones() {
  const [lista, setLista]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/api/admin/verifications')
      .then(({ data }) => setLista(data.data))
      .catch(() => setError('No se pudieron cargar las verificaciones.'))
      .finally(() => setLoading(false));
  }, []);

  const quitar = useCallback((id) => {
    setLista((prev) => prev.filter((p) => p._id !== id));
  }, []);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorMsg texto={error} />;

  return (
    <div className="space-y-3">
      {lista.length === 0
        ? <Vacio texto="No hay verificaciones pendientes." />
        : lista.map((p) => (
            <TarjetaVerificacion key={p._id} proveedor={p} onProcesado={quitar} />
          ))}
    </div>
  );
}

// ── Tab: Usuarios ─────────────────────────────────────────────────
function FilaUsuario({ usuario: u, onToggle }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  const toggle = async () => {
    setError('');
    setCargando(true);
    try {
      const { data } = await api.patch(`/api/admin/users/${u._id}`, { activo: !u.activo });
      onToggle(u._id, data.data.activo);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al actualizar.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-text">{u.nombre}</p>
          <p className="text-xs text-text-muted">{u.email}</p>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {u.roles.map((r) => (
              <span key={r} className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                {r}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-text-muted">{fmt(u.createdAt)}</td>
        <td className="px-4 py-3">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${u.activo ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
            {u.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={toggle}
            disabled={cargando}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              u.activo
                ? 'bg-danger/10 hover:bg-danger/20 text-danger'
                : 'bg-success/10 hover:bg-success/20 text-success'
            }`}
          >
            {cargando ? '…' : u.activo ? 'Desactivar' : 'Activar'}
          </button>
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={5} className="px-4 pb-2">
            <ErrorMsg texto={error} />
          </td>
        </tr>
      )}
    </>
  );
}

function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const cargar = useCallback((p) => {
    setLoading(true);
    api.get('/api/admin/users', { params: { page: p, limit: 20 } })
      .then(({ data }) => {
        setUsuarios(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError('No se pudieron cargar los usuarios.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(page); }, [page, cargar]);

  const actualizarActivo = useCallback((id, activo) => {
    setUsuarios((prev) => prev.map((u) => u._id === id ? { ...u, activo } : u));
  }, []);

  if (loading) return <Skeleton filas={5} />;
  if (error)   return <ErrorMsg texto={error} />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/60">{total} usuarios registrados</p>

      <div className="bg-white rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Usuario</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Roles</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Registro</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <FilaUsuario key={u._id} usuario={u} onToggle={actualizarActivo} />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/20 text-white/70 hover:text-white disabled:opacity-40 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-xs text-white/60">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/20 text-white/70 hover:text-white disabled:opacity-40 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta anuncio reportado ─────────────────────────────────────
function TarjetaReportado({ anuncio, onGestionado }) {
  const [modo, setModo]       = useState(null); // null | 'suspender'
  const [motivo, setMotivo]   = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]     = useState('');

  const ejecutar = async (accion) => {
    setError('');
    if (accion === 'suspender' && !motivo.trim()) {
      setError('El motivo es requerido para suspender.'); return;
    }
    setCargando(true);
    try {
      await api.patch(`/api/admin/announcements/${anuncio._id}`, {
        accion,
        ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
      });
      onGestionado(anuncio._id);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al gestionar el anuncio.');
    } finally {
      setCargando(false);
    }
  };

  const reportesNoRevisados = anuncio.reportes?.filter((r) => !r.revisado) ?? [];

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text truncate">{anuncio.titulo}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {CATEGORIAS[anuncio.categoria] ?? anuncio.categoria}
            {' · '}Proveedor: <span className="font-medium text-text">{anuncio.proveedor?.nombre ?? '—'}</span>
          </p>
          <p className="text-xs text-text-muted mt-0.5">{anuncio.proveedor?.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            anuncio.estado === 'activo'     ? 'bg-success/10 text-success' :
            anuncio.estado === 'suspendido' ? 'bg-danger/10 text-danger'   :
            'bg-gray-100 text-gray-500'
          }`}>
            {anuncio.estado}
          </span>
          <span className="text-xs text-text-muted">{reportesNoRevisados.length} reporte(s)</span>
        </div>
      </div>

      {/* Lista de reportes */}
      <div className="space-y-1.5">
        {reportesNoRevisados.map((r, i) => (
          <div key={i} className="bg-background rounded-lg px-3 py-2 text-xs">
            <span className="font-semibold text-danger capitalize">{r.motivo?.replace('_', ' ')}</span>
            {r.descripcion && <span className="text-text-muted"> — {r.descripcion}</span>}
          </div>
        ))}
      </div>

      {modo === 'suspender' && (
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          placeholder="Motivo de la suspensión…"
          className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
        />
      )}

      {error && <ErrorMsg texto={error} />}

      <div className="flex flex-wrap gap-2">
        {modo === null ? (
          <>
            {anuncio.estado !== 'suspendido' && (
              <button
                onClick={() => setModo('suspender')}
                className="text-xs font-semibold bg-danger/10 hover:bg-danger/20 text-danger px-3 py-1.5 rounded-lg transition-colors"
              >
                Suspender
              </button>
            )}
            <button
              onClick={() => ejecutar('desestimar')}
              disabled={cargando}
              className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {cargando ? '…' : 'Desestimar'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => ejecutar('suspender')}
              disabled={cargando}
              className="text-xs font-semibold bg-danger hover:bg-danger/80 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {cargando ? 'Guardando…' : 'Confirmar suspensión'}
            </button>
            <button
              onClick={() => { setModo(null); setMotivo(''); setError(''); }}
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

// ── Tab: Anuncios reportados ──────────────────────────────────────
function TabReportados() {
  const [lista, setLista]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/api/admin/announcements/reported')
      .then(({ data }) => setLista(data.data))
      .catch(() => setError('No se pudieron cargar los anuncios reportados.'))
      .finally(() => setLoading(false));
  }, []);

  const quitar = useCallback((id) => {
    setLista((prev) => prev.filter((a) => a._id !== id));
  }, []);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorMsg texto={error} />;

  return (
    <div className="space-y-3">
      {lista.length === 0
        ? <Vacio texto="No hay anuncios con reportes pendientes." />
        : lista.map((a) => (
            <TarjetaReportado key={a._id} anuncio={a} onGestionado={quitar} />
          ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function AdminPage() {
  const { usuario, logout } = useAuth();
  const [tabActiva, setTabActiva] = useState(0);

  if (!usuario?.roles?.includes('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-primary">
      <AdminNav usuario={usuario} onLogout={logout} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cabecera */}
        <div>
          <h1 className="text-2xl font-bold text-white">Panel de administración</h1>
          <p className="text-sm text-white/60 mt-1">Gestión general de ServiLink</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white/10 p-1 rounded-xl w-fit">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setTabActiva(i)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tabActiva === i
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {tabActiva === 0 && <TabEstadisticas />}
        {tabActiva === 1 && <TabVerificaciones />}
        {tabActiva === 2 && <TabUsuarios />}
        {tabActiva === 3 && <TabReportados />}
      </div>
    </div>
  );
}
