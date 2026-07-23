// Estrellas de calificación: modo lectura (solo muestra) o interactivo (selección 1-5).
export default function Estrellas({ valor = 0, onChange, tamano = 'text-base', editable = false }) {
  const estrellas = [1, 2, 3, 4, 5];

  return (
    <div className={`flex items-center gap-0.5 ${tamano}`}>
      {estrellas.map((n) => (
        <button
          key={n}
          type="button"
          disabled={!editable}
          onClick={() => onChange?.(n)}
          className={`${editable ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
            n <= Math.round(valor) ? 'text-yellow-400' : 'text-gray-300'
          }`}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
