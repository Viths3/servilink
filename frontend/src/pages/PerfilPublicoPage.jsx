import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/axios';
import Navbar from '../components/Navbar';
import { imgUrl } from '../lib/imageUrl';

const CATEGORIAS = {
  electricidad: 'Electricidad',
  plomeria:     'Plomería',
  medicina:     'Medicina',
  carpinteria:  'Carpintería',
  asesoria:     'Asesoría',
  otro:         'Otro',
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-5">
        <div className="w-24 h-24 rounded-full bg-border shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-border rounded w-1/2" />
          <div className="h-3 bg-border rounded w-1/4" />
        </div>
      </div>
      <div className="h-4 bg-border rounded" />
      <div className="h-4 bg-border rounded w-5/6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => <div key={i} className="h-32 bg-border rounded-xl" />)}
      </div>
    </div>
  );
}

function TarjetaAnuncio({ anuncio }) {
  const label = CATEGORIAS[anuncio.categoria] ?? anuncio.categoria;
  const inicial = (label?.[0] ?? '?').toUpperCase();

  return (
    <Link
      to={`/anuncios/${anuncio._id}`}
      className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group"
    >
      {anuncio.imagenUrl ? (
        <img src={imgUrl(anuncio.imagenUrl)} alt={anuncio.titulo} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
          <span className="text-4xl font-bold text-gray-300">{inicial}</span>
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
          {label}
        </span>
        <h3 className="text-sm font-semibold text-text group-hover:text-primary transition-colors line-clamp-2">
          {anuncio.titulo}
        </h3>
        <p className="text-xs text-text-muted line-clamp-2 flex-1">{anuncio.descripcion}</p>
        <div className="pt-2 border-t border-border">
          {anuncio.precioRef != null
            ? <span className="text-sm font-bold text-primary">${anuncio.precioRef}</span>
            : <span className="text-xs text-text-muted italic">A consultar</span>}
        </div>
      </div>
    </Link>
  );
}

export default function PerfilPublicoPage() {
  const { id } = useParams();
  const [perfil, setPerfil]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get(`/api/users/${id}/public`)
      .then(({ data }) => { if (!cancelled) setPerfil(data.data); })
      .catch(() => { if (!cancelled) setError('No se pudo cargar el perfil.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const esProv     = perfil?.roles?.includes('proveedor');
  const verificado = perfil?.providerData?.verificationStatus === 'aprobado';
  const categoria  = CATEGORIAS[perfil?.providerData?.categoria] ?? '';
  const inicial    = perfil?.nombre?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs text-text-muted">
            <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-text">Perfil del proveedor</span>
          </nav>
        </div>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
          {loading ? (
            <Skeleton />
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-danger text-sm mb-4">{error}</p>
              <Link to="/" className="text-sm text-primary underline">Volver al inicio</Link>
            </div>
          ) : perfil ? (
            <>
              {/* ── Cabecera de perfil ── */}
              <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shrink-0 overflow-hidden border-2 border-border">
                  {perfil.fotoPerfil
                    ? <img src={imgUrl(perfil.fotoPerfil)} alt={perfil.nombre} className="w-full h-full object-cover" />
                    : inicial}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-text">{perfil.nombre}</h1>
                    {verificado && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                        Verificado
                      </span>
                    )}
                  </div>

                  {esProv && categoria && (
                    <p className="text-sm text-text-muted">{categoria}</p>
                  )}

                  {perfil.solicitudesCompletadas > 0 && (
                    <p className="text-xs text-text-muted">
                      <span className="font-semibold text-text">{perfil.solicitudesCompletadas}</span>{' '}
                      {perfil.solicitudesCompletadas === 1 ? 'servicio completado' : 'servicios completados'}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Descripción profesional ── */}
              {esProv && perfil.providerData?.descripcion && (
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">
                    Acerca de mí
                  </h2>
                  <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                    {perfil.providerData.descripcion}
                  </p>
                </div>
              )}

              {/* ── Anuncios activos ── */}
              {esProv && (
                <section>
                  <h2 className="text-base font-semibold text-text mb-4">
                    Servicios disponibles
                    {perfil.anuncios?.length > 0 && (
                      <span className="ml-2 text-xs font-medium text-text-muted">
                        ({perfil.anuncios.length})
                      </span>
                    )}
                  </h2>

                  {!perfil.anuncios?.length ? (
                    <div className="bg-surface border border-border rounded-xl px-5 py-10 text-center">
                      <p className="text-sm text-text-muted">Este proveedor aún no tiene anuncios publicados.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {perfil.anuncios.map((a) => (
                        <TarjetaAnuncio key={a._id} anuncio={a} />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
