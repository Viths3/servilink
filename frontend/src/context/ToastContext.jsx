import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

const ICONOS = {
  success: (
    <svg className="w-5 h-5 text-success shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-danger shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
    </svg>
  ),
};

function ToastItem({ toast, onCerrar }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-surface border border-border rounded-2xl shadow-lg px-4 py-3.5 w-full max-w-sm animate-toast-in"
    >
      {ICONOS[toast.tipo]}
      <p className="text-sm text-text flex-1 leading-snug">{toast.mensaje}</p>
      <button
        onClick={() => onCerrar(toast.id)}
        aria-label="Cerrar"
        className="text-text-muted hover:text-text transition-colors shrink-0"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const cerrar = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback((mensaje, tipo = 'info', duracionMs = 4000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    if (duracionMs > 0) {
      setTimeout(() => cerrar(id), duracionMs);
    }
  }, [cerrar]);

  const toast = {
    success: (mensaje) => mostrar(mensaje, 'success'),
    error:   (mensaje) => mostrar(mensaje, 'error'),
    info:    (mensaje) => mostrar(mensaje, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-110 flex flex-col gap-2 items-end px-4 sm:px-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onCerrar={cerrar} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
