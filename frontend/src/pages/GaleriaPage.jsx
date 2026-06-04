import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import ModalPerfil from '../components/ModalPerfil';
import { imgUrl } from '../lib/imageUrl';

const CATEGORIAS = [
  { value: 'electricidad', label: 'Electricidad', icon: 'https://cdn-icons-png.flaticon.com/128/3659/3659898.png' },
  { value: 'plomeria',     label: 'Plomería', icon: 'https://cdn-icons-png.flaticon.com/128/2038/2038854.png' },
  { value: 'medicina',     label: 'Medicina', icon: 'https://cdn-icons-png.flaticon.com/128/2382/2382533.png' },
  { value: 'carpinteria',  label: 'Carpintería', icon: 'https://cdn-icons-png.flaticon.com/128/1998/1998342.png' },
  { value: 'asesoria',     label: 'Asesoría', icon: 'https://cdn-icons-png.flaticon.com/128/1046/1046857.png' },
  { value: 'otro',         label: 'Otro', icon: 'https://cdn-icons-png.flaticon.com/128/1875/1875688.png' },
];

// ── Logo SVG Cúpulas Catedral ────────────────────────────────────
function LogoCatedral() {
  return (
    <svg className="w-5 h-5 inline-block" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 10C3 10 2 8 2 6C2 3 4 1 6 1C7 1 8 2 9 2C10 2 11 1 12 1C14 1 16 3 16 6C16 8 15 10 13 10"
            fill="currentColor" className="text-primary" />
      <path d="M5 10C4.5 10 4 12 4 13C4 14 5 15 6 15C7 15 8 14 9 14C10 14 11 15 12 15C13 15 14 14 14 13C14 12 13.5 10 13 10"
            fill="currentColor" className="text-accent" opacity="0.7" />
    </svg>
  );
}

const LIMIT = 9;

