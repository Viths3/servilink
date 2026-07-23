import { IconoEstrella } from './Iconos';

// Estrellas de calificación: modo lectura (solo muestra) o interactivo (selección 1-5).
const TAMANOS = {
  'text-xs':   'w-3.5 h-3.5',
  'text-sm':   'w-4 h-4',
  'text-base': 'w-5 h-5',
  'text-3xl':  'w-8 h-8',
};

export default function Estrellas({ valor = 0, onChange, tamano = 'text-base', editable = false }) {
  const clase = TAMANOS[tamano] ?? 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!editable}
          onClick={() => onChange?.(n)}
          className={`${editable ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
            n <= Math.round(valor) ? 'text-accent' : 'text-border'
          }`}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
        >
          <IconoEstrella className={clase} />
        </button>
      ))}
    </div>
  );
}
