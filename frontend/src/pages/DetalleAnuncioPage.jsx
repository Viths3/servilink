/* cSpell:disable */
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

  const esRemovida = (url) => url === 'REMOVED_BY_MODERATOR';

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {esRemovida(fotos[idx]) ? (
        <div className="w-full h-72 bg-gray-200 rounded-2xl flex items-center justify-center">
          <div className="text-center space-y-2">
            <span className="text-4xl">🚫</span>
            <p className="text-sm text-gray-600">Imagen removida por un moderador</p>
          </div>
        </div>
      ) : (
        <img
          src={imgUrl(fotos[idx])}
          alt={`Imagen ${idx + 1}`}
          className="w-full h-72 object-cover transition-opacity duration-300"
        />
      )}

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
  const proveedorId = proveedor?._id ?? proveedor;

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

      {proveedorId && (
        <Link
          to={`/usuarios/${proveedorId}/public`}
          className="text-xs text-primary hover:underline"
        >
          Ver perfil completo
        </Link>
      )}
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

// ── Modal editar anuncio para admin ──────────────────────────────
function ModalEditarAnuncioAdmin({ anuncio, onCerrar, onGuardado }) {
  const [titulo, setTitulo] = useState(anuncio.titulo);
  const [descripcion, setDescripcion] = useState(anuncio.descripcion);
  const [categoria, setCategoria] = useState(anuncio.categoria);
  const [precioRef, setPrecioRef] = useState(anuncio.precioRef ?? '');
  const [estado, setEstado] = useState(anuncio.estado ?? 'activo');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [imagenesAEliminar, setImagenesAEliminar] = useState([]);
  const [imagenesNuevas, setImagenesNuevas] = useState([]);
  const [previewsNuevos, setPreviewsNuevos] = useState([]);
  const [fotoAbierta, setFotoAbierta] = useState(null);
  const [errorArchivos, setErrorArchivos] = useState('');

  const validarArchivoImagen = (archivo) => {
    // Validar tipo MIME
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      setErrorArchivos(`❌ ${archivo.name}: Solo se permiten imágenes JPG, PNG o WebP`);
      return false;
    }

    // Validar extensión
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = archivo.name.split('.').pop().toLowerCase();
    if (!extensionesPermitidas.includes(extension)) {
      setErrorArchivos(`❌ ${archivo.name}: Extensión no permitida`);
      return false;
    }

    // Validar tamaño (máx 5MB)
    const tamanioMaxMB = 5;
    if (archivo.size > tamanioMaxMB * 1024 * 1024) {
      setErrorArchivos(`❌ ${archivo.name}: Archivo muy grande (máx ${tamanioMaxMB}MB)`);
      return false;
    }

    // Validar que no contenga caracteres peligrosos en el nombre
    if (/[<>:"|?*\\/]/.test(archivo.name)) {
      setErrorArchivos(`❌ ${archivo.name}: Nombre de archivo contiene caracteres no permitidos`);
      return false;
    }

    return true;
  };

  const handleNuevasImagenes = (e) => {
    setErrorArchivos('');
    const archivos = Array.from(e.target.files || []);
    const archivosValidos = archivos.filter(validarArchivoImagen);

    if (archivosValidos.length === 0) {
      e.target.value = '';
      return;
    }

    const nuevas = [...imagenesNuevas, ...archivosValidos];
    setImagenesNuevas(nuevas);

    archivosValidos.forEach((archivo) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPreviewsNuevos((prev) => [...prev, evt.target.result]);
      };
      reader.readAsDataURL(archivo);
    });

    e.target.value = '';
  };

  const eliminarImagenDeAnuncio = (ruta) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    setImagenesAEliminar((prev) => [...prev, ruta]);
  };

  const guardar = async () => {
    setError('');
    setExito('');

    if (!titulo.trim()) {
      setError('El título es requerido.');
      return;
    }

    if (!descripcion.trim()) {
      setError('La descripción es requerida.');
      return;
    }

    setCargando(true);
    try {
      const fd = new FormData();
      fd.append('titulo', titulo.trim());
      fd.append('descripcion', descripcion.trim());
      fd.append('categoria', categoria);
      fd.append('precioRef', precioRef ? Number(precioRef) : null);
      fd.append('estado', estado);
      fd.append('imagenesEliminar', JSON.stringify(imagenesAEliminar));

      for (const archivo of imagenesNuevas) {
        fd.append('imagenes', archivo);
      }

      const { data } = await api.patch(`/api/announcements/${anuncio._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setExito('✅ Anuncio actualizado correctamente');
      setTimeout(() => {
        onGuardado(data.data);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al actualizar el anuncio.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {fotoAbierta && (
        <div className="fixed inset-0 z-101 flex items-center justify-center bg-black/80 px-4">
          <button
            onClick={() => setFotoAbierta(null)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
          <img src={imgUrl(fotoAbierta)} alt="Imagen grande" className="max-w-3xl max-h-[80vh] rounded-lg object-contain" />
        </div>
      )}

      <div
        onClick={(e) => { if (e.target.className.includes('fixed')) onCerrar(); }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      >
        <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h3 className="text-lg font-bold text-primary">Editar anuncio</h3>
          <button
            onClick={onCerrar}
            className="text-text-muted hover:text-text transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text mb-2">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength="100"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text"
            />
            <p className="text-xs text-text-muted mt-1">{titulo.length}/100</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-2">Descripción *</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              maxLength="500"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text"
            />
            <p className="text-xs text-text-muted mt-1">{descripcion.length}/500</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Categoría *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text bg-white"
              >
                <option value="electricidad">Electricidad</option>
                <option value="plomeria">Plomería</option>
                <option value="medicina">Medicina</option>
                <option value="carpinteria">Carpintería</option>
                <option value="asesoria">Asesoría</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-2">Precio ($)</label>
              <input
                type="number"
                value={precioRef}
                onChange={(e) => setPrecioRef(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-2">Estado *</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text bg-white"
            >
              <option value="activo">Activo</option>
              <option value="suspendido">Suspendido</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div className="border-t border-border pt-5">
            <h4 className="text-sm font-semibold text-text mb-3">Imágenes del anuncio</h4>

            {anuncio.imagenes && anuncio.imagenes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-text-muted mb-2">Miniaturas actuales:</p>
                <div className="flex flex-wrap gap-3">
                  {anuncio.imagenes.map((img, idx) => {
                    const yaEliminada = imagenesAEliminar.includes(img);
                    const esRemovida = img === 'REMOVED_BY_MODERATOR';
                    return (
                      <div key={idx} className="relative group">
                        {esRemovida || yaEliminada ? (
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-2xl cursor-default">
                            🚫
                          </div>
                        ) : (
                          <>
                            <img
                              src={imgUrl(img)}
                              alt={`Imagen ${idx + 1}`}
                              className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setFotoAbierta(img)}
                            />
                            <button
                              type="button"
                              onClick={() => eliminarImagenDeAnuncio(img)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-danger hover:bg-danger-dark rounded-full flex items-center justify-center transition-colors"
                              title="Eliminar imagen"
                            >
                              <img src="https://cdn-icons-png.flaticon.com/128/17213/17213074.png" className="w-3 h-3" alt="eliminar" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-text mb-2">Agregar nuevas imágenes</label>
              <input
                type="file"
                multiple
                accept="image/jpg,image/png"
                onChange={handleNuevasImagenes}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errorArchivos && (
                <p className="text-xs text-danger mt-1">{errorArchivos}</p>
              )}
            </div>

            {previewsNuevos.length > 0 && (
              <div>
                <p className="text-xs text-text-muted mb-2">Nuevas imágenes:</p>
                <div className="flex flex-wrap gap-3">
                  {previewsNuevos.map((preview, idx) => (
                    <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={preview} alt={`New ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-2">{error}</p>
          )}
          {exito && (
            <p className="text-xs text-success bg-success/5 border border-success/20 rounded px-3 py-2">{exito}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={guardar}
              disabled={cargando || !titulo.trim() || !descripcion.trim()}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              onClick={onCerrar}
              disabled={cargando}
              className="flex-1 py-2.5 border border-border text-text hover:bg-background rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
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
  const [modalEditarAbierto, setModalEditar] = useState(false);
  const [cargando, setCargando]     = useState(false);
  const [mensajeAdmin, setMensajeAdmin] = useState('');

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

  // Comprueba si el usuario es admin
  const esAdmin = usuario?.roles?.includes('admin') ?? false;

  const cambiarEstado = async (nuevoEstado) => {
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return;
    setCargando(true);
    try {
      const { data } = await api.patch(`/api/announcements/${anuncio._id}`, {
        estado: nuevoEstado,
      });
      setAnuncio(data.data);
      setMensajeAdmin(`✅ Anuncio ${nuevoEstado} correctamente`);
      setTimeout(() => setMensajeAdmin(''), 3000);
    } catch (err) {
      setMensajeAdmin(`❌ Error: ${err.response?.data?.error ?? 'Error desconocido'}`);
      setTimeout(() => setMensajeAdmin(''), 3000);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {modalAbierto && anuncio && (
        <ModalSolicitud anuncio={anuncio} onCerrar={() => setModal(false)} navigate={navigate} />
      )}

      {modalEditarAbierto && anuncio && (
        <ModalEditarAnuncioAdmin
          anuncio={anuncio}
          onCerrar={() => setModalEditar(false)}
          onGuardado={(anuncioActualizado) => {
            setAnuncio(anuncioActualizado);
            setModalEditar(false);
            setMensajeAdmin('✅ Anuncio actualizado correctamente');
            setTimeout(() => setMensajeAdmin(''), 3000);
          }}
        />
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

                {/* Panel de moderación para admin */}
                {esAdmin && (
                  <div className="bg-surface border-2 border-accent rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Panel de moderación</h3>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Estado actual:</span>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        anuncio.estado === 'activo' ? 'bg-success/10 text-success' :
                        anuncio.estado === 'suspendido' ? 'bg-danger/10 text-danger' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {anuncio.estado}
                      </span>
                    </div>

                    {mensajeAdmin && (
                      <p className={`text-xs px-3 py-2 rounded ${
                        mensajeAdmin.startsWith('✅')
                          ? 'bg-success/10 text-success border border-success/20'
                          : 'bg-danger/10 text-danger border border-danger/20'
                      }`}>
                        {mensajeAdmin}
                      </p>
                    )}

                    <div className="space-y-2">
                      <button
                        onClick={() => setModalEditar(true)}
                        disabled={cargando}
                        className="w-full text-xs font-semibold py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50"
                      >
                        Editar anuncio
                      </button>

                      {anuncio.estado !== 'suspendido' && (
                        <button
                          onClick={() => cambiarEstado('suspendido')}
                          disabled={cargando}
                          className="w-full text-xs font-semibold py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors disabled:opacity-50"
                        >
                          Suspender anuncio
                        </button>
                      )}

                      {(anuncio.estado === 'suspendido' || anuncio.estado === 'inactivo') && (
                        <button
                          onClick={() => cambiarEstado('activo')}
                          disabled={cargando}
                          className="w-full text-xs font-semibold py-2 bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors disabled:opacity-50"
                        >
                          Activar anuncio
                        </button>
                      )}
                    </div>
                  </div>
                )}

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
