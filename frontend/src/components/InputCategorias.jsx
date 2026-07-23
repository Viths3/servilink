/* cSpell:disable */
import { useState, useRef, useEffect } from 'react';
import { CATEGORIAS } from '../lib/categorias';
import { normalizar, sugerirProfesiones } from '../lib/profesiones';

export default function InputCategorias({ value, onChange, placeholder = 'Buscar categoría...' }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const categoriaSeleccionada = CATEGORIAS.find((c) => c.value === value);

  // Además de filtrar por el nombre de la categoría general (ej. "Plomería"),
  // se acepta el nombre específico del oficio (ej. "Plomero", "Gasfitero")
  // para que un proveedor que no conoce cómo se llama la categoría igual
  // encuentre la correcta escribiendo su profesión.
  const termino = normalizar(busqueda);
  const categoriasPorOficio = new Set(sugerirProfesiones(busqueda, 20).map((p) => p.categoria));
  const filtradas = CATEGORIAS.filter(
    (c) => normalizar(c.label).includes(termino) || categoriasPorOficio.has(c.value)
  );

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const handleSeleccionar = (categoria) => {
    onChange(categoria.value);
    setBusqueda('');
    setAbierto(false);
  };

  const handleLimpiar = () => {
    onChange(null);
    setBusqueda('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={
            abierto
              ? busqueda
              : categoriaSeleccionada
              ? categoriaSeleccionada.label
              : ''
          }
          onChange={(e) => {
            setBusqueda(e.target.value);
            setAbierto(true);
            onChange(null);
          }}
          onFocus={() => setAbierto(true)}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
        />
        {value && (
          <button
            onClick={handleLimpiar}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            type="button"
            aria-label="Limpiar"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {abierto && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {filtradas.length > 0 ? (
            filtradas.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleSeleccionar(cat)}
                className="w-full px-4 py-2.5 text-left hover:bg-primary/5 transition-colors flex items-center gap-2 border-b border-border/50 last:border-0"
                type="button"
              >
                <img src={`/iconos/${cat.value}.png`} alt={cat.label} className="w-5 h-5" />
                <span className="text-sm text-text">{cat.label}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-text-muted text-center">
              Sin resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
}
