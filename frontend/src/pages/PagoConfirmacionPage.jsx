import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import NavbarDashboard from '../components/NavbarDashboard';

// Página a la que PayPhone redirige tras el checkout hospedado.
// El resultado del pago se confirma SIEMPRE contra el backend (que a su vez
// verifica server-a-servidor con PayPhone) — nunca se confía en esta URL sola.
export default function PagoConfirmacionPage() {
  const { pagoId } = useParams();
  const [searchParams] = useSearchParams();
  const [estado, setEstado] = useState('verificando'); // verificando | ok | error
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const transactionId = searchParams.get('id');
    const clientTransactionId = searchParams.get('clientTransactionId');

    if (!transactionId || !clientTransactionId) {
      setEstado('error');
      setMensaje('No se recibió información de la transacción. Si ya pagaste, revisa el estado en tu panel.');
      return;
    }

    api.post(`/api/payments/${pagoId}/confirmar-payphone`, { transactionId, clientTransactionId })
      .then(() => {
        setEstado('ok');
        setMensaje('Pago confirmado. El dinero quedará retenido por ServiLink hasta que el servicio se complete.');
      })
      .catch((err) => {
        setEstado('error');
        setMensaje(err.response?.data?.error ?? 'No se pudo confirmar el pago.');
      });
  }, [pagoId, searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <NavbarDashboard />
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-surface border border-border rounded-3xl shadow-sm p-8 space-y-4">
          {estado === 'verificando' && (
            <>
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-sm text-text-muted">Verificando el resultado de tu pago…</p>
            </>
          )}
          {estado === 'ok' && (
            <>
              <p className="text-3xl">✓</p>
              <p className="text-sm text-text">{mensaje}</p>
            </>
          )}
          {estado === 'error' && (
            <>
              <p className="text-3xl">⚠</p>
              <p className="text-sm text-danger">{mensaje}</p>
            </>
          )}
          <Link
            to="/dashboard"
            className="inline-block mt-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full transition-colors"
          >
            Volver a mi dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
