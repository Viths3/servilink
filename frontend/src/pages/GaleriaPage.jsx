import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import Navbar from '../components/Navbar';
import TutorialBienvenida from '../components/TutorialBienvenida';
import { imgUrl } from '../lib/imageUrl';
import { CATEGORIAS, ICONOS_CATEGORIA } from '../lib/categorias';
import { sugerirProfesiones, buscarProfesionExacta } from '../lib/profesiones';
import { IconoLupa } from '../components/Iconos';

const LIMIT = 9;

// ── Tarjeta de anuncio — estilo Airbnb ────────────────────────────
function AnuncioCard({ anuncio }) {
  const labelCategoria = CATEGORIAS.find((c) => c.value === anuncio.categoria)?.label ?? anuncio.categoria;
  const fotos = anuncio.imagenes?.length ? anuncio.imagenes : anuncio.imagenUrl ? [anuncio.imagenUrl] : [];
  const [idx, setIdx]       = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef         = useRef(null);

  useEffect(() => {
    if (fotos.length <= 1 || paused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % fotos.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [fotos.length, paused]);

  return (
    <Link to={`/anuncios/${anuncio._id}`} className="group flex flex-col">
      {/* Imagen con esquinas redondeadas, sin borde de tarjeta */}
      <div
        className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-border"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {fotos.length > 0 ? (
          <>
            <img
              src={imgUrl(fotos[idx])}
              alt={anuncio.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {fotos.length > 1 && (
              <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
                {fotos.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-background flex items-center justify-center">
            <img src={ICONOS_CATEGORIA[anuncio.categoria]} alt={labelCategoria} className="w-14 h-14 opacity-70" loading="lazy" />
          </div>
        )}
        {/* Chip de categoría sobre la imagen */}
        <span className="absolute top-3 left-3 text-xs font-semibold text-gray-900 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full shadow-sm">
          {labelCategoria}
        </span>
      </div>

      {/* Texto debajo de la imagen, estilo Airbnb */}
      <div className="pt-3 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-text leading-snug line-clamp-1">
            {anuncio.titulo}
          </h3>
        </div>
        <p className="text-sm text-text-muted line-clamp-1">{anuncio.descripcion}</p>
        <div className="flex items-center gap-1.5 text-sm text-text-muted">
          <span className="truncate">{anuncio.proveedor?.nombre ?? 'Proveedor'}</span>
          <svg className="w-3.5 h-3.5 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          {anuncio.ratingPromedio > 0 && (
            <span className="flex items-center gap-0.5 shrink-0 text-text">
              <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
              </svg>
              {anuncio.ratingPromedio.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-[15px] pt-0.5">
          {anuncio.precioRef != null
            ? <><span className="font-semibold text-text">${anuncio.precioRef}</span> <span className="text-text-muted text-sm">precio referencial</span></>
            : <span className="text-text-muted text-sm">Precio a consultar</span>}
        </p>
      </div>
    </Link>
  );
}

// ── Paginación ────────────────────────────────────────────────────
function Paginacion({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-2 text-sm rounded-full border border-border text-text hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ← Anterior
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 text-sm rounded-full transition-colors ${
            p === page
              ? 'bg-text text-white font-semibold'
              : 'text-text-muted hover:bg-background'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-4 py-2 text-sm rounded-full border border-border text-text hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Siguiente →
      </button>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function GaleriaPage() {
  const [anuncios, setAnuncios]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [page, setPage]               = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [filtros, setFiltros]         = useState({ search: '', categoria: '', sort: 'recientes' });

  // Autocompletado de profesiones/oficios en el buscador
  const [sugerencias, setSugerencias]           = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceActivo, setIndiceActivo]         = useState(-1);
  const buscadorRef = useRef(null);

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const fetchAnuncios = useCallback(async (pagina, { search, categoria, sort }) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pagina, limit: LIMIT, sort: sort || 'recientes' };
      if (search)    params.search    = search;
      if (categoria) params.categoria = categoria;

      const { data } = await api.get('/api/announcements', { params });
      setAnuncios(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError('No se pudieron cargar los anuncios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnuncios(page, filtros);
  }, [page, filtros, fetchAnuncios]);

  // Cierra el dropdown de sugerencias al hacer clic fuera del buscador
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const handleCambioBusqueda = (valor) => {
    setSearchInput(valor);
    setIndiceActivo(-1);
    const encontradas = sugerirProfesiones(valor);
    setSugerencias(encontradas);
    setMostrarSugerencias(encontradas.length > 0);
  };

  // Busca directamente por la categoría de la profesión elegida: es más
  // confiable que el texto libre porque no depende de que el anuncio use
  // exactamente esa palabra en su título o descripción.
  const buscarPorProfesion = (profesion) => {
    setSearchInput(profesion.nombre);
    setMostrarSugerencias(false);
    setSugerencias([]);
    setPage(1);
    setFiltros((f) => ({ ...f, search: '', categoria: profesion.categoria }));
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    setMostrarSugerencias(false);
    const termino = searchInput.trim();

    // Si el texto coincide exactamente con una profesión conocida (aunque
    // el usuario no haya elegido la sugerencia del dropdown), se busca por
    // su categoría en vez de por texto libre, por la misma razón de arriba.
    const profesion = buscarProfesionExacta(termino);
    if (profesion) {
      buscarPorProfesion(profesion);
      return;
    }

    setPage(1);
    setFiltros((f) => ({ ...f, search: termino, categoria: '' }));
  };

  const handleTeclaBusqueda = (e) => {
    if (!mostrarSugerencias || sugerencias.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceActivo((i) => (i + 1) % sugerencias.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceActivo((i) => (i - 1 + sugerencias.length) % sugerencias.length);
    } else if (e.key === 'Enter' && indiceActivo >= 0) {
      e.preventDefault();
      buscarPorProfesion(sugerencias[indiceActivo]);
    } else if (e.key === 'Escape') {
      setMostrarSugerencias(false);
    }
  };

  const handleCategoria = (valor) => {
    setPage(1);
    setFiltros((f) => ({ ...f, categoria: f.categoria === valor ? '' : valor }));
  };

  const handleOrden = (valor) => {
    setPage(1);
    setFiltros((f) => ({ ...f, sort: valor }));
  };

  const handlePagina = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-surface">
      <TutorialBienvenida />
      <Navbar />

      {/* ── Hero estilo Apple: tipografía grande, fondo limpio ── */}
      <section className="pt-32 pb-10 px-4 text-center bg-surface">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-text max-w-3xl mx-auto leading-[1.1]">
          El profesional ideal,{' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-primary-light to-accent">
            a un clic
          </span>
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-text-muted max-w-xl mx-auto font-light">
          Servicios verificados en Cuenca. Pago protegido, reseñas reales.
        </p>

        {/* Buscador tipo píldora — estilo Airbnb, con autocompletado de oficios */}
        <div ref={buscadorRef} className="relative mt-9 max-w-xl mx-auto">
          <form
            onSubmit={handleBuscar}
            className="flex items-center bg-surface border border-border rounded-full shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/8 transition-shadow pl-6 pr-2 py-2"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleCambioBusqueda(e.target.value)}
              onFocus={() => { if (sugerencias.length > 0) setMostrarSugerencias(true); }}
              onKeyDown={handleTeclaBusqueda}
              placeholder="¿Qué servicio necesitas hoy? Ej: plomero, electricista..."
              autoComplete="off"
              role="combobox"
              aria-expanded={mostrarSugerencias}
              aria-autocomplete="list"
              className="flex-1 text-[15px] text-text placeholder-text-muted bg-transparent focus:outline-none min-w-0"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="shrink-0 w-11 h-11 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
            </button>
          </form>

          {mostrarSugerencias && sugerencias.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-lg z-50 overflow-hidden text-left">
              {sugerencias.map((prof, i) => (
                <li key={prof.nombre}>
                  <button
                    type="button"
                    onClick={() => buscarPorProfesion(prof)}
                    onMouseEnter={() => setIndiceActivo(i)}
                    className={`w-full px-5 py-2.5 flex items-center gap-3 text-left transition-colors ${
                      i === indiceActivo ? 'bg-primary/5' : 'hover:bg-background'
                    }`}
                  >
                    <img
                      src={ICONOS_CATEGORIA[prof.categoria]}
                      alt=""
                      className="w-5 h-5 shrink-0 opacity-80"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="text-sm text-text">{prof.nombre}</span>
                    <span className="ml-auto text-xs text-text-muted shrink-0">
                      {CATEGORIAS.find((c) => c.value === prof.categoria)?.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Categorías: fila de tiles con scroll — estilo PedidosYa ── */}
      <section id="galeria" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIAS.map((c) => {
            const activa = filtros.categoria === c.value;
            return (
              <button
                key={c.value}
                onClick={() => handleCategoria(c.value)}
                className={`shrink-0 flex flex-col items-center gap-1.5 w-20 py-3 rounded-2xl border transition-all ${
                  activa
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-transparent hover:border-border hover:bg-background'
                }`}
              >
                <img
                  src={ICONOS_CATEGORIA[c.value]}
                  className={`w-8 h-8 object-contain transition-opacity ${activa ? '' : 'opacity-75'}`}
                  alt={c.label}
                  onError={(e) => { e.target.style.display='none' }}
                />
                <span className={`text-[11px] font-medium leading-none ${activa ? 'text-primary' : 'text-text-muted'}`}>
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contador de resultados / orden / limpiar filtro */}
        {!loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
            <div className="flex items-center gap-3">
              <p className="text-sm text-text-muted">
                {total === 0
                  ? 'Sin resultados'
                  : `${total} servicio${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}`}
                {filtros.search && <> para <strong className="text-text">"{filtros.search}"</strong></>}
                {filtros.categoria && (
                  <> en <strong className="text-text">{CATEGORIAS.find((c) => c.value === filtros.categoria)?.label}</strong></>
                )}
              </p>
              {(filtros.categoria || filtros.search) && (
                <button
                  onClick={() => { setSearchInput(''); setPage(1); setFiltros({ search: '', categoria: '', sort: filtros.sort }); }}
                  className="text-xs font-medium text-text-muted underline hover:text-text transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {total > 0 && (
              <label className="flex items-center gap-2 text-sm text-text-muted">
                Ordenar por
                <select
                  value={filtros.sort}
                  onChange={(e) => handleOrden(e.target.value)}
                  className="text-sm text-text bg-surface border border-border rounded-full pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="calificacion">Mejor calificados</option>
                  <option value="precio_asc">Precio: menor a mayor</option>
                  <option value="precio_desc">Precio: mayor a menor</option>
                </select>
              </label>
            )}
          </div>
        )}
      </section>

      {/* ── Grid de anuncios ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-2xl aspect-[4/3] bg-border" />
                <div className="pt-3 space-y-2">
                  <div className="h-4 bg-border rounded w-3/4" />
                  <div className="h-3 bg-border rounded w-full" />
                  <div className="h-3 bg-border rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-danger text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchAnuncios(page, filtros)}
              className="text-sm text-primary underline"
            >
              Reintentar
            </button>
          </div>
        ) : anuncios.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4"><IconoLupa className="w-12 h-12 text-border" /></div>
            <p className="text-text font-semibold text-lg mb-2">Aún no hay servicios publicados</p>
            <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
              {filtros.categoria ? (
                <>¡Sé el primero en ofrecer tu servicio en esta categoría!</>
              ) : (
                <>Intenta con otra categoría o término de búsqueda.</>
              )}
            </p>
            <Link
              to="/registro-proveedor"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-full transition-colors"
            >
              Publicar mi servicio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9">
            {anuncios.map((a) => (
              <AnuncioCard key={a._id} anuncio={a} />
            ))}
          </div>
        )}

        <Paginacion page={page} totalPages={totalPages} onChange={handlePagina} />
      </main>

      {/* ── Banda CTA para proveedores ── */}
      <section className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text">
            ¿Ofreces un servicio profesional?
          </h2>
          <p className="mt-3 text-text-muted max-w-lg mx-auto">
            Publica gratis, recibe solicitudes y cobra en línea con protección de pago.
          </p>
          <Link
            to="/registro-proveedor"
            className="mt-7 inline-block px-8 py-3.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-full transition-colors"
          >
            Comenzar como proveedor
          </Link>
        </div>
      </section>

      {/* ── Footer minimalista — estilo Apple ── */}
      <footer className="bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} ServiLink · Cuenca, Ecuador</p>
          <div className="flex items-center gap-5">
            <Link to="/como-funciona" className="hover:text-text transition-colors">¿Cómo funciona?</Link>
            <Link to="/registro-proveedor" className="hover:text-text transition-colors">Ser proveedor</Link>
            <Link to="/login" className="hover:text-text transition-colors">Ingresar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
