/* cSpell:disable */
import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import NavbarDashboard from '../components/NavbarDashboard';
import InputCategorias from '../components/InputCategorias';
import { imgUrl } from '../lib/imageUrl';
import { CATEGORIAS } from '../lib/categorias';
import DateTimePicker from '../components/DateTimePicker';
import Estrellas from '../components/Estrellas';
import { IconoChat, IconoTarjeta, IconoCandado, IconoCheck, IconoAlerta, IconoEstrella } from '../components/Iconos';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

// ── Constantes ────────────────────────────────────────────────────
const ESTADO_STYLE = {
  pendiente:  'bg-yellow-100 text-yellow-800',
  aceptada:   'bg-success/10 text-success',
  rechazada:  'bg-danger/10 text-danger',
  reagendada: 'bg-primary/10 text-primary',
  completada: 'bg-border text-text-muted',
  cancelada:  'bg-border text-text-muted',
};

const CATEGORIAS_MAP = {
  electricidad: 'Electricidad', plomeria: 'Plomería',
  medicina: 'Medicina', carpinteria: 'Carpintería',
  asesoria: 'Asesoría', jardineria: 'Jardinería',
  limpieza: 'Limpieza', pintura: 'Pintura',
  mecanica: 'Mecánica', diseno: 'Diseño',
  fotografia: 'Fotografía', otro: 'Otro',
};

const fmt = (fecha) =>
  new Date(fecha).toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ── Piezas reutilizables ──────────────────────────────────────────
