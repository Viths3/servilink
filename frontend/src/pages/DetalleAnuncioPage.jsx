import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const CATEGORIAS = {
  electricidad: 'Electricidad',
  plomeria:     'Plomería',
  medicina:     'Medicina',
  carpinteria:  'Carpintería',
  asesoria:     'Asesoría',
  otro:         'Otro',
};

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
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
        {proveedor?.fotoPerfil
          ? <img src={proveedor.fotoPerfil} alt={proveedor.nombre} className="w-full h-full rounded-full object-cover" />
          : inicial}
      </div>

      <div>
        <p className="font-semibold text-text text-base">{proveedor?.nombre ?? '—'}</p>
        {categoria && (
          <p className="text-xs text-text-muted mt-0.5">{categoria}</p>
        )}
      </div>

      {/* Badge verificado */}
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

// ── Página principal ──────────────────────────────────────────────
export default function DetalleAnuncioPage() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [anuncio, setAnuncio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
                {/* Chip de categoría */}
                <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {CATEGORIAS[anuncio.categoria] ?? anuncio.categoria}
                </span>

                {/* Título */}
                <h1 className="text-2xl sm:text-3xl font-bold text-text leading-snug">
                  {anuncio.titulo}
                </h1>

                {/* Precio */}
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

                {/* Descripción */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">
                    Descripción del servicio
                  </h2>
                  <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                    {anuncio.descripcion}
                  </p>
                </div>

                {/* Publicado el */}
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

                {/* CTA según autenticación */}
                {usuario ? (
                  <button
                    onClick={() => alert('Próximamente')}
                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Solicitar servicio
                  </button>
                ) : (
                  <LoginWall />
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
