import Imagen from '../components/Imagen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import NavbarDashboard from '../components/NavbarDashboard';
import { imgUrl } from '../lib/imageUrl';

const fmtHora = (fecha) =>
  new Date(fecha).toLocaleTimeString('es-EC', { hour: 'numeric', minute: '2-digit' });

function Avatar({ usuario, tamano = 'w-10 h-10' }) {
  const inicial = (usuario?.nombre?.[0] ?? '?').toUpperCase();
  return (
    <div className={`${tamano} rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden`}>
      {usuario?.fotoPerfil
        ? <Imagen tipo="avatar" src={imgUrl(usuario.fotoPerfil)} alt={usuario.nombre} className="w-full h-full object-cover" />
        : inicial}
    </div>
  );
}

function ListaConversaciones({ conversaciones, activoId, onSeleccionar }) {
  if (conversaciones.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-text-muted">No tienes conversaciones aún.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-y-auto">
      {conversaciones.map((c) => (
        <button
          key={c.usuario._id}
          onClick={() => onSeleccionar(c.usuario)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-background transition-colors ${
            activoId === c.usuario._id ? 'bg-primary/5' : ''
          }`}
        >
          <Avatar usuario={c.usuario} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-text truncate">{c.usuario.nombre}</p>
              {c.ultimoMensaje && (
                <span className="text-xs text-text-muted shrink-0">{fmtHora(c.ultimoMensaje.createdAt)}</span>
              )}
            </div>
            <p className="text-xs text-text-muted truncate">{c.ultimoMensaje?.contenido}</p>
          </div>
          {c.noLeidos > 0 && (
            <span className="text-xs font-bold bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0">
              {c.noLeidos}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Hilo({ usuario, mensajes, miId, onEnviar }) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [mensajes]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await onEnviar(texto.trim());
      setTexto('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Avatar usuario={usuario} />
        <p className="text-sm font-semibold text-text">{usuario.nombre}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {mensajes.map((m) => {
          const esMio = (m.de?._id ?? m.de) === miId;
          return (
            <div key={m._id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                esMio ? 'bg-primary text-white rounded-br-sm' : 'bg-background text-text rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-line break-words">{m.contenido}</p>
                <p className={`text-[10px] mt-1 ${esMio ? 'text-white/70' : 'text-text-muted'}`}>{fmtHora(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      <form onSubmit={enviar} className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="text-sm font-semibold bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

export default function MensajesPage() {
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();
  const conId = searchParams.get('con');

  const [conversaciones, setConversaciones] = useState([]);
  const [contactoActivo, setContactoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarConversaciones = useCallback(() => {
    api.get('/api/messages/conversations')
      .then(({ data }) => setConversaciones(data.data))
      .catch(() => {});
  }, []);

  const abrirConversacion = useCallback((usuarioContacto) => {
    setContactoActivo(usuarioContacto);
    api.get(`/api/messages/${usuarioContacto._id}`)
      .then(({ data }) => {
        setMensajes(data.data);
        cargarConversaciones();
      })
      .catch(() => setMensajes([]));
  }, [cargarConversaciones]);

  useEffect(() => {
    cargarConversaciones();
    setLoading(false);
  }, [cargarConversaciones]);

  // Abrir conversación indicada por ?con=userId (ej. desde el dashboard)
  useEffect(() => {
    if (!conId || contactoActivo?._id === conId) return;
    api.get(`/api/messages/${conId}`)
      .then(({ data }) => {
        setContactoActivo(data.usuario);
        setMensajes(data.data);
        cargarConversaciones();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conId]);

  // Polling ligero de la conversación abierta y de la lista
  useEffect(() => {
    const intervalo = setInterval(() => {
      cargarConversaciones();
      if (contactoActivo) {
        api.get(`/api/messages/${contactoActivo._id}`)
          .then(({ data }) => setMensajes(data.data))
          .catch(() => {});
      }
    }, 4000);
    return () => clearInterval(intervalo);
  }, [contactoActivo, cargarConversaciones]);

  const enviarMensaje = async (contenido) => {
    const { data } = await api.post('/api/messages', { paraId: contactoActivo._id, contenido });
    setMensajes((prev) => [...prev, data.data]);
    cargarConversaciones();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavbarDashboard />
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden grid grid-cols-1 md:grid-cols-[300px_1fr] h-[75vh]">
          {/* Lista de conversaciones — en móvil se oculta cuando hay un chat abierto */}
          <div className={`border-r border-border flex-col overflow-hidden ${contactoActivo ? 'hidden md:flex' : 'flex'}`}>
            <div className="px-4 py-3 border-b border-border">
              <h1 className="text-sm font-bold text-text">Mensajes</h1>
            </div>
            {loading ? (
              <div className="p-4 text-sm text-text-muted">Cargando…</div>
            ) : (
              <ListaConversaciones
                conversaciones={conversaciones}
                activoId={contactoActivo?._id}
                onSeleccionar={abrirConversacion}
              />
            )}
          </div>

          {/* Hilo del chat — en móvil ocupa toda la pantalla con botón de volver */}
          <div className={`flex-col overflow-hidden ${contactoActivo ? 'flex' : 'hidden md:flex'}`}>
            {contactoActivo ? (
              <>
                <button
                  onClick={() => setContactoActivo(null)}
                  className="md:hidden flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border-b border-border text-left"
                >
                  ← Volver a conversaciones
                </button>
                <Hilo
                  usuario={contactoActivo}
                  mensajes={mensajes}
                  miId={usuario?.id}
                  onEnviar={enviarMensaje}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-text-muted">Selecciona una conversación para empezar a chatear.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
