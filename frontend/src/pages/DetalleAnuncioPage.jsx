import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { imgUrl } from '../lib/imageUrl';
import DateTimePicker from '../components/DateTimePicker';

const ICONOS_CATEGORIA = {
  electricidad: 'https://cdn-icons-png.flaticon.com/128/3103/3103594.png',
  plomeria:     'https://cdn-icons-png.flaticon.com/128/8213/8213812.png',
  medicina:     'https://cdn-icons-png.flaticon.com/128/2902/2902069.png',
  carpinteria:  'https://cdn-icons-png.flaticon.com/128/1973/1973728.png',
  asesoria:     'https://cdn-icons-png.flaticon.com/128/1469/1469884.png',
  otro:         'https://cdn-icons-png.flaticon.com/128/10758/10758496.png',
};

const CATEGORIAS = {
  electricidad: 'Electricidad',
  plomeria:     'Plomería',
  medicina:     'Medicina',
  carpinteria:  'Carpintería',
  asesoria:     'Asesoría',
  otro:         'Otro',
};

// Fecha mínima: mañana a las 00:00 en formato datetime-local
function manana() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

// ── Carrusel de imágenes ──────────────────────────────────────────
function CarruselImagenes({ imagenes, imagenUrl, categoriaLabel }) {
  const fotos = imagenes?.length ? imagenes : (imagenUrl ? [imagenUrl] : []);
  const [idx, setIdx]         = useState(0);
  const [hovered, setHovered] = useState(false);
  const intervalRef           = useRef(null);

  useEffect(() => {
    if (fotos.length <= 1 || hovered) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % fotos.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [fotos.length, hovered]);

  if (!fotos.length) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-6xl font-bold text-gray-300">
          {(categoriaLabel?.[0] ?? '?').toUpperCase()}
        </span>
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + fotos.length) % fotos.length);
  const next = () => setIdx((i) => (i + 1) % fotos.length);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={imgUrl(fotos[idx])}
        alt={`Imagen ${idx + 1}`}
        className="w-full h-72 object-cover transition-opacity duration-300"
      />

      {fotos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Anterior"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Siguiente"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
            {fotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`}
                aria-label={`Ir a imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Skeleton de carga ─────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-border rounded w-3/4" />
      <div className="h-4 bg-border rounded w-1/4" />
      <div className="h-4 bg-border rounded" />
      <div className="h-4 bg-border rounded" />
      <div className="h-4 bg-border rounded w-5/6" />
    </div>
  );
}

// ── Panel del proveedor ───────────────────────────────────────────
function PanelProveedor({ proveedor }) {
  const inicial = proveedor?.nombre?.[0]?.toUpperCase() ?? '?';
  const categoria = CATEGORIAS[proveedor?.providerData?.categoria] ?? '';

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center text-center gap-3">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
        {proveedor?.fotoPerfil
          ? <img src={imgUrl(proveedor.fotoPerfil)} alt={proveedor.nombre} className="w-full h-full rounded-full object-cover" />
          : inicial}
      </div>

      <div>
        <p className="font-semibold text-text text-base">{proveedor?.nombre ?? '—'}</p>
        {categoria && (
          <p className="text-xs text-text-muted mt-0.5">{categoria}</p>
        )}
      </div>

      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-3 py-1 rounded-full">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
        </svg>
        Verificado
      </span>

      <Link
        to={`/usuarios/${proveedor?._id}/public`}
        className="text-xs text-primary hover:underline"
      >
        Ver perfil completo
      </Link>
    </div>
  );
}

// ── Login wall ────────────────────────────────────────────────────
function LoginWall() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-4">
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-text">Inicia sesión para contactar</p>
        <p className="text-xs text-text-muted mt-1">a este proveedor</p>
      </div>
      <div className="flex flex-col gap-2">
        <Link
          to="/registro"
          className="block w-full py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Crear cuenta
        </Link>
        <Link
          to="/login"
          className="block w-full py-2 border border-primary text-primary text-sm font-semibold rounded-lg hover:bg-primary/5 transition-colors"
        >
          Ya tengo cuenta
        </Link>
      </div>
    </div>
  );
}

