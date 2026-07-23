import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { imgUrl } from '../lib/imageUrl';
import { normalizeTel } from '../lib/telefono';

export default function ModalPerfil({ onCerrar }) {
  const { usuario, actualizarUsuario } = useAuth();
  const overlayRef = useRef(null);

  // ── Sección A: Foto ───────────────────────────────────────────
  const [foto, setFoto]             = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoError, setFotoError]   = useState('');
  const [fotoExito, setFotoExito]   = useState('');
  const [fotoLoading, setFotoLoading] = useState(false);
  const [fotoFullscreen, setFotoFullscreen] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false);

  // ── Sección B: Datos ──────────────────────────────────────────
  const [nombre, setNombre]             = useState(usuario?.nombre ?? '');
  const [telefonoInput, setTelefonoInput] = useState(usuario?.telefono ?? '');
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva]   = useState('');
  const [datosError, setDatosError]     = useState('');
  const [datosExito, setDatosExito]     = useState('');
  const [datosLoading, setDatosLoading] = useState(false);

  // Validaciones
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarTelefono = (tel) => {
    const normalizado = normalizeTel(tel);
    const regex = /^\+593\d{9}$/;
    return regex.test(normalizado);
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCerrar]);

  const handleFoto = (e) => {
    const file = e.target.files[0];
    setFotoError('');
    setFotoExito('');
    if (!file) { setFoto(null); setFotoPreview(null); return; }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFotoError('Solo se aceptan archivos JPG o PNG.');
      e.target.value = '';
      return;
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setFotoError('La imagen no puede superar los 2 MB. Por favor elige una imagen más pequeña.');
      e.target.value = '';
      setTimeout(() => setFotoError(''), 4000);
      return;
    }
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleActualizarFoto = async () => {
    if (!foto) return;
    setFotoError('');
    setFotoExito('');
    setFotoLoading(true);
    try {
      const fd = new FormData();
      fd.append('fotoPerfil', foto);
      const { data } = await api.patch('/api/users/me', fd);
      actualizarUsuario({ fotoPerfil: data.data.fotoPerfil });
      setFotoExito('Foto actualizada correctamente.');
      setFoto(null);
      setFotoPreview(null);
    } catch (err) {
      setFotoError(err.response?.data?.error ?? 'Error al actualizar la foto.');
    } finally {
      setFotoLoading(false);
    }
  };

  const handleGuardarDatos = async (e) => {
    e.preventDefault();
    setDatosError('');
    setDatosExito('');

    if (!nombre.trim()) {
      setDatosError('El nombre es requerido.');
      return;
    }

    if (!validarTelefono(telefonoInput)) {
      setDatosError('Teléfono inválido. Debe ser: 0912345678, +593912345678 o 593912345678 (9 dígitos después del código de país)');
      return;
    }

    if (!passwordActual) {
      setDatosError('La contraseña actual es requerida.');
      return;
    }

    if (passwordNueva && passwordNueva.length < 6) {
      setDatosError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setDatosLoading(true);
    try {
      const body = {
        nombre: nombre.trim(),
        telefono: normalizeTel(telefonoInput),
        passwordActual,
      };
      if (passwordNueva) body.password = passwordNueva;
      const { data } = await api.patch('/api/users/me', body);
      actualizarUsuario({ nombre: data.data.nombre, telefono: data.data.telefono });
      setDatosExito('Datos actualizados correctamente.');
      setPasswordActual('');
      setPasswordNueva('');
    } catch (err) {
      setDatosError(err.response?.data?.error ?? 'Error al actualizar los datos.');
    } finally {
      setDatosLoading(false);
    }
  };

  const inicial = usuario?.nombre?.[0]?.toUpperCase() ?? '?';
  const fotoActual = fotoPreview ?? usuario?.fotoPerfil;
  const inputRef = useRef(null);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onCerrar(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-lg font-bold text-text">Mi perfil</h2>
          <button
            onClick={onCerrar}
            className="text-text-muted hover:text-text transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-7">
          {/* ── Sección A: Foto de perfil ── */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Foto de perfil</h3>

            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div
                  onClick={() => setMostrarMenu(!mostrarMenu)}
                  className="relative w-28 h-28 rounded-full bg-primary/15 flex items-center justify-center text-4xl font-bold text-primary shrink-0 overflow-hidden border-2 border-primary shadow-md cursor-pointer group"
                >
                  {fotoActual && fotoActual !== 'REMOVED_BY_MODERATOR'
                    ? <img src={imgUrl(fotoActual)} alt="perfil" className="w-full h-full object-cover" />
                    : inicial}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>

                {mostrarMenu && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-surface border border-border rounded-lg shadow-lg py-1 z-40 whitespace-nowrap">
                    {fotoActual && fotoActual !== 'REMOVED_BY_MODERATOR' && (
                      <button
                        onClick={() => { setFotoFullscreen(true); setMostrarMenu(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-text hover:bg-primary/10 transition-colors"
                      >
                        Ver foto
                      </button>
                    )}
                    <button
                      onClick={() => { inputRef.current?.click(); setMostrarMenu(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-text hover:bg-primary/10 transition-colors"
                    >
                      Cambiar foto
                    </button>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFoto}
                className="hidden"
              />
            </div>

            {fotoError && (
              <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-2">{fotoError}</p>
            )}
            {fotoExito && (
              <p className="text-xs text-success bg-success/5 border border-success/20 rounded px-3 py-2">{fotoExito}</p>
            )}

            {foto && (
              <button
                onClick={handleActualizarFoto}
                disabled={fotoLoading}
                className="w-full py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {fotoLoading ? 'Subiendo…' : 'Actualizar foto'}
              </button>
            )}
          </div>

          {/* ── Lightbox para ver foto a tamaño completo ── */}
          {fotoFullscreen && (
            <div
              onClick={() => setFotoFullscreen(false)}
              className="fixed inset-0 z-100 bg-black/80 flex items-center justify-center p-4"
            >
              <div className="relative max-w-2xl max-h-[90vh]">
                <img
                  src={imgUrl(fotoActual)}
                  alt="foto-completa"
                  className="w-full h-full object-contain rounded-lg"
                />
                <button
                  onClick={() => setFotoFullscreen(false)}
                  className="absolute -top-8 right-0 text-white hover:text-gray-300 transition-colors"
                  aria-label="Cerrar"
                >
                  <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <hr className="border-border" />

          {/* ── Sección B: Datos personales ── */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Datos personales</h3>

            <form onSubmit={handleGuardarDatos} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text">Teléfono</label>
                <input
                  type="tel"
                  value={telefonoInput}
                  onChange={(e) => setTelefonoInput(e.target.value)}
                  placeholder="0912345678, +593912345678 o 593912345678"
                  required
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text ${
                    telefonoInput && !validarTelefono(telefonoInput) ? 'border-danger' : 'border-border'
                  }`}
                />
                {telefonoInput && !validarTelefono(telefonoInput) && (
                  <p className="text-xs text-danger">Formato: 0912345678 (10 dígitos) o +593912345678</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text">
                  Contraseña actual <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="Requerida para guardar cambios"
                  required
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text">
                  Nueva contraseña{' '}
                  <span className="text-text-muted font-normal">(opcional)</span>
                </label>
                <input
                  type="password"
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  placeholder="Dejar en blanco para no cambiar"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder-text-muted"
                />
              </div>

              {datosError && (
                <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-2">{datosError}</p>
              )}
              {datosExito && (
                <p className="text-xs text-success bg-success/5 border border-success/20 rounded px-3 py-2">{datosExito}</p>
              )}

              <button
                type="submit"
                disabled={datosLoading}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {datosLoading ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
