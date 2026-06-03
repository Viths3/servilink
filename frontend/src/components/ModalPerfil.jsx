import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { imgUrl } from '../lib/imageUrl';

export default function ModalPerfil({ onCerrar }) {
  const { usuario, actualizarUsuario } = useAuth();
  const overlayRef = useRef(null);

  // ── Sección A: Foto ───────────────────────────────────────────
  const [foto, setFoto]             = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoError, setFotoError]   = useState('');
  const [fotoExito, setFotoExito]   = useState('');
  const [fotoLoading, setFotoLoading] = useState(false);

  // ── Sección B: Datos ──────────────────────────────────────────
  const [nombre, setNombre]             = useState(usuario?.nombre ?? '');
  const normalizeTel = (val) => {
    if (!val) return '+593';
    if (/^0\d/.test(val)) return '+593' + val.slice(1);
    if (!val.startsWith('+593')) return '+593';
    return val;
  };

  const [telefono, setTelefono] = useState(() => normalizeTel(usuario?.telefono ?? ''));
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva]   = useState('');
  const [datosError, setDatosError]     = useState('');
  const [datosExito, setDatosExito]     = useState('');
  const [datosLoading, setDatosLoading] = useState(false);

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
    if (file.size > 2 * 1024 * 1024) {
      setFotoError('El archivo supera el límite de 2 MB.');
      e.target.value = '';
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
    setDatosLoading(true);
    try {
      const body = { nombre, telefono: normalizeTel(telefono), passwordActual };
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

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onCerrar(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary shrink-0 overflow-hidden border-2 border-border">
                {fotoActual
                  ? <img src={imgUrl(fotoActual)} alt="perfil" className="w-full h-full object-cover" />
                  : inicial}
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFoto}
                  className="w-full text-xs text-text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                <p className="text-xs text-text-muted">JPG o PNG · máx. 2 MB</p>
              </div>
            </div>

            {fotoError && (
              <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded px-3 py-2">{fotoError}</p>
            )}
            {fotoExito && (
              <p className="text-xs text-success bg-success/5 border border-success/20 rounded px-3 py-2">{fotoExito}</p>
            )}

            <button
              onClick={handleActualizarFoto}
              disabled={!foto || fotoLoading}
              className="w-full py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {fotoLoading ? 'Subiendo…' : 'Actualizar foto'}
            </button>
          </div>

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
                  value={telefono}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTelefono(val.startsWith('+593') ? val : '+593');
                  }}
                  onBlur={() => setTelefono((v) => normalizeTel(v))}
                  required
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text"
                />
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
