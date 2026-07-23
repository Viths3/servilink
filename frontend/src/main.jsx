import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Aplicar el tema guardado ANTES de renderizar para evitar el parpadeo
// blanco/oscuro. Si no hay preferencia guardada, respeta la del sistema.
const temaGuardado = localStorage.getItem('servilink_tema')
const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches
if (temaGuardado === 'oscuro' || (!temaGuardado && prefiereOscuro)) {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
