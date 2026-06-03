import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import NavbarDashboard from '../components/NavbarDashboard';
import { imgUrl } from '../lib/imageUrl';

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
function TarjetaAnuncio({ anuncio, onEditar, onEliminar }) {
  const [eliminando, setEliminando] = useState(false);

  const handleEliminar = async () => {
    if (!window.confirm(`¿Eliminar el anuncio "${anuncio.titulo}"?`)) return;
    setEliminando(true);
    try {
      await api.delete(`/api/announcements/${anuncio._id}`);
      onEliminar(anuncio._id);
    } catch (err) {
      alert(err.response?.data?.error ?? 'Error al eliminar el anuncio.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <Link
          to={`/anuncios/${anuncio._id}`}
          className="text-sm font-semibold text-text truncate hover:text-primary transition-colors block"
        >
          {anuncio.titulo}
        </Link>
        <p className="text-xs text-text-muted mt-0.5">
          {CATEGORIAS[anuncio.categoria] ?? anuncio.categoria}
          {anuncio.precioRef != null && <> · <span className="text-primary font-medium">${anuncio.precioRef}</span></>}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{fmt(anuncio.createdAt)}</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onEditar(anuncio)}
            className="text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-lg transition-colors"
          >
            Editar
          </button>
          <button
            onClick={handleEliminar}
            disabled={eliminando}
            className="text-xs font-semibold bg-danger/10 hover:bg-danger/20 text-danger px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            {eliminando ? '…' : 'Eliminar'}
          </button>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
        anuncio.estado === 'activo' ? 'bg-success/10 text-success' :
        anuncio.estado === 'suspendido' ? 'bg-danger/10 text-danger' :
        'bg-gray-100 text-gray-500'
      }`}>
        {anuncio.estado}
      </span>
    </div>
  );
}

// ── Pestaña PROVEEDOR ─────────────────────────────────────────────
const CATEGORIAS_ANUNCIO = [
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'plomeria',     label: 'Plomería' },
  { value: 'medicina',     label: 'Medicina' },
  { value: 'carpinteria',  label: 'Carpintería' },
  { value: 'asesoria',     label: 'Asesoría' },
  { value: 'otro',         label: 'Otro' },
];

// ── Modal crear / editar anuncio ─────────────────────────────────
function ModalAnuncio({ anuncio, onCerrar, onGuardado }) {
  const modoEdicion = Boolean(anuncio);
  const overlayRef  = useRef(null);

  const [titulo,      setTitulo]      = useState(anuncio?.titulo      ?? '');
  const [descripcion, setDescripcion] = useState(anuncio?.descripcion ?? '');
  const [categoria,   setCategoria]   = useState(anuncio?.categoria   ?? '');
  const [precio,      setPrecio]      = useState(anuncio?.precioRef != null ? String(anuncio.precioRef) : '');
  const [imagen,      setImagen]      = useState(null);
  const [preview,     setPreview]     = useState(anuncio?.imagen ?? null);
  const [imagenError, setImagenError] = useState('');
  const [cargando,    setCargando]    = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCerrar]);

  const handleImagen = (e) => {
    const file = e.target.files[0];
    setImagenError('');
    if (!file) { setImagen(null); setPreview(anuncio?.imagen ?? null); return; }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setImagenError('Solo se aceptan archivos JPG o PNG.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImagenError('El archivo supera el límite de 5 MB.');
      e.target.value = '';
      return;
    }
    setImagen(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!titulo.trim())      { setErrorMsg('El título es requerido.'); return; }
    if (!descripcion.trim()) { setErrorMsg('La descripción es requerida.'); return; }
    if (!categoria)          { setErrorMsg('Selecciona una categoría.'); return; }

    const fd = new FormData();
    fd.append('titulo', titulo.trim());
    fd.append('descripcion', descripcion.trim());
    fd.append('categoria', categoria);
    if (precio !== '') fd.append('precioRef', precio);
    if (imagen) fd.append('imagen', imagen);

    setCargando(true);
    try {
      if (modoEdicion) {
        await api.patch(`/api/announcements/${anuncio._id}`, fd);
      } else {
        await api.post('/api/announcements', fd);
      }
      onGuardado();
    } catch (err) {
      setErrorMsg(err.response?.data?.error ?? 'Error al guardar el anuncio.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onCerrar(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">
            {modoEdicion ? 'Editar anuncio' : 'Nuevo anuncio'}
          </h2>
          <button onClick={onCerrar} className="text-text-muted hover:text-text transition-colors" aria-label="Cerrar">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleEnviar} className="space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">
              Título <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Instalación eléctrica residencial"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">
              Descripción <span className="text-danger">*</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Describe el servicio que ofreces…"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">
              Categoría <span className="text-danger">*</span>
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text bg-white"
            >
              <option value="">Selecciona…</option>
              {CATEGORIAS_ANUNCIO.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Precio */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">
              Precio referencial <span className="text-text-muted font-normal">(opcional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Ej. 25.00"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
            />
          </div>

          {/* Imagen con preview */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">
              Imagen del servicio <span className="text-text-muted font-normal">(opcional · JPG/PNG · máx. 5 MB)</span>
            </label>
            {preview && (
              <img
                src={imgUrl(preview)}
                alt="preview"
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImagen}
              className="w-full text-sm text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
            {imagenError && (
              <p className="text-xs text-danger">{imagenError}</p>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-2">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {cargando
                ? (modoEdicion ? 'Guardando…' : 'Publicando…')
                : (modoEdicion ? 'Guardar cambios' : 'Publicar anuncio')}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 py-2.5 border border-border text-text-muted hover:text-text text-sm font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PestanaProveedor({ usuarioId }) {
  const [recibidas, setRecibidas]       = useState([]);
  const [loadRec, setLoadRec]           = useState(true);
  const [anuncios, setAnuncios]         = useState([]);
  const [loadAnu, setLoadAnu]           = useState(true);
  const [modalAnuncio, setModalAnuncio] = useState(null); // null | false (nuevo) | anuncio obj (editar)

  const cargarAnuncios = useCallback(() => {
    setLoadAnu(true);
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

  useEffect(() => {
    api.get('/api/service-requests/received')
      .then(({ data }) => setRecibidas(data.data))
      .catch(() => setRecibidas([]))
      .finally(() => setLoadRec(false));

    cargarAnuncios();
  }, [cargarAnuncios]);

  const actualizarSolicitud = useCallback((id, nueva) => {
    setRecibidas((prev) => prev.map((s) => (s._id === id ? { ...s, ...nueva } : s)));
  }, []);

  const handleGuardado = useCallback(() => {
    setModalAnuncio(null);
    cargarAnuncios();
  }, [cargarAnuncios]);

  const handleEliminar = useCallback((id) => {
    setAnuncios((prev) => prev.filter((a) => a._id !== id));
  }, []);

  return (
    <div className="space-y-8">
      {modalAnuncio !== null && (
        <ModalAnuncio
          anuncio={modalAnuncio || null}
          onCerrar={() => setModalAnuncio(null)}
          onGuardado={handleGuardado}
        />
      )}

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white/90">Mis anuncios</h2>
          <button
            onClick={() => setModalAnuncio(false)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white text-primary hover:bg-white/90 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Nuevo anuncio
          </button>
        </div>
        {loadAnu ? (
          <Skeleton />
        ) : anuncios.length === 0 ? (
          <Vacio texto="No tienes anuncios publicados aún." />
        ) : (
          <div className="space-y-3">
            {anuncios.map((a) => (
              <TarjetaAnuncio
                key={a._id}
                anuncio={a}
                onEditar={(anuncio) => setModalAnuncio(anuncio)}
                onEliminar={handleEliminar}
              />
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
  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario?.roles?.includes('admin')) {
      navigate('/admin', { replace: true });
    }
  }, [usuario, navigate]);

  const esProveedor = usuario?.roles?.includes('proveedor');
  const esCliente   = usuario?.roles?.includes('cliente');
  const rolDual     = esProveedor && esCliente;

  const [pestana, setPestana] = useState(esProveedor ? 'proveedor' : 'cliente');

  return (
    <div className="min-h-screen bg-primary">
      <NavbarDashboard />

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
          <PestanaProveedor usuarioId={usuario.id} />
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
              <button
                onClick={() => navigate('/registro-proveedor', {
                  state: { nombre: usuario?.nombre, telefono: usuario?.telefono },
                })}
                className="text-sm font-medium bg-white text-primary hover:bg-white/90 px-4 py-2 rounded-lg transition-colors"
              >
                Convertirme en proveedor
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