function BadgeEstado({ estado }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${ESTADO_STYLE[estado] ?? 'bg-border text-text-muted'}`}>
      {estado}
    </span>
  );
}

function Skeleton({ filas = 2 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="h-20 bg-border/60 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

function Vacio({ texto }) {
  return (
    <div className="bg-background border border-border rounded-2xl px-5 py-8 text-center">
      <p className="text-sm text-text-muted">{texto}</p>
    </div>
  );
}

// ── Bloque de contacto vía mensajería interna ─────────────────────
function BloqueContacto({ nombre, usuarioId }) {
  if (!usuarioId) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
      <p className="text-xs text-text-muted w-full">Contacta a {nombre}:</p>
      <Link
        to={`/mensajes?con=${usuarioId}`}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg transition-colors"
      >
        <IconoChat />
        Enviar mensaje
      </Link>
    </div>
  );
}


// ── Modal de pago simulado (pasarela local) ───────────────────────
function ModalPago({ pago, onCerrar, onPagado }) {
  const [numeroTarjeta, setNumeroTarjeta]     = useState('');
  const [nombreTitular, setNombreTitular]     = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [cvv, setCvv]                         = useState('');
  const [cargando, setCargando]               = useState(false);
  const [error, setError]                     = useState('');

  const pagar = async () => {
    setError('');
    setCargando(true);
    try {
      const { data } = await api.post(`/api/payments/${pago._id}/confirm`, {
        numeroTarjeta, nombreTitular, fechaExpiracion, cvv,
      });
      onPagado(data.data);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al procesar el pago.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-text">Pagar servicio</h2>
        <p className="text-2xl font-bold text-primary">${pago.monto.toFixed(2)}</p>
        <p className="text-xs text-text-muted -mt-2">Pasarela de pago local ServiLink (simulada)</p>

        <div className="space-y-3">
          <input
            type="text"
            value={numeroTarjeta}
            onChange={(e) => setNumeroTarjeta(e.target.value)}
            placeholder="Número de tarjeta (16 dígitos)"
            maxLength={19}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
          />
          <input
            type="text"
            value={nombreTitular}
            onChange={(e) => setNombreTitular(e.target.value)}
            placeholder="Nombre del titular"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
          />
          <div className="flex gap-3">
            <input
              type="text"
              value={fechaExpiracion}
              onChange={(e) => setFechaExpiracion(e.target.value)}
              placeholder="MM/AA"
              maxLength={5}
              className="w-1/2 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
            />
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="CVV"
              maxLength={4}
              className="w-1/2 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-1.5">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={pagar}
            disabled={cargando}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {cargando ? 'Procesando…' : `Pagar $${pago.monto.toFixed(2)}`}
          </button>
          <button
            onClick={onCerrar}
            className="flex-1 py-2.5 border border-border text-text-muted hover:text-text text-sm font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bloque de pago, vista CLIENTE (dentro de TarjetaEnviada) ──────
function PagoCliente({ solicitud, onUpdate }) {
  const [modalPago, setModalPago] = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState('');
  const toast = useToast();

  if (!solicitud.pago) return null;
  const { pago } = solicitud;

  const pagar = async () => {
    setError('');
    setCargando(true);
    try {
      const { data } = await api.post(`/api/payments/${pago._id}/pay`);
      if (data.modo === 'live') {
        window.location.href = data.urlPago;
        return;
      }
      setModalPago(true);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al iniciar el pago.');
    } finally {
      setCargando(false);
    }
  };

  const disputar = async () => {
    const motivo = window.prompt('Cuéntanos qué problema tuviste con este servicio:');
    if (!motivo?.trim()) return;
    try {
      const { data } = await api.post(`/api/payments/${pago._id}/disputar`, { motivo: motivo.trim() });
      onUpdate(solicitud._id, { pago: data.data });
      toast.success('Disputa registrada. Un administrador la revisará.');
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Error al registrar la disputa.');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-1.5">
      {modalPago && (
        <ModalPago
          pago={pago}
          onCerrar={() => setModalPago(false)}
          onPagado={(pagoActualizado) => {
            setModalPago(false);
            onUpdate(solicitud._id, { pago: pagoActualizado });
          }}
        />
      )}
      {(pago.estado === 'pendiente' || pago.estado === 'fallido') && (
        <>
          <button
            onClick={pagar}
            disabled={cargando}
            className={`text-xs font-semibold px-3.5 py-2 rounded-full transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 ${
              pago.estado === 'fallido' ? 'bg-danger/10 hover:bg-danger/20 text-danger' : 'bg-primary hover:bg-primary-dark text-white'
            }`}
          >
            {cargando ? '…' : pago.estado === 'fallido'
              ? <><IconoAlerta /> Pago rechazado — reintentar (${pago.monto.toFixed(2)})</>
              : <><IconoTarjeta /> Pagar ${pago.monto.toFixed(2)}</>}
          </button>
          {error && <p className="text-xs text-danger">{error}</p>}
        </>
      )}
      {pago.estado === 'retenido' && (
        <>
          <p className="text-xs text-primary font-medium">
            <IconoCandado className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />Pago retenido (${pago.monto.toFixed(2)}) — se libera al proveedor cuando el servicio se complete.
          </p>
          <button onClick={disputar} className="text-xs text-danger underline">Reportar un problema con este servicio</button>
        </>
      )}
      {pago.estado === 'liberado' && (
        <p className="text-xs text-success font-medium flex items-center gap-1"><IconoCheck />Servicio completado — pago liberado (${pago.monto.toFixed(2)})</p>
      )}
      {pago.estado === 'pagado' && (
        <p className="text-xs text-success font-medium flex items-center gap-1"><IconoCheck />Pagado (${pago.monto.toFixed(2)}) · Ref: {pago.referenciaTransferencia || pago.transaccionExternaId}</p>
      )}
      {pago.estado === 'en_disputa' && (
        <p className="text-xs text-danger font-medium flex items-center gap-1"><IconoAlerta />Disputa en revisión por un administrador</p>
      )}
    </div>
  );
}

// ── Responder a una disputa de pago (vista proveedor) ─────────────
function ResponderDisputa({ pago, onUpdate }) {
  const [texto, setTexto]         = useState('');
  const [evidencia, setEvidencia] = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState('');
  const [enviado, setEnviado]     = useState(false);

  if (pago.disputa?.respuestaProveedor || enviado) {
    return <p className="text-xs text-text-muted flex items-center gap-1"><IconoCheck />Ya respondiste a esta disputa. Un administrador la resolverá.</p>;
  }

  const enviar = async () => {
    setError('');
    if (!texto.trim()) { setError('Explica tu versión de lo ocurrido.'); return; }
    setCargando(true);
    try {
      const fd = new FormData();
      fd.append('texto', texto.trim());
      evidencia.forEach((file) => fd.append('evidencia', file));
      const { data } = await api.post(`/api/payments/${pago._id}/responder-disputa`, fd);
      onUpdate(data.data);
      setEnviado(true);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al enviar tu respuesta.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-danger font-medium">
        <IconoAlerta className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />El cliente reportó: "{pago.disputa?.motivo}" — puedes responder con tu versión y evidencia antes de que un admin decida.
      </p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        placeholder="Cuenta tu versión de lo ocurrido…"
        className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
      />
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => setEvidencia(Array.from(e.target.files ?? []).slice(0, 5))}
        className="w-full text-sm text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        onClick={enviar}
        disabled={cargando}
        className="text-xs font-semibold bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
      >
        {cargando ? 'Enviando…' : 'Enviar respuesta'}
      </button>
    </div>
  );
}

// ── Bloque de pago, vista PROVEEDOR (dentro de TarjetaRecibida) ───
function PagoProveedor({ solicitud, onUpdate }) {
  const [modo, setModo]         = useState(false);
  const [monto, setMonto]       = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  const puedeCobrar = ['aceptada', 'completada'].includes(solicitud.estado);
  if (!puedeCobrar) return null;

  if (solicitud.pago) {
    const { pago } = solicitud;
    return (
      <div className="mt-3 pt-3 border-t border-border">
        {(pago.estado === 'pendiente' || pago.estado === 'fallido') && (
          <p className="text-xs text-text-muted flex items-center gap-1"><IconoTarjeta />Cobro de ${pago.monto.toFixed(2)} pendiente de pago del cliente</p>
        )}
        {pago.estado === 'retenido' && (
          <p className="text-xs text-primary font-medium flex items-center gap-1"><IconoCandado />El cliente pagó — retenido hasta marcar el servicio como completado</p>
        )}
        {pago.estado === 'liberado' && (
          <p className="text-xs text-success font-medium">
            <IconoCheck className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />Liberado — recibirás ${pago.montoProveedor.toFixed(2)} (comisión ServiLink: ${pago.comisionMonto.toFixed(2)})
          </p>
        )}
        {pago.estado === 'pagado' && (
          <p className="text-xs text-success font-medium flex items-center gap-1"><IconoCheck />Pagado (${pago.montoProveedor.toFixed(2)}) · Ref: {pago.referenciaTransferencia}</p>
        )}
        {pago.estado === 'en_disputa' && (
          <ResponderDisputa pago={pago} onUpdate={(nuevoPago) => onUpdate(solicitud._id, { pago: nuevoPago })} />
        )}
      </div>
    );
  }

  const generarCobro = async () => {
    setError('');
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) { setError('Ingresa un monto válido.'); return; }
    setCargando(true);
    try {
      const { data } = await api.post('/api/payments', { solicitudId: solicitud._id, monto: montoNum });
      onUpdate(solicitud._id, { pago: data.data });
      setModo(false);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al generar el cobro.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      {!modo ? (
        <button
          onClick={() => setModo(true)}
          className="text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary px-3.5 py-2 rounded-full transition-colors inline-flex items-center gap-1"
        >
          <IconoTarjeta />Solicitar pago
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Monto en $"
              className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
            />
            <button
              onClick={generarCobro}
              disabled={cargando}
              className="text-xs font-semibold bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
            >
              {cargando ? '…' : 'Enviar'}
            </button>
            <button
              onClick={() => { setModo(false); setError(''); }}
              className="text-xs font-semibold text-text-muted hover:text-text px-2 py-1.5 rounded-full border border-border transition-colors"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}

// ── Modal para dejar reseña de una solicitud completada ───────────
function ModalResena({ solicitud, onCerrar, onEnviada }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [cargando, setCargando]     = useState(false);
  const [error, setError]           = useState('');

  const enviar = async () => {
    setError('');
    if (!puntuacion) { setError('Selecciona una puntuación.'); return; }
    setCargando(true);
    try {
      await api.post(`/api/service-requests/${solicitud._id}/review`, { puntuacion, comentario: comentario.trim() });
      onEnviada();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al enviar la reseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-text">Calificar servicio</h2>
        <p className="text-sm text-text-muted">
          {solicitud.proveedor?.nombre ?? 'El proveedor'} · {solicitud.anuncio?.titulo ?? solicitud.descripcion}
        </p>

        <div className="flex justify-center py-2">
          <Estrellas valor={puntuacion} onChange={setPuntuacion} editable tamano="text-3xl" />
        </div>

        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          placeholder="Cuéntanos tu experiencia (opcional)…"
          className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
        />

        {error && (
          <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-1.5">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={enviar}
            disabled={cargando}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {cargando ? 'Enviando…' : 'Enviar reseña'}
          </button>
          <button
            onClick={onCerrar}
            className="flex-1 py-2.5 border border-border text-text-muted hover:text-text text-sm font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta solicitud ENVIADA (vista cliente) ─────────────────────
function TarjetaEnviada({ solicitud, onUpdate }) {
  const [modalResena, setModalResena] = useState(false);
  const fecha = fmt(solicitud.fechaPropuesta);
  const mostrarWhatsApp = ['aceptada', 'reagendada'].includes(solicitud.estado);
  const puedeCalificar = solicitud.estado === 'completada' && !solicitud.calificada;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex items-start justify-between gap-4">
      {modalResena && (
        <ModalResena
          solicitud={solicitud}
          onCerrar={() => setModalResena(false)}
          onEnviada={() => { setModalResena(false); onUpdate(solicitud._id, { calificada: true }); }}
        />
      )}
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
        {mostrarWhatsApp && (
          <BloqueContacto
            nombre={solicitud.proveedor?.nombre}
            usuarioId={solicitud.proveedor?._id}
          />
        )}
        <PagoCliente solicitud={solicitud} onUpdate={onUpdate} />
        {solicitud.evidenciaCompletado?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-text-muted mb-1">Evidencia del proveedor:</p>
            <div className="flex gap-1.5 flex-wrap">
              {solicitud.evidenciaCompletado.map((path) => (
                <a key={path} href={imgUrl(path)} target="_blank" rel="noopener noreferrer">
                  <img src={imgUrl(path)} alt="Evidencia" className="w-14 h-14 object-cover rounded-lg border border-border" />
                </a>
              ))}
            </div>
          </div>
        )}
        {puedeCalificar && (
          <button
            onClick={() => setModalResena(true)}
            className="mt-2 text-xs font-semibold bg-accent/15 hover:bg-accent/25 text-primary px-3.5 py-2 rounded-full transition-colors inline-flex items-center gap-1"
          >
            <IconoEstrella />Dejar reseña
          </button>
        )}
        {solicitud.calificada && (
          <p className="text-xs text-text-muted mt-2 flex items-center gap-1"><IconoCheck />Ya calificaste este servicio</p>
        )}
      </div>
      <BadgeEstado estado={solicitud.estado} />
    </div>
  );
}

// ── Tarjeta solicitud RECIBIDA (vista proveedor) con acciones ─────
function TarjetaRecibida({ solicitud, onUpdate }) {
  const [modo, setModo]         = useState(null); // null | 'rechazar' | 'reagendar' | 'completar'
  const [valor, setValor]       = useState('');
  const [evidencia, setEvidencia] = useState([]); // File[]
  const [cargando, setCargando] = useState(false);
  const [errorAcc, setErrorAcc] = useState('');

  const cancelar = () => { setModo(null); setValor(''); setEvidencia([]); setErrorAcc(''); };

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
      const SLUG = { rechazar: 'reject', reagendar: 'reschedule' };
      const endpoint = `/api/service-requests/${solicitud._id}/${SLUG[modo]}`;
      const body = modo === 'rechazar'
        ? { motivoRechazo: valor.trim() }
        : { fechaPropuesta: valor };
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
  const puedeCompletar = solicitud.estado === 'aceptada';
  const mostrarWhatsApp = ['aceptada', 'reagendada'].includes(solicitud.estado);

  const completar = async () => {
    setCargando(true);
    setErrorAcc('');
    try {
      const fd = new FormData();
      evidencia.forEach((file) => fd.append('evidencia', file));
      const { data } = await api.patch(`/api/service-requests/${solicitud._id}/complete`, fd);
      onUpdate(solicitud._id, data.data);
      cancelar();
    } catch (err) {
      setErrorAcc(err.response?.data?.error ?? 'Error al marcar como completada.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
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
          {mostrarWhatsApp && (
            <BloqueContacto
              nombre={solicitud.cliente?.nombre}
              usuarioId={solicitud.cliente?._id}
            />
          )}
          <PagoProveedor solicitud={solicitud} onUpdate={onUpdate} />
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
        <DateTimePicker
          value={valor}
          onChange={setValor}
          min={new Date(Date.now() + 60000).toISOString()}
        />
      )}
      {modo === 'completar' && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            Opcional: adjunta fotos del trabajo terminado. Sirven como evidencia si el cliente disputa el pago más adelante.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => setEvidencia(Array.from(e.target.files ?? []).slice(0, 5))}
            className="w-full text-sm text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />
          {evidencia.length > 0 && (
            <p className="text-xs text-text-muted">{evidencia.length} foto(s) seleccionada(s)</p>
          )}
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
                className="text-xs font-semibold bg-success/10 hover:bg-success/20 text-success px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                {cargando ? '…' : 'Aceptar'}
              </button>
            )}
            {puedeAceptarRechazar && (
              <button
                onClick={() => setModo('rechazar')}
                className="text-xs font-semibold bg-danger/10 hover:bg-danger/20 text-danger px-3 py-1.5 rounded-full transition-colors"
              >
                Rechazar
              </button>
            )}
            {puedeReagendar && (
              <button
                onClick={() => setModo('reagendar')}
                className="text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors"
              >
                Reagendar
              </button>
            )}
            {puedeCompletar && (
              <button
                onClick={() => setModo('completar')}
                disabled={cargando}
                className="text-xs font-semibold bg-background border border-border hover:bg-border/50 text-text px-3.5 py-2 rounded-full transition-colors disabled:opacity-50 inline-flex items-center gap-1"
              >
                <IconoCheck />Marcar como completada
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={modo === 'completar' ? completar : ejecutar}
              disabled={cargando}
              className="text-xs font-semibold bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
            >
              {cargando ? 'Guardando…' : 'Confirmar'}
            </button>
            <button
              onClick={cancelar}
              className="text-xs font-semibold text-text-muted hover:text-text px-3 py-1.5 rounded-full border border-border transition-colors"
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
  const toast = useToast();
  const confirmar = useConfirm();

  const handleEliminar = async () => {
    const ok = await confirmar(`¿Eliminar el anuncio "${anuncio.titulo}"? Esta acción no se puede deshacer.`, {
      titulo: 'Eliminar anuncio',
      textoConfirmar: 'Eliminar',
      peligroso: true,
    });
    if (!ok) return;
    setEliminando(true);
    try {
      await api.delete(`/api/announcements/${anuncio._id}`);
      onEliminar(anuncio._id);
      toast.success('Anuncio eliminado.');
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Error al eliminar el anuncio.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex items-start justify-between gap-3">
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
            className="text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-full transition-colors"
          >
            Editar
          </button>
          <button
            onClick={handleEliminar}
            disabled={eliminando}
            className="text-xs font-semibold bg-danger/10 hover:bg-danger/20 text-danger px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <img src="https://cdn-icons-png.flaticon.com/128/17213/17213074.png" className="w-3 h-3" alt="eliminar" />
            {eliminando ? '…' : 'Eliminar'}
          </button>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
        anuncio.estado === 'activo' ? 'bg-success/10 text-success' :
        anuncio.estado === 'suspendido' ? 'bg-danger/10 text-danger' :
        'bg-border text-text-muted'
      }`}>
        {anuncio.estado}
      </span>
    </div>
  );
}

