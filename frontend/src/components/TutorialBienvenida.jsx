import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'servilink_tutorial_visto';

const PASOS = [
  {
    emoji: '🏛️',
    titulo: 'Bienvenido a ServiLink',
    texto: 'En Cuenca, contratar un plomero, electricista o profesional confiable dependía del boca a boca. ServiLink existe para cambiar eso: cada proveedor pasa por verificación de identidad con su cédula antes de poder ofrecer servicios.',
  },
  {
    emoji: '🔍',
    titulo: 'Busca y solicita',
    texto: 'Explora servicios por categoría o con el buscador. Cuando encuentres al profesional ideal, envíale una solicitud indicando qué necesitas y la fecha que prefieras. Él la acepta, la reagenda o te responde.',
  },
  {
    emoji: '💬',
    titulo: 'Coordina por chat',
    texto: 'Todo se conversa dentro de la app con la mensajería interna — sin compartir tu número. Además recibirás recordatorios por WhatsApp de tus citas próximas y acciones pendientes.',
  },
  {
    emoji: '🔒',
    titulo: 'Paga protegido y califica',
    texto: 'Tu pago queda retenido por ServiLink y solo se libera al proveedor cuando el servicio se completa. Si algo sale mal, puedes abrir una disputa. Al final, deja tu reseña para ayudar a otros.',
  },
];

export default function TutorialBienvenida() {
  const [visible, setVisible] = useState(false);
  const [paso, setPaso]       = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const cerrar = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const esUltimo = paso === PASOS.length - 1;
  const { emoji, titulo, texto } = PASOS[paso];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Zona visual */}
        <div className="bg-linear-to-br from-primary/8 via-accent/10 to-secondary/8 py-12 flex items-center justify-center">
          <span className="text-7xl select-none">{emoji}</span>
        </div>

        <div className="p-7 space-y-4">
          {/* Indicadores de paso */}
          <div className="flex justify-center gap-1.5">
            {PASOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setPaso(i)}
                aria-label={`Paso ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === paso ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`}
              />
            ))}
          </div>

          <div className="text-center space-y-2 min-h-31">
            <h2 className="text-xl font-bold text-text tracking-tight">{titulo}</h2>
            <p className="text-sm text-text-muted leading-relaxed">{texto}</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={cerrar}
              className="text-sm text-text-muted hover:text-text transition-colors px-2"
            >
              Omitir
            </button>
            <div className="flex-1" />
            {paso > 0 && (
              <button
                onClick={() => setPaso((p) => p - 1)}
                className="text-sm font-semibold text-text px-4 py-2.5 rounded-full border border-border hover:bg-background transition-colors"
              >
                Atrás
              </button>
            )}
            {esUltimo ? (
              <button
                onClick={cerrar}
                className="text-sm font-semibold bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full transition-colors"
              >
                ¡Empezar!
              </button>
            ) : (
              <button
                onClick={() => setPaso((p) => p + 1)}
                className="text-sm font-semibold bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full transition-colors"
              >
                Siguiente
              </button>
            )}
          </div>

          {esUltimo && (
            <p className="text-center text-xs text-text-muted">
              ¿Quieres más detalle?{' '}
              <Link to="/como-funciona" onClick={cerrar} className="text-primary font-medium hover:underline">
                Ver la guía completa
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
