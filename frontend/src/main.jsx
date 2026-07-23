import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Tema: el valor por defecto es SIEMPRE claro. Si el usuario nunca eligió
// un tema manualmente (no hay nada guardado), la página se adapta al modo
// claro/oscuro del sistema operativo del dispositivo — incluso en vivo, si
// el usuario cambia el tema de su SO mientras navega, sin recargar.
// En cuanto el usuario toca el botón de sol/luna, esa elección manual
// queda guardada y ya no vuelve a seguir al sistema.
const mediaOscuro = window.matchMedia('(prefers-color-scheme: dark)')

const aplicarTema = () => {
  const temaGuardado = localStorage.getItem('servilink_tema')
  const oscuro = temaGuardado === 'oscuro' || (!temaGuardado && mediaOscuro.matches)
  document.documentElement.classList.toggle('dark', oscuro)
}

aplicarTema()
mediaOscuro.addEventListener('change', () => {
  if (!localStorage.getItem('servilink_tema')) aplicarTema()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