// ── Pestaña PROVEEDOR ─────────────────────────────────────────────
const ICONOS_CATEGORIA = {
  electricidad: 'https://cdn-icons-png.flaticon.com/128/3103/3103594.png',
  plomeria:     'https://cdn-icons-png.flaticon.com/128/8213/8213812.png',
  medicina:     'https://cdn-icons-png.flaticon.com/128/2902/2902069.png',
  carpinteria:  'https://cdn-icons-png.flaticon.com/128/1973/1973728.png',
  asesoria:     'https://cdn-icons-png.flaticon.com/128/1469/1469884.png',
  otro:         'https://cdn-icons-png.flaticon.com/128/10758/10758496.png',
};

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
  const [imagenesExistentes, setImagenesExistentes] = useState(anuncio?.imagenes ?? []);
  const [imagenesEliminar,   setImagenesEliminar]   = useState([]);
  const [imagenesNuevas,     setImagenesNuevas]     = useState([]);
  const [imagenError,        setImagenError]        = useState('');
  const [cargando,           setCargando]           = useState(false);
  const [errorMsg,           setErrorMsg]           = useState('');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCerrar]);

  const validarArchivoImagen = (archivo) => {
    // Validar tipo MIME
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      setImagenError(`${archivo.name}: Solo se permiten imágenes JPG, PNG o WebP`);
      return false;
    }

    // Validar extensión
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = archivo.name.split('.').pop().toLowerCase();
    if (!extensionesPermitidas.includes(extension)) {
      setImagenError(`${archivo.name}: Extensión no permitida`);
      return false;
    }

    // Validar tamaño (máx 5MB)
    const tamanioMaxMB = 5;
    if (archivo.size > tamanioMaxMB * 1024 * 1024) {
      setImagenError(`${archivo.name}: Archivo muy grande (máx ${tamanioMaxMB}MB)`);
      return false;
    }

    // Validar que no contenga caracteres peligrosos en el nombre
    if (/[<>:"|?*\\/]/.test(archivo.name)) {
      setImagenError(`${archivo.name}: Nombre de archivo contiene caracteres no permitidos`);
      return false;
    }

    return true;
  };

  const handleImagenes = (e) => {
    setImagenError('');
    const archivos = Array.from(e.target.files);
    if (!archivos.length) return;

    const archivosValidos = archivos.filter(validarArchivoImagen);
    if (archivosValidos.length === 0) {
      e.target.value = '';
      return;
    }

    setImagenesNuevas((prev) => [
      ...prev,
      ...archivosValidos.map((f) => ({ file: f, preview: URL.createObjectURL(f) })),
    ]);
    e.target.value = '';
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
    imagenesNuevas.forEach(({ file }) => fd.append('imagenes', file));
    if (imagenesEliminar.length) fd.append('imagenesEliminar', JSON.stringify(imagenesEliminar));

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
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
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
            <InputCategorias
              value={categoria}
              onChange={setCategoria}
              placeholder="Selecciona una categoría..."
            />
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

          {/* Imágenes con preview */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text">
              Imágenes del servicio <span className="text-text-muted font-normal">(opcional · JPG/PNG · máx. 5 MB · hasta 5)</span>
            </label>

            {(imagenesExistentes.length > 0 || imagenesNuevas.length > 0) && (
              <div className="grid grid-cols-3 gap-2">
                {imagenesExistentes.map((path) => (
                  <div key={path} className="relative">
                    <img src={imgUrl(path)} alt="" className="w-full h-24 object-cover rounded-lg border border-border" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagenesExistentes((prev) => prev.filter((p) => p !== path));
                        setImagenesEliminar((prev) => [...prev, path]);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-danger transition-colors"
                      title="Eliminar imagen"
                    >
                      <img src="https://cdn-icons-png.flaticon.com/128/17213/17213074.png" className="w-3 h-3" alt="eliminar" />
                    </button>
                  </div>
                ))}
                {imagenesNuevas.map(({ preview: prev }, i) => (
                  <div key={i} className="relative">
                    <img src={prev} alt="" className="w-full h-24 object-cover rounded-lg border border-border" />
                    <button
                      type="button"
                      onClick={() => setImagenesNuevas((arr) => arr.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-danger transition-colors"
                      title="Eliminar imagen"
                    >
                      <img src="https://cdn-icons-png.flaticon.com/128/17213/17213074.png" className="w-3 h-3" alt="eliminar" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleImagenes}
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
        <h2 className="text-base font-semibold text-text mb-3">Solicitudes recibidas</h2>
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
          <h2 className="text-base font-semibold text-text">Mis anuncios</h2>
          <button
            onClick={() => setModalAnuncio(false)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-dark px-3 py-1.5 rounded-full transition-colors"
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

  const actualizarSolicitud = useCallback((id, nueva) => {
    setEnviadas((prev) => prev.map((s) => (s._id === id ? { ...s, ...nueva } : s)));
  }, []);

  return (
    <section>
      <h2 className="text-base font-semibold text-text mb-3">Mis solicitudes enviadas</h2>
      {loading ? (
        <Skeleton />
      ) : enviadas.length === 0 ? (
        <Vacio texto="No tienes solicitudes enviadas aún." />
      ) : (
        <div className="space-y-3">
          {enviadas.map((s) => <TarjetaEnviada key={s._id} solicitud={s} onUpdate={actualizarSolicitud} />)}
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
    <div className="min-h-screen bg-background">
      <NavbarDashboard />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cabecera */}
        <div>
          <h1 className="text-2xl font-bold text-text">
            Hola, {usuario?.nombre?.split(' ')[0]}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {usuario?.roles?.map((r) => (
              <span key={r} className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full capitalize">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Pestañas — solo si tiene rol dual */}
        {rolDual && (
          <div className="flex gap-1 bg-border/50 p-1 rounded-full w-fit">
            {[
              { key: 'proveedor', label: 'Como proveedor' },
              { key: 'cliente',   label: 'Como cliente' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPestana(key)}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  pestana === key
                    ? 'bg-surface text-text shadow-sm'
                    : 'text-text-muted hover:text-text'
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
              className="text-sm font-medium border border-border hover:bg-background text-text px-4 py-2 rounded-full transition-colors bg-surface"
            >
              Explorar servicios
            </Link>
            {esCliente && !esProveedor && (
              <button
                onClick={() => navigate('/registro-proveedor', {
                  state: { nombre: usuario?.nombre, telefono: usuario?.telefono },
                })}
                className="text-sm font-medium bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-full transition-colors"
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