// ── Modal solicitud de servicio ───────────────────────────────────
function ModalSolicitud({ anuncio, onCerrar, navigate }) {
  const overlayRef = useRef(null);
  const [descripcion, setDescripcion]   = useState('');
  const [fecha, setFecha]               = useState('');
  const [cargando, setCargando]         = useState(false);
  const [exito, setExito]               = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');

  // Cerrar al hacer clic en el overlay fuera del panel
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onCerrar();
  };

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCerrar]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!descripcion.trim()) {
      setErrorMsg('La descripción es requerida.');
      return;
    }
    if (!fecha) {
      setErrorMsg('Selecciona una fecha propuesta.');
      return;
    }

    setCargando(true);
    try {
      await api.post('/api/service-requests', {
        proveedorId:    anuncio.proveedor._id,
        anuncioId:      anuncio._id,
        descripcion:    descripcion.trim(),
        fechaPropuesta: fecha,
      });
      setExito(true);
      // Redirige al dashboard después de 1.5 s
      setTimeout(() => {
        onCerrar();
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.error ?? 'Error al enviar la solicitud.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">Solicitar servicio</h2>
          <button
            onClick={onCerrar}
            className="text-text-muted hover:text-text transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Nombre del anuncio */}
        <p className="text-sm text-text-muted -mt-2 line-clamp-1">
          <span className="font-medium text-text">{anuncio.titulo}</span>
          {' '}· {anuncio.proveedor?.nombre}
        </p>

        {exito ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-success/10 border border-success/30 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-success shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-success font-medium">¡Solicitud enviada!</p>
                <p className="text-xs text-success/80 mt-0.5">Redirigiendo a tu dashboard…</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="space-y-4">
            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text">
                Descripción del trabajo <span className="text-danger">*</span>
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                placeholder="Describe lo que necesitas…"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
              />
            </div>

            {/* Fecha propuesta */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text">
                Fecha propuesta <span className="text-danger">*</span>
              </label>
              <DateTimePicker
                value={fecha}
                onChange={setFecha}
                min={manana()}
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-2">
                {errorMsg}
              </p>
            )}

            {/* Acciones */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={cargando}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {cargando ? 'Enviando…' : 'Enviar solicitud'}
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
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function DetalleAnuncioPage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [anuncio, setAnuncio]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [modalAbierto, setModal]    = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get(`/api/announcements/${id}`)
      .then(({ data }) => { if (!cancelled) setAnuncio(data.data); })
      .catch(() => { if (!cancelled) setError('No se pudo cargar el anuncio.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  // Comprueba si el usuario autenticado es el dueño del anuncio
  const esPropio = usuario && anuncio
    ? (usuario.id ?? usuario._id) === anuncio.proveedor?._id
    : false;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {modalAbierto && anuncio && (
        <ModalSolicitud anuncio={anuncio} onCerrar={() => setModal(false)} navigate={navigate} />
      )}

      <div className="pt-16">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs text-text-muted">
            <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-text">Detalle de anuncio</span>
          </nav>
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2"><Skeleton /></div>
              <div className="h-64 bg-border rounded-2xl animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-danger text-sm mb-4">{error}</p>
              <Link to="/" className="text-sm text-primary underline">Volver al inicio</Link>
            </div>
          ) : anuncio ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ── Columna principal ── */}
              <div className="lg:col-span-2 space-y-6">
                <CarruselImagenes
                  imagenes={anuncio.imagenes}
                  imagenUrl={anuncio.imagenUrl}
                  categoriaLabel={CATEGORIAS[anuncio.categoria] ?? anuncio.categoria}
                />

                <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {CATEGORIAS[anuncio.categoria] ?? anuncio.categoria}
                </span>

                <h1 className="text-2xl sm:text-3xl font-bold text-text leading-snug">
                  {anuncio.titulo}
                </h1>

                <div className="flex items-center gap-3">
                  {anuncio.precioRef != null ? (
                    <>
                      <span className="text-2xl font-bold text-primary">${anuncio.precioRef}</span>
                      <span className="text-sm text-text-muted">precio referencial</span>
                    </>
                  ) : (
                    <span className="text-sm text-text-muted italic">Precio a consultar</span>
                  )}
                </div>

                <div className="bg-surface border border-border rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">
                    Descripción del servicio
                  </h2>
                  <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                    {anuncio.descripcion}
                  </p>
                </div>

                <p className="text-xs text-text-muted">
                  Publicado el{' '}
                  {new Date(anuncio.createdAt).toLocaleDateString('es-EC', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>

              {/* ── Sidebar derecho ── */}
              <div className="space-y-4">
                <PanelProveedor proveedor={anuncio.proveedor} />

                {/* CTA según autenticación y propiedad */}
                {!usuario ? (
                  <LoginWall />
                ) : esPropio ? (
                  <div className="w-full py-3 bg-surface border border-border text-text-muted text-sm font-medium rounded-xl text-center">
                    Este es tu propio anuncio
                  </div>
                ) : (
                  <button
                    onClick={() => setModal(true)}
                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Solicitar servicio
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
