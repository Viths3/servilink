import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

function PasoSimple({ numero, titulo, descripcion }) {
  return (
    <div className="flex gap-5">
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
        {numero}
      </div>
      <div>
        <p className="text-base font-semibold text-text">{titulo}</p>
        <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{descripcion}</p>
      </div>
    </div>
  );
}

function Tarjeta({ icono, titulo, descripcion }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
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

      {/* ── HERO ── */}
      <section className="pt-28 pb-20 px-4 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            ¿Cómo funciona ServiLink?
          </h1>
          <p className="text-white/80 text-base sm:text-lg leading-relaxed">
            En Cuenca, Ecuador, más del <span className="font-semibold text-white">60 % de trabajadores independientes</span> opera
            sin herramientas digitales. La contratación de servicios como plomería, electricidad
            o carpintería se da por referencias verbales o grupos de WhatsApp, sin ningún
            mecanismo de verificación de identidad. ServiLink cambia eso.
          </p>
        </div>
      </section>

      {/* ── EL PROBLEMA ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface border border-border rounded-2xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-danger" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text">El problema</h2>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              En la ciudad de Cuenca, la contratación de servicios del hogar y profesionales —
              plomería, electricidad, carpintería, medicina a domicilio y asesoría legal —
              se realiza sin ningún mecanismo formal de verificación. Los ciudadanos recurren
              a recomendaciones verbales o grupos de WhatsApp donde cualquier persona puede
              publicar sus servicios sin acreditar su identidad.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { titulo: 'Sin verificación de identidad', desc: 'Cualquiera puede ofrecer servicios sin comprobar quién es.' },
                { titulo: 'Riesgo de fraude', desc: 'Pagos adelantados a desconocidos sin garantía de cumplimiento.' },
                { titulo: 'Sin historial', desc: 'No existe forma de revisar el desempeño previo de un proveedor.' },
              ].map(({ titulo, desc }) => (
                <div key={titulo} className="bg-danger/5 border border-danger/15 rounded-xl p-4 space-y-1">
                  <p className="text-sm font-semibold text-danger">{titulo}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LA SOLUCIÓN — 3 PASOS ── */}
      <section className="bg-primary/4 border-y border-border py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-text">La solución — 3 pasos simples</h2>
            <p className="text-sm text-text-muted">Encontrar y contratar un profesional verificado nunca fue tan fácil.</p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-8 md:p-10 space-y-8">
            <PasoSimple
              numero={1}
              titulo="Encuentra"
              descripcion="Explora la galería de proveedores verificados. Filtra por categoría (plomería, electricidad, carpintería, medicina, asesoría) o busca por nombre o descripción del servicio."
            />
            <div className="border-t border-border" />
            <PasoSimple
              numero={2}
              titulo="Contrata"
              descripcion="Revisa el perfil del proveedor, su categoría y precio referencial. Envía una solicitud de servicio indicando tu descripción del trabajo y la fecha y hora que prefieras."
            />
            <div className="border-t border-border" />
            <PasoSimple
              numero={3}
              titulo="Confirma"
              descripcion="El proveedor acepta tu solicitud desde su panel. Recibirás confirmación y podrás coordinar los detalles finales directamente. Las notificaciones llegan por WhatsApp."
            />
          </div>
        </div>
      </section>

      {/* ── POR QUÉ VERIFICAMOS ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-text">¿Por qué verificamos a los proveedores?</h2>
            <p className="text-sm text-text-muted max-w-xl mx-auto">
              La verificación es el núcleo de ServiLink. Sin ella, la plataforma no sería diferente
              a un grupo de WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Tarjeta
              icono={
                <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                </svg>
              }
              titulo="Validación de cédula ecuatoriana"
              descripcion="Cada proveedor debe registrar su número de cédula de identidad ecuatoriana, que es validado con el algoritmo de módulo 10. No se puede crear una cuenta con una cédula inválida."
            />
            <Tarjeta
              icono={
                <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
              }
              titulo="Revisión administrativa"
              descripcion="El equipo de ServiLink revisa cada solicitud de registro antes de activar la cuenta. Solo proveedores aprobados aparecen en la plataforma y pueden publicar anuncios."
            />
            <Tarjeta
              icono={
                <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3.505 2.365A41.369 41.369 0 0 1 9 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 0 0-.577-.069 43.141 43.141 0 0 0-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 0 1 5 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914Z" />
                  <path d="M14 6c-.762 0-1.52.02-2.271.062C10.157 6.148 9 7.472 9 8.998v2.24c0 1.519 1.147 2.839 2.71 2.935.214.013.428.024.642.034.2.009.385.09.518.224l2.35 2.35a.75.75 0 0 0 1.28-.531v-2.07c1.453-.195 2.5-1.463 2.5-2.915V8.998c0-1.526-1.157-2.85-2.729-2.936A41.645 41.645 0 0 0 14 6Z" />
                </svg>
              }
              titulo="Estado visible en la plataforma"
              descripcion="Cada proveedor muestra una insignia 'Verificado' en su perfil y en los anuncios. Los clientes saben siempre si están tratando con alguien que pasó por el proceso de verificación."
            />
            <Tarjeta
              icono={
                <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.749Zm4.196 5.954a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 0 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
              }
              titulo="Suspensión ante reportes"
              descripcion="Los anuncios pueden ser reportados por los usuarios. Ante acumulación de reportes, el anuncio es suspendido y revisado por el equipo administrador."
            />
          </div>
        </div>
      </section>

      {/* ── PARA PROVEEDORES ── */}
      <section className="bg-primary/4 border-y border-border py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-text">Para proveedores de servicios</h2>
            <p className="text-sm text-text-muted max-w-xl mx-auto">
              ServiLink te da visibilidad digital sin costos adicionales. Llega a más clientes y gestiona tu trabajo desde un solo lugar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                paso: '01',
                titulo: 'Regístrate',
                desc: 'Crea tu cuenta de proveedor con tu cédula, categoría y foto de perfil. El equipo revisa tu solicitud.',
              },
              {
                paso: '02',
                titulo: 'Publica anuncios',
                desc: 'Una vez aprobado, crea anuncios con título, descripción, precio referencial e imagen del servicio.',
              },
              {
                paso: '03',
                titulo: 'Gestiona solicitudes',
                desc: 'Desde tu panel acepta, rechaza o reagenda solicitudes de clientes con un clic.',
              },
              {
                paso: '04',
                titulo: 'Recibe notificaciones',
                desc: 'Cada movimiento en tu cuenta genera una notificación por WhatsApp para que no pierdas ninguna oportunidad.',
              },
            ].map(({ paso, titulo, desc }) => (
              <div key={paso} className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                <span className="text-3xl font-black text-primary/20 leading-none">{paso}</span>
                <p className="text-sm font-semibold text-text">{titulo}</p>
                <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/registro-proveedor"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Registrarme como proveedor
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-lg mx-auto space-y-5">
          <h2 className="text-2xl font-bold text-text">¿Listo para empezar?</h2>
          <p className="text-text-muted text-sm leading-relaxed">
            Encuentra el servicio que necesitas con la seguridad de que cada proveedor ha sido verificado,
            o regístrate y empieza a ofrecer los tuyos hoy mismo.
          </p>
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
              Registrarme
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} ServiLink — Cuenca, Ecuador
      </footer>
    </div>
  );
}
