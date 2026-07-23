/* cSpell:disable */
import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { imgUrl } from '../lib/imageUrl';
import NavbarDashboard from '../components/NavbarDashboard';

const TABS = ['Estadísticas', 'Verificaciones', 'Usuarios', 'Anuncios reportados', 'Pagos'];

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
function TabEstadisticas({ onNavigate }) {
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
    { label: 'Total usuarios',              valor: stats.usuarios.total,                   sub: `${stats.usuarios.activos} activos`, tabIndex: 2 },
    { label: 'Proveedores',                 valor: stats.usuarios.proveedores,              sub: `${stats.usuarios.clientes} clientes`, tabIndex: 2 },
    { label: 'Verificaciones pendientes',   valor: stats.pendientes.verificaciones,         sub: `${stats.pendientes.upgrades} upgrades`, tabIndex: 1 },
    { label: 'Anuncios con reportes',       valor: stats.anuncios.conReportesActivos,       sub: `${stats.anuncios.suspendidos} suspendidos`, tabIndex: 3 },
    { label: 'Solicitudes activas',         valor: solicitudesActivas,                      sub: `${stats.solicitudes.total} total` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {tarjetas.map(({ label, valor, sub, tabIndex }) => (
          <div
            key={label}
            onClick={() => tabIndex !== undefined && onNavigate(tabIndex)}
            className={`bg-white rounded-xl p-5 space-y-1 shadow-sm ${
              tabIndex !== undefined ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-primary transition-all' : ''
            }`}
          >
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

// ── Modal editar anuncio ──────────────────────────────────────
function ModalEditarAnuncio({ anuncio, onGuardado, onCerrar, usuario }) {
  const [titulo, setTitulo] = useState(anuncio.titulo);
  const [descripcion, setDescripcion] = useState(anuncio.descripcion);
  const [categoria, setCategoria] = useState(anuncio.categoria);
  const [precioRef, setPrecioRef] = useState(anuncio.precioRef ?? '');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [imagenesActuales, setImagenesActuales] = useState(anuncio.imagenes ?? [anuncio.imagenUrl].filter(Boolean));
  const [imagenesEliminar, setImagenesEliminar] = useState([]);
  const [imagenesNuevas, setImagenesNuevas] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [fotoFullscreen, setFotoFullscreen] = useState(null);

  const validarArchivo = (archivo) => {
    // Validar tipo MIME
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      setError(`❌ ${archivo.name}: Solo se permiten imágenes JPG, PNG o WebP`);
      return false;
    }

    // Validar extensión
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = archivo.name.split('.').pop().toLowerCase();
    if (!extensionesPermitidas.includes(extension)) {
      setError(`❌ ${archivo.name}: Extensión no permitida`);
      return false;
    }

    // Validar tamaño (máx 5MB)
    const tamanioMaxMB = 5;
    if (archivo.size > tamanioMaxMB * 1024 * 1024) {
      setError(`❌ ${archivo.name}: Archivo muy grande (máx ${tamanioMaxMB}MB)`);
      return false;
    }

    // Validar que no contenga caracteres peligrosos en el nombre
    if (/[<>:"|?*\\/]/.test(archivo.name)) {
      setError(`❌ ${archivo.name}: Nombre de archivo contiene caracteres no permitidos`);
      return false;
    }

    return true;
  };

  const handleAddImages = (e) => {
    setError('');
    const archivos = Array.from(e.target.files);
    const archivosValidos = archivos.filter(validarArchivo);

    if (archivosValidos.length === 0) {
      e.target.value = '';
      return;
    }

    const nuevas = [...imagenesNuevas, ...archivosValidos];
    const prevs = nuevas.map(f => URL.createObjectURL(f));
    setImagenesNuevas(nuevas);
    setPreviews(prevs);
    e.target.value = '';
  };

  const eliminarImagenActual = (idx) => {
    const imagenUrl = imagenesActuales[idx];
    setImagenesEliminar([...imagenesEliminar, imagenUrl]);
    setImagenesActuales(imagenesActuales.filter((_, i) => i !== idx));
  };

  const eliminarImagenNueva = (idx) => {
    const nuevas = imagenesNuevas.filter((_, i) => i !== idx);
    const prevs = nuevas.map(f => URL.createObjectURL(f));
    setImagenesNuevas(nuevas);
    setPreviews(prevs);
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
      if (precioRef) fd.append('precioRef', Number(precioRef));

      if (imagenesEliminar.length > 0) {
        fd.append('imagenesEliminar', JSON.stringify(imagenesEliminar));
      }

      imagenesNuevas.forEach(img => {
        fd.append('imagenes', img);
      });

      const { data } = await api.patch(`/api/announcements/${anuncio._id}`, fd);
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
    <div
      onClick={(e) => { if (e.target.className.includes('fixed')) onCerrar(); }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-primary">Editar anuncio</h3>
            <p className="text-xs text-text-muted mt-0.5">{usuario?.nombre}</p>
          </div>
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
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-text mb-2">Título del anuncio *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength="100"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text"
            />
            <p className="text-xs text-text-muted mt-1">{titulo.length}/100 caracteres</p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-text mb-2">Descripción *</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              maxLength="500"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text"
            />
            <p className="text-xs text-text-muted mt-1">{descripcion.length}/500 caracteres</p>
          </div>

          {/* Categoría y Precio - Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Categoría *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text bg-white"
              >
                <option value="">Selecciona categoría</option>
                <option value="electricidad">Electricidad</option>
                <option value="plomeria">Plomería</option>
                <option value="medicina">Medicina</option>
                <option value="carpinteria">Carpintería</option>
                <option value="asesoria">Asesoría</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-2">Precio referencial ($)</label>
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

          {/* Imágenes actuales */}
          {imagenesActuales.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Imágenes actuales</label>
              <div className="flex flex-wrap gap-3">
                {imagenesActuales.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={imgUrl(img)}
                      alt={`anuncio-${idx}`}
                      onClick={() => setFotoFullscreen(img)}
                      className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                    />
                    <button
                      onClick={() => eliminarImagenActual(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-danger rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-dark"
                      title="Eliminar imagen"
                    >
                      <img src="https://cdn-icons-png.flaticon.com/128/17213/17213074.png" className="w-3 h-3" alt="eliminar" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nuevas imágenes */}
          <div>
            <label className="block text-sm font-semibold text-text mb-2">Agregar imágenes</label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png"
              onChange={handleAddImages}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text"
            />
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={preview}
                      alt={`preview-${idx}`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => eliminarImagenNueva(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-danger rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-dark"
                      title="Eliminar imagen"
                    >
                      <img src="https://cdn-icons-png.flaticon.com/128/17213/17213074.png" className="w-3 h-3" alt="eliminar" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mensajes */}
          {error && (
            <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-2">{error}</p>
          )}
          {exito && (
            <p className="text-xs text-success bg-success/5 border border-success/20 rounded px-3 py-2">{exito}</p>
          )}

          {/* Botones */}
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

      {/* Lightbox para ver imagen a tamaño completo */}
      {fotoFullscreen && (
        <div
          onClick={() => setFotoFullscreen(null)}
          className="fixed inset-0 z-101 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={imgUrl(fotoFullscreen)}
              alt="foto-completa"
              className="w-full h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setFotoFullscreen(null)}
              className="absolute -top-8 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal detalle usuario ──────────────────────────────────────────
function ModalDetalleUsuario({ usuario, onCerrar, onToggle }) {
  const [detalles, setDetalles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [anuncioEditando, setAnuncioEditando] = useState(null);
  const [citas, setCitas] = useState(null);
  const [fotoFullscreen, setFotoFullscreen] = useState(null);
  const [usuarioActualizado, setUsuarioActualizado] = useState(usuario);

  useEffect(() => {
    setLoading(true);
    const esProveedor = usuario.roles?.includes('proveedor');
    const esCliente = usuario.roles?.includes('cliente');

    Promise.all([
      api.get(`/api/users/${usuario._id}/public`).then(({ data }) => data.data),
      esCliente ? api.get(`/api/service-requests/sent`).then(({ data }) => data.data) : Promise.resolve(null),
    ])
      .then(([det, cit]) => {
        setDetalles(det);
        setCitas(cit);
      })
      .catch(() => setError('No se pudieron cargar los detalles.'))
      .finally(() => setLoading(false));
  }, [usuario._id, usuario.roles]);

  const toggle = async () => {
    setCargando(true);
    try {
      const { data } = await api.patch(`/api/admin/users/${usuario._id}`, { activo: !usuario.activo });
      onToggle(usuario._id, data.data.activo);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al actualizar.');
    } finally {
      setCargando(false);
    }
  };

  const eliminarImagenDeAnuncio = async (anuncioId, imagenUrl) => {
    if (!confirm('¿Eliminar esta imagen del anuncio?')) return;
    try {
      await api.patch(`/api/announcements/${anuncioId}`, {
        imagenesEliminar: JSON.stringify([imagenUrl]),
      });
      setDetalles((prev) => ({
        ...prev,
        anuncios: prev.anuncios.map((a) =>
          a._id === anuncioId
            ? { ...a, imagenes: a.imagenes?.map(img => img === imagenUrl ? 'REMOVED_BY_MODERATOR' : img) ?? [] }
            : a
        ),
      }));
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al eliminar la imagen.');
    }
  };

  const eliminarFotoPerfil = async () => {
    if (!confirm('¿Eliminar la foto de perfil de este usuario? Se mostrará un mensaje de imagen removida.')) return;
    setCargando(true);
    try {
      const { data } = await api.patch(`/api/admin/users/${usuario._id}/remove-photo`);
      setUsuarioActualizado(data.usuario);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al eliminar la foto de perfil.');
    } finally {
      setCargando(false);
    }
  };

  const inicial = usuario.nombre?.[0]?.toUpperCase() ?? '?';
  const esProveedor = usuario.roles?.includes('proveedor');

  return (
    <div
      onClick={(e) => { if (e.target.className.includes('fixed')) onCerrar(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-lg font-bold text-text">Detalle del usuario</h2>
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

        <div className="p-6 space-y-6">
          {/* Información básica */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div
                onClick={() => usuarioActualizado.fotoPerfil && usuarioActualizado.fotoPerfil !== 'REMOVED_BY_MODERATOR' && setFotoFullscreen(usuarioActualizado.fotoPerfil)}
                className={`w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center text-3xl font-bold text-primary overflow-hidden border-2 border-primary ${usuarioActualizado.fotoPerfil && usuarioActualizado.fotoPerfil !== 'REMOVED_BY_MODERATOR' ? 'cursor-pointer hover:opacity-75' : ''}`}
              >
                {usuarioActualizado.fotoPerfil && usuarioActualizado.fotoPerfil !== 'REMOVED_BY_MODERATOR'
                  ? <img src={imgUrl(usuarioActualizado.fotoPerfil)} alt={usuario.nombre} className="w-full h-full object-cover" />
                  : inicial}
              </div>
              {usuarioActualizado.fotoPerfil && usuarioActualizado.fotoPerfil !== 'REMOVED_BY_MODERATOR' && (
                <button
                  onClick={eliminarFotoPerfil}
                  disabled={cargando}
                  className="text-xs font-semibold border border-danger text-danger hover:bg-danger/10 px-2 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <img src="https://cdn-icons-png.flaticon.com/128/17213/17213074.png" className="w-4 h-4" alt="eliminar" />
                  Eliminar foto
                </button>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-text">{usuario.nombre}</h3>
              <p className="text-sm text-text-muted">{usuario.email}</p>
              <p className="text-sm text-text-muted">{usuario.telefono}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {usuario.roles?.map((r) => (
                  <span key={r} className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                    {r}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${usuario.activo ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-2">{error}</p>
          )}

          {/* Datos de cliente */}
          {!esProveedor && citas && citas.length > 0 && (
            <div className="border-t border-border pt-6 space-y-4">
              <h4 className="text-sm font-semibold text-text">Citas agendadas</h4>
              <div className="space-y-3">
                {citas.map((cita) => (
                  <div key={cita._id} className="bg-background rounded-lg p-3 text-xs border border-border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text">{cita.proveedor?.nombre ?? 'Proveedor'}</p>
                        <p className="text-text-muted text-xs">{cita.proveedor?.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 whitespace-nowrap ${
                        cita.estado === 'aceptada' ? 'bg-success/10 text-success' :
                        cita.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        cita.estado === 'reagendada' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {cita.estado}
                      </span>
                    </div>
                    <p className="text-text-muted mb-1">📝 {cita.descripcion}</p>
                    <p className="text-text-muted">📅 {fmt(cita.fechaPropuesta ?? cita.fechaConfirmada)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datos de proveedor */}
          {esProveedor && (
            <div className="border-t border-border pt-6 space-y-4">
              <h4 className="text-sm font-semibold text-text">Información profesional</h4>
              {loading ? (
                <div className="h-20 bg-white/10 rounded-xl animate-pulse" />
              ) : detalles ? (
                <div className="space-y-3">
                  {detalles.verificationStatus && (
                    <div>
                      <p className="text-xs text-text-muted mb-1">Estado de verificación</p>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        detalles.verificationStatus === 'verified' ? 'bg-success/10 text-success' :
                        detalles.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-danger/10 text-danger'
                      }`}>
                        {detalles.verificationStatus === 'verified' ? 'Verificado' :
                         detalles.verificationStatus === 'pending' ? 'Pendiente' : 'Rechazado'}
                      </span>
                    </div>
                  )}
                  {detalles.categoria && (
                    <div>
                      <p className="text-xs text-text-muted">Categoría</p>
                      <p className="text-sm font-medium text-text">{CATEGORIAS[detalles.categoria] ?? detalles.categoria}</p>
                    </div>
                  )}
                  {detalles.descripcion && (
                    <div>
                      <p className="text-xs text-text-muted">Descripción</p>
                      <p className="text-sm text-text">{detalles.descripcion}</p>
                    </div>
                  )}
                  {detalles.anuncios && detalles.anuncios.length > 0 && (
                    <div>
                      <p className="text-xs text-text-muted mb-2">Anuncios activos ({detalles.anuncios.length})</p>
                      <div className="space-y-3">
                        {detalles.anuncios.slice(0, 5).map((a) => {
                          const imagenes = a.imagenes ?? (a.imagenUrl ? [a.imagenUrl] : []);
                          return (
                            <div key={a._id} className="bg-background rounded-lg p-4 space-y-3">
                              <div>
                                <p className="font-semibold text-text">{a.titulo}</p>
                                <p className="text-xs text-text-muted mt-0.5">${a.precioRef ?? a.precio} · {CATEGORIAS[a.categoria] ?? a.categoria}</p>
                              </div>

                              {imagenes.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {imagenes.map((img, idx) => {
                                    const esRemovida = img === 'REMOVED_BY_MODERATOR';
                                    return (
                                      <div key={idx} className="relative group">
                                        {esRemovida ? (
                                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                            🚫
                                          </div>
                                        ) : (
                                          <>
                                            <img
                                              src={imgUrl(img)}
                                              alt={`img-${idx}`}
                                              onClick={() => setFotoFullscreen(img)}
                                              className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-75 transition-opacity"
                                            />
                                            <button
                                              onClick={() => eliminarImagenDeAnuncio(a._id, img)}
                                              className="absolute -top-2 -right-2 w-5 h-5 bg-danger rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-dark"
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
                              )}

                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  a.estado === 'activo' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {a.estado}
                                </span>
                                <button
                                  onClick={() => setAnuncioEditando(a)}
                                  className="text-xs font-semibold border border-primary text-primary hover:bg-primary hover:text-white px-3 py-1 rounded-lg transition-colors"
                                >
                                  Editar anuncio
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Acciones */}
          <div className="border-t border-border pt-6 flex gap-3">
            <button
              onClick={toggle}
              disabled={cargando}
              className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                usuario.activo
                  ? 'bg-danger/10 hover:bg-danger/20 text-danger'
                  : 'bg-success/10 hover:bg-success/20 text-success'
              }`}
            >
              {cargando ? '…' : usuario.activo ? 'Desactivar' : 'Activar'}
            </button>
            <button
              onClick={onCerrar}
              className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg border border-border text-text hover:bg-background transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {anuncioEditando && (
        <ModalEditarAnuncio
          anuncio={anuncioEditando}
          usuario={usuario}
          onCerrar={() => setAnuncioEditando(null)}
          onGuardado={(anuncioActualizado) => {
            if (anuncioActualizado) {
              setDetalles((prev) => ({
                ...prev,
                anuncios: prev.anuncios.map((a) => a._id === anuncioActualizado._id ? anuncioActualizado : a),
              }));
            } else {
              setDetalles((prev) => ({
                ...prev,
                anuncios: prev.anuncios.filter((a) => a._id !== anuncioEditando._id),
              }));
            }
            setAnuncioEditando(null);
          }}
        />
      )}

      {/* Lightbox para ver imagen a tamaño completo */}
      {fotoFullscreen && (
        <div
          onClick={() => setFotoFullscreen(null)}
          className="fixed inset-0 z-101 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={imgUrl(fotoFullscreen)}
              alt="foto-completa"
              className="w-full h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setFotoFullscreen(null)}
              className="absolute -top-8 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Usuarios ─────────────────────────────────────────────────
function FilaUsuario({ usuario: u, onToggle, onVerDetalle }) {
  const inicial = u.nombre?.[0]?.toUpperCase() ?? '?';

  return (
    <tr
      onClick={() => onVerDetalle(u)}
      className="border-b border-border last:border-0 hover:bg-primary/5 transition-colors cursor-pointer"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden border border-primary/30">
            {u.fotoPerfil
              ? <img src={imgUrl(u.fotoPerfil)} alt={u.nombre} className="w-full h-full object-cover" />
              : inicial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">{u.nombre}</p>
            <p className="text-xs text-text-muted truncate">{u.email}</p>
          </div>
        </div>
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
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${u.activo ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
            {u.activo ? 'Activo' : 'Inactivo'}
          </span>
          <svg className="w-4 h-4 text-text-muted shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
      </td>
    </tr>
  );
}

function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

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
    setUsuarioSeleccionado((prev) => prev && prev._id === id ? { ...prev, activo } : prev);
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
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <FilaUsuario key={u._id} usuario={u} onToggle={actualizarActivo} onVerDetalle={setUsuarioSeleccionado} />
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

      {usuarioSeleccionado && (
        <ModalDetalleUsuario
          usuario={usuarioSeleccionado}
          onCerrar={() => setUsuarioSeleccionado(null)}
          onToggle={actualizarActivo}
        />
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
        ? <valid text="No hay agencies con reportes pendientes." />
        : lista.map((a) => (
            <TarjetaReportado key={a._id} anuncio={a} onGestionado={quitar} />
          ))}
    </div>
  );
}

// ── Tarjeta de pago (admin) ────────────────────────────────────────
function TarjetaPagoAdmin({ pago, onActualizado }) {
  const [modo, setModo]         = useState(null); // null | 'pagar' | 'disputa'
  const [valor, setValor]       = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  const liquidar = async () => {
    if (!valor.trim()) { setError('La referencia de la transferencia es requerida.'); return; }
    setError('');
    setCargando(true);
    try {
      const { data } = await api.patch(`/api/admin/payments/${pago._id}/pay-out`, { referenciaTransferencia: valor.trim() });
      onActualizado(pago._id, data.data);
      setModo(null);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al liquidar el pago.');
    } finally {
      setCargando(false);
    }
  };

  const resolver = async (resolucion) => {
    setError('');
    setCargando(true);
    try {
      const { data } = await api.patch(`/api/admin/payments/${pago._id}/resolve-dispute`, { resolucion });
      onActualizado(pago._id, data.data);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al resolver la disputa.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">{pago.solicitud?.descripcion ?? 'Servicio'}</p>
          <p className="text-xs text-text-muted mt-0.5">
            Cliente: {pago.cliente?.nombre ?? '—'} · Proveedor: {pago.proveedor?.nombre ?? '—'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Total: <span className="font-medium text-text">${pago.monto.toFixed(2)}</span>
            {' · '}Comisión: <span className="font-medium text-text">${pago.comisionMonto.toFixed(2)}</span>
            {' · '}A pagar al proveedor: <span className="font-semibold text-primary">${pago.montoProveedor.toFixed(2)}</span>
          </p>
          {pago.disputa?.motivo && (
            <p className="text-xs text-danger mt-1">Motivo de disputa: {pago.disputa.motivo}</p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize shrink-0 ${
          pago.estado === 'en_disputa' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
        }`}>
          {pago.estado.replace('_', ' ')}
        </span>
      </div>

      {error && <ErrorMsg texto={error} />}

      {pago.estado === 'liberado' && (
        modo !== 'pagar' ? (
          <button
            onClick={() => setModo('pagar')}
            className="text-xs font-semibold bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Marcar como pagado al proveedor
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Referencia de la transferencia bancaria"
              className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
            />
            <button
              onClick={liquidar}
              disabled={cargando}
              className="text-xs font-semibold bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {cargando ? '…' : 'Confirmar'}
            </button>
            <button
              onClick={() => { setModo(null); setError(''); }}
              className="text-xs font-semibold text-text-muted hover:text-text px-2 py-1.5 rounded-lg border border-border transition-colors"
            >
              Cancelar
            </button>
          </div>
        )
      )}

      {pago.estado === 'en_disputa' && (
        <div className="flex gap-2">
          <button
            onClick={() => resolver('liberar')}
            disabled={cargando}
            className="text-xs font-semibold bg-success/10 hover:bg-success/20 text-success px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            El servicio sí se cumplió — liberar al proveedor
          </button>
          <button
            onClick={() => resolver('reembolsar')}
            disabled={cargando}
            className="text-xs font-semibold bg-danger/10 hover:bg-danger/20 text-danger px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            Reembolsar al cliente
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab: Pagos (liquidación y disputas) ───────────────────────────
function TabPagos() {
  const [filtro, setFiltro]   = useState('liberado');
  const [lista, setLista]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/api/admin/payments', { params: { estado: filtro } })
      .then(({ data }) => setLista(data.data))
      .catch(() => setError('No se pudieron cargar los pagos.'))
      .finally(() => setLoading(false));
  }, [filtro]);

  const actualizar = useCallback((id, nuevo) => {
    setLista((prev) => prev.filter((p) => p._id !== id).concat(nuevo.estado === filtro ? [nuevo] : []));
  }, [filtro]);

  const FILTROS = [
    { value: 'liberado',   label: 'Listos para liquidar' },
    { value: 'en_disputa', label: 'Disputas' },
    { value: 'retenido',   label: 'Retenidos' },
    { value: 'pagado',     label: 'Pagados' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filtro === f.value ? 'bg-white text-primary' : 'bg-white/10 text-white/70 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <Skeleton /> : error ? <ErrorMsg texto={error} /> : lista.length === 0 ? (
        <Vacio texto="No hay pagos en este estado." />
      ) : (
        <div className="space-y-3">
          {lista.map((p) => <TarjetaPagoAdmin key={p._id} pago={p} onActualizado={actualizar} />)}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function AdminPage() {
  const { usuario } = useAuth();
  const [tabActiva, setTabActiva] = useState(0);

  if (!usuario?.roles?.includes('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-primary">
      <NavbarDashboard badge="Admin" />

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
        {tabActiva === 0 && <TabEstadisticas onNavigate={setTabActiva} />}
        {tabActiva === 1 && <TabVerificaciones />}
        {tabActiva === 2 && <TabUsuarios />}
        {tabActiva === 3 && <TabReportados />}
        {tabActiva === 4 && <TabPagos />}
      </div>
    </div>
  );
}
