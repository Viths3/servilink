import { useEffect, useRef, useState } from 'react';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const DIAS_SHORT = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

function formatDisplay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0')
  );
}

function IconChevronUp() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z" clipRule="evenodd" />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

// value: ISO string | ''
// onChange: (isoString) => void
// min: ISO string or datetime-local string — fecha mínima seleccionable
export default function DateTimePicker({ value, onChange, min }) {
  const [open, setOpen]           = useState(false);
  const [placement, setPlacement] = useState('bottom'); // 'bottom' | 'top'
  const containerRef              = useRef(null);

  const minDate = min ? new Date(min) : new Date();

  // Estado temporal mientras el dropdown está abierto
  const [viewYear,  setViewYear]  = useState(minDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(minDate.getMonth());
  const [tempDay,   setTempDay]   = useState(null);
  const [tempHour,  setTempHour]  = useState(9);
  const [tempMin,   setTempMin]   = useState(0);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openPicker = () => {
    const base = value ? new Date(value) : minDate;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setTempDay(value ? base.getDate() : null);
    setTempHour(value ? base.getHours() : 9);
    setTempMin(value ? Math.floor(base.getMinutes() / 5) * 5 : 0);

    // Decide si abrir hacia abajo o hacia arriba según el espacio disponible en pantalla,
    // para que no quede flotando lejos del campo dentro de un modal.
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const ALTURA_ESTIMADA = 420;
      const espacioAbajo = window.innerHeight - rect.bottom;
      const espacioArriba = rect.top;
      setPlacement(
        espacioAbajo >= ALTURA_ESTIMADA || espacioAbajo >= espacioArriba ? 'bottom' : 'top'
      );
    }

    setOpen(true);
  };

  const confirm = () => {
    if (tempDay === null) return;
    onChange(new Date(viewYear, viewMonth, tempDay, tempHour, tempMin, 0).toISOString());
    setOpen(false);
  };

  // Primer día de la semana (lunes = 0)
  const firstWeekday = () => (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isDayDisabled = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    const m = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return d < m;
  };

  const isToday = (day) => {
    const t = new Date();
    return viewYear === t.getFullYear() && viewMonth === t.getMonth() && day === t.getDate();
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const changeHour = (d) => setTempHour((h) => (h + d + 24) % 24);
  const changeMin  = (d) => setTempMin((m) => (m + d + 60) % 60);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={openPicker}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
      >
        {value
          ? <span className="text-text">{formatDisplay(value)}</span>
          : <span className="text-text-muted">Selecciona fecha y hora…</span>
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute right-0 z-9999 bg-white rounded-xl shadow-xl border border-border p-4 space-y-3 w-72 max-h-[80vh] overflow-y-auto ${
            placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >

          {/* Navegación de mes */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={prevMonth}
              className="p-1.5 hover:bg-border rounded-lg transition-colors">
              <svg className="w-4 h-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-text">
              {MESES[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth}
              className="p-1.5 hover:bg-border rounded-lg transition-colors">
              <svg className="w-4 h-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-0.5">
            {DIAS_SHORT.map((d) => (
              <div key={d} className="text-center text-xs text-text-muted font-medium py-1">{d}</div>
            ))}
            {Array.from({ length: firstWeekday() }).map((_, i) => (
              <div key={`gap-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const disabled  = isDayDisabled(day);
              const selected  = tempDay === day;
              const todayFlag = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => setTempDay(day)}
                  className={[
                    'text-xs aspect-square rounded-lg flex items-center justify-center transition-colors',
                    disabled  ? 'text-gray-300 cursor-not-allowed'            : '',
                    selected  ? 'bg-primary text-white font-semibold'          : '',
                    todayFlag && !selected
                              ? 'border border-primary text-primary font-semibold' : '',
                    !disabled && !selected && !todayFlag
                              ? 'hover:bg-border text-text'                   : '',
                  ].join(' ')}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Selector de hora */}
          <div className="border-t border-border pt-3 flex items-center justify-center gap-5">
            {/* Horas */}
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={() => changeHour(1)}
                className="p-1.5 hover:bg-border rounded-lg transition-colors text-text-muted hover:text-text">
                <IconChevronUp />
              </button>
              <span className="text-base font-mono font-bold text-text w-8 text-center select-none">
                {String(tempHour).padStart(2, '0')}
              </span>
              <button type="button" onClick={() => changeHour(-1)}
                className="p-1.5 hover:bg-border rounded-lg transition-colors text-text-muted hover:text-text">
                <IconChevronDown />
              </button>
              <span className="text-xs text-text-muted">hh</span>
            </div>

            <span className="text-xl font-bold text-text-muted mb-4">:</span>

            {/* Minutos (saltos de 5) */}
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={() => changeMin(5)}
                className="p-1.5 hover:bg-border rounded-lg transition-colors text-text-muted hover:text-text">
                <IconChevronUp />
              </button>
              <span className="text-base font-mono font-bold text-text w-8 text-center select-none">
                {String(tempMin).padStart(2, '0')}
              </span>
              <button type="button" onClick={() => changeMin(-5)}
                className="p-1.5 hover:bg-border rounded-lg transition-colors text-text-muted hover:text-text">
                <IconChevronDown />
              </button>
              <span className="text-xs text-text-muted">mm</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2 text-sm border border-border rounded-lg text-text-muted hover:text-text transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={tempDay === null}
              className="flex-1 py-2 text-sm bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg disabled:opacity-40 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
