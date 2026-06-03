import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Paso({ numero, titulo, descripcion }) {
  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
        {numero}
      </div>
      <div>
        <p className="text-base font-semibold text-text">{titulo}</p>
        <p className="text-sm text-text-muted mt-1 leading-relaxed">{descripcion}</p>
      </div>
    </div>
  );
}

function Ventaja({ icono, titulo, descripcion }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
        {icono}
      </div>
      <p className="text-base font-semibold text-text">{titulo}</p>
      <p className="text-sm text-text-muted leading-relaxed">{descripcion}</p>
    </div>
  );
}

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-28 pb-16 px-4 bg-primary text-white text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          ¿Cómo funciona ServiLink?
        </h1>
        <p className="text-primary-light text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Conectamos a profesionales verificados con personas que necesitan sus servicios en Cuenca, Ecuador.
        </p>
      </section>

      {/* ── Para clientes + Para proveedores ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Clientes */}
        <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-text">Para clientes</h2>
          </div>
          <div className="space-y-5">
            <Paso
              numero={1}
              titulo="Busca el servicio que necesitas"
              descripcion="Explora nuestra galería de profesionales verificados filtrando por categoría o usando el buscador."
            />
            <Paso
              numero={2}
              titulo="Contacta al proveedor verificado"
              descripcion="Revisa el perfil del proveedor, su categoría y precio referencial. Envía una solicitud directamente desde la plataforma."
            />
            <Paso
              numero={3}
              titulo="Confirma tu cita"
              descripcion="El proveedor acepta tu solicitud y coordina la fecha del servicio. Recibirás notificación inmediata."
            />
          </div>
        </div>

        {/* Proveedores */}
        <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 0 1 6 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 0 0-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25ZM10 10a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V11a1 1 0 0 0-1-1Z" clipRule="evenodd" />
                <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.1.644 4.313.992 6.61.992 2.297 0 4.51-.348 6.61-.992.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 0 1-9.274 0C3.985 17.585 3 16.402 3 15.055Z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-text">Para proveedores</h2>
          </div>
          <div className="space-y-5">
            <Paso
              numero={1}
              titulo="Regístrate y verifica tu identidad"
              descripcion="Crea tu cuenta como proveedor, sube tu cédula de identidad y espera la aprobación de nuestro equipo."
            />
            <Paso
              numero={2}
              titulo="Publica tus servicios"
              descripcion="Una vez verificado, crea anuncios con título, descripción, categoría y precio referencial para que los clientes te encuentren."
            />
            <Paso
              numero={3}
              titulo="Gestiona tus solicitudes"
              descripcion="Recibe solicitudes de clientes desde tu dashboard, acepta o rechaza, y coordina directamente los detalles del trabajo."
            />
          </div>
        </div>
      </section>

      {/* ── ¿Por qué ServiLink? ── */}
      <section className="bg-primary/4 border-y border-border py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-text text-center mb-10">¿Por qué ServiLink?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Ventaja
              icono={
                <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
              }
              titulo="Proveedores verificados"
              descripcion="Cada proveedor pasa por un proceso de verificación de identidad. Solo trabajas con profesionales reales y confiables."
            />
            <Ventaja
              icono={
                <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
                </svg>
              }
              titulo="Sin intermediarios"
              descripcion="El cliente contacta directamente al proveedor. Sin comisiones ocultas ni terceros que compliquen la coordinación."
            />
            <Ventaja
              icono={
                <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
                </svg>
              }
              titulo="Notificaciones por WhatsApp"
              descripcion="Tanto clientes como proveedores reciben actualizaciones en tiempo real sobre sus solicitudes vía WhatsApp."
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-lg mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-text">¿Listo para empezar?</h2>
          <p className="text-text-muted text-sm">Encuentra el servicio que necesitas o empieza a ofrecer los tuyos hoy mismo.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/"
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Explorar servicios
            </Link>
            <Link
              to="/registro"
              className="px-6 py-3 border border-primary text-primary hover:bg-primary/5 text-sm font-semibold rounded-lg transition-colors"
            >
              Registrarme gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="border-t border-border py-8 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} ServiLink — Cuenca, Ecuador
      </footer>
    </div>
  );
}
