import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
// useConfirm()(mensaje, { titulo, textoConfirmar, peligroso }) devuelve una
// Promise<boolean> — reemplaza a window.confirm() con un modal consistente
// con el resto de la app.
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}

export function ConfirmProvider({ children }) {
  const [estado, setEstado] = useState(null); // null | { mensaje, opciones }
  const resolverRef = useRef(null);

  const confirmar = useCallback((mensaje, opciones = {}) => {
    setEstado({ mensaje, opciones });
    return new Promise((resolve) => { resolverRef.current = resolve; });
  }, []);

  const cerrar = (resultado) => {
    resolverRef.current?.(resultado);
    setEstado(null);
  };

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {estado && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) cerrar(false); }}
          className="fixed inset-0 z-110 flex items-center justify-center bg-black/50 px-4"
        >
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-text">
              {estado.opciones.titulo ?? 'Confirmar acción'}
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">{estado.mensaje}</p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => cerrar(false)}
                className="flex-1 py-2.5 border border-border text-text-muted hover:text-text text-sm font-semibold rounded-full transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => cerrar(true)}
                className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-full transition-colors ${
                  estado.opciones.peligroso
                    ? 'bg-danger hover:bg-danger/85'
                    : 'bg-primary hover:bg-primary-dark'
                }`}
              >
                {estado.opciones.textoConfirmar ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