// ── Navbar ────────────────────────────────────────────────────────
function Navbar() {
  const { usuario, logout } = useAuth();
  const [abierto, setAbierto]         = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
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
          <a href="#galeria" className="text-sm text-text-muted hover:text-text transition-colors">
            Explorar
          </a>
          <Link to="/como-funciona" className="text-sm text-text-muted hover:text-text transition-colors">
            ¿Cómo funciona?
          </Link>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {usuario ? (
            /* ── Usuario autenticado: avatar + dropdown ── */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAbierto((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-background transition-colors"
              >
                {usuario.fotoPerfil
                  ? <img src={imgUrl(usuario.fotoPerfil)} className="w-8 h-8 rounded-full object-cover" alt={usuario.nombre} />
                  : <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                      {usuario.nombre?.[0]?.toUpperCase() ?? '?'}
                    </div>
                }
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

              {/* Dropdown */}
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
            /* ── Sin sesión: botones login / registro ── */
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

// ── Tarjeta de anuncio ────────────────────────────────────────────
function AnuncioCard({ anuncio }) {
  const categoriObj = CATEGORIAS.find((c) => c.value === anuncio.categoria);
  const labelCategoria = categoriObj?.label ?? anuncio.categoria;
  const iconoCategoria = categoriObj?.icon;
  const fotos = anuncio.imagenes?.length ? anuncio.imagenes : anuncio.imagenUrl ? [anuncio.imagenUrl] : [];
  const [idx, setIdx]     = useState(0);
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
    <Link
      to={`/anuncios/${anuncio._id}`}
      className="bg-surface rounded-xl border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden group"
    >
      {/* Imagen o placeholder con ícono de categoría */}
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {fotos.length > 0 ? (
          <>
            <img
              src={imgUrl(fotos[idx])}
              alt={anuncio.titulo}
              className="w-full h-40 object-cover"
            />
            {fotos.length > 1 && (
              <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1">
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
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
            {iconoCategoria ? (
              <img src={iconoCategoria} alt={labelCategoria} className="w-12 h-12" loading="lazy" />
            ) : (
              <span className="text-4xl font-bold text-gray-300">{labelCategoria?.[0]?.toUpperCase() ?? '?'}</span>
            )}
          </div>
        )}
      </div>

      {/* Cabecera con categoría */}
      <div className="px-5 pt-4 pb-2">
        <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {labelCategoria}
        </span>
      </div>

      <div className="px-5 pb-5 flex flex-col flex-1 gap-3">
        {/* Título */}
        <h3 className="text-base font-semibold text-text leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {anuncio.titulo}
        </h3>

        {/* Descripción */}
        <p className="text-sm text-text-muted line-clamp-2 flex-1">
          {anuncio.descripcion}
        </p>

        {/* Footer de tarjeta */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            {/* Avatar inicial */}
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
              {anuncio.proveedor?.nombre?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-xs text-text-muted truncate max-w-25">
              {anuncio.proveedor?.nombre ?? 'Proveedor'}
            </span>
            {/* Badge verificado */}
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Verificado
            </span>
          </div>

          {/* Precio */}
          {anuncio.precioRef != null ? (
            <span className="text-sm font-semibold text-primary">
              ${anuncio.precioRef}
            </span>
          ) : (
            <span className="text-xs text-text-muted italic">A consultar</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Paginación ────────────────────────────────────────────────────
function Paginacion({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 text-sm rounded-lg border border-border text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ← Anterior
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
            p === page
              ? 'bg-primary text-white border-primary font-semibold'
              : 'border-border text-text-muted hover:bg-border'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-2 text-sm rounded-lg border border-border text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
  const [catInput, setCatInput]       = useState('');
  const [filtros, setFiltros]         = useState({ search: '', categoria: '' });

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const navigate = useNavigate();

  const fetchAnuncios = useCallback(async (pagina, { search, categoria }) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pagina, limit: LIMIT };
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

  // Carga inicial y cada vez que cambian los filtros o la página
  useEffect(() => {
    fetchAnuncios(page, filtros);
  }, [page, filtros, fetchAnuncios]);

  const handleBuscar = (e) => {
    e.preventDefault();
    setPage(1);
    setFiltros({ search: searchInput.trim(), categoria: catInput });
  };

  const handleChip = (valor) => {
    const nueva = catInput === valor ? '' : valor;
    setCatInput(nueva);
    setPage(1);
    setFiltros({ search: searchInput.trim(), categoria: nueva });
  };

  const handlePagina = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero / Buscador — Inspirado en Cuenca */}
      <section className="pt-28 pb-12 px-4 bg-linear-to-br from-primary to-primary-dark text-white text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Conecta con los mejores profesionales de Cuenca
        </h1>
        <p className="text-primary-light text-sm sm:text-base mb-8 max-w-lg mx-auto">
          La plataforma de servicios independientes de la Atenas del Ecuador
        </p>

        {/* Barra de búsqueda */}
        <form
          onSubmit={handleBuscar}
          className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 mb-6"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="¿Qué servicio buscas?"
            className="flex-1 px-4 py-3 rounded-lg text-text bg-surface placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <select
            value={catInput}
            onChange={(e) => setCatInput(e.target.value)}
            className="sm:w-44 px-4 py-3 rounded-lg text-text bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-6 py-3 bg-white text-primary font-semibold text-sm rounded-lg hover:bg-primary-light hover:text-white transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Frase inspiradora */}
        <p className="text-sm text-primary-light/90 italic max-w-md mx-auto">
          "Más de 60% de profesionales independientes en Cuenca ahora tienen voz digital"
        </p>
      </section>

      {/* Chips de categoría con íconos de Flaticon */}
      <section id="galeria" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <button
              key={c.value}
              onClick={() => handleChip(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 transition-colors ${
                filtros.categoria === c.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-text-muted border-border hover:border-primary hover:text-primary'
              }`}
            >
              <img src={c.icon} alt={c.label} className="w-5 h-5" loading="lazy" />
              {c.label}
            </button>
          ))}
          {filtros.categoria && (
            <button
              onClick={() => handleChip(filtros.categoria)}
              className="px-4 py-1.5 rounded-full text-sm font-medium text-danger border border-danger/40 hover:bg-danger/5 transition-colors"
            >
              Limpiar filtro ✕
            </button>
          )}
        </div>

        {/* Contador de resultados */}
        {!loading && (
          <p className="mt-4 text-sm text-text-muted">
            {total === 0
              ? 'Sin resultados'
              : `${total} anuncio${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
            {filtros.search && <> para <strong>"{filtros.search}"</strong></>}
            {filtros.categoria && (
              <> en <strong>{CATEGORIAS.find((c) => c.value === filtros.categoria)?.label}</strong></>
            )}
          </p>
        )}
      </section>

      {/* Grid de anuncios */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border h-52 animate-pulse" />
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
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-text font-semibold text-lg mb-1">No hay anuncios disponibles</p>
            <p className="text-text-muted text-sm">
              Intenta con otra categoría o término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {anuncios.map((a) => (
              <AnuncioCard key={a._id} anuncio={a} />
            ))}
          </div>
        )}

        <Paginacion page={page} totalPages={totalPages} onChange={handlePagina} />
      </main>

      {/* Footer — Identidad Cuencana */}
      <footer className="border-t border-border py-8 text-center text-xs text-text-muted">
        <p>© {new Date().getFullYear()} ServiLink — Cuenca, Ecuador 🏔️</p>
        <p className="mt-1 text-primary-light">Conectando la Atenas del Ecuador</p>
      </footer>
    </div>
  );
}
