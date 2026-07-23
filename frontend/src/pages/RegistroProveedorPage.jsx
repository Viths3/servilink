import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../lib/axios';
import Navbar from '../components/Navbar';
import InputCategorias from '../components/InputCategorias';
import { CATEGORIAS } from '../lib/categorias';
import { normalizeTel } from '../lib/telefono';

export default function RegistroProveedorPage() {
  const { state: prefill } = useLocation();

  const [form, setForm] = useState({
    nombre:      prefill?.nombre    ?? '',
    email:       '',
    password:    '',
    telefono:    normalizeTel(prefill?.telefono ?? ''),
    cedula:      '',
    categoria:   '',
    descripcion: '',
  });
  const [fotoPerfil, setFotoPerfil]   = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoError, setFotoError]     = useState('');
  const [error, setError]             = useState('');
  const [exito, setExito]             = useState(false);
  const [aprobadoAlInstante, setAprobadoAlInstante] = useState(false);
  const [loading, setLoading]         = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleTelefonoChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, telefono: val.startsWith('+593') ? val : '+593' }));
  };

  const handleTelefonoBlur = () => {
    setForm((f) => ({ ...f, telefono: normalizeTel(f.telefono) }));
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    setFotoError('');
    if (!file) { setFotoPerfil(null); setFotoPreview(null); return; }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFotoError('Solo se aceptan archivos JPG o PNG.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFotoError('El archivo supera el límite de 5 MB.');
      e.target.value = '';
      return;
    }
    setFotoPerfil(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fotoPerfil) {
      setError('La foto de perfil es requerida.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) =>
        formData.append(k, k === 'telefono' ? normalizeTel(v) : v)
      );
      formData.append('fotoPerfil', fotoPerfil);
      const { data } = await api.post('/api/auth/register-provider', formData);
      setAprobadoAlInstante(data.usuario?.verificationStatus === 'aprobado');
      setExito(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito ──────────────────────────────────────────
  if (exito) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-10 shadow-sm text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text mb-2">
              {aprobadoAlInstante ? '¡Cuenta verificada!' : '¡Solicitud enviada!'}
            </h2>
            <p className="text-text-muted text-sm leading-relaxed mb-6">
              {aprobadoAlInstante
                ? 'Tu identidad fue verificada automáticamente. Ya puedes iniciar sesión y publicar tus servicios.'
                : 'Tu cuenta está en revisión. Te notificaremos por WhatsApp cuando sea aprobada.'}
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-full transition-colors"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="text-3xl font-bold text-primary tracking-tight">
                ServiLink
              </Link>
              <p className="text-text-muted text-sm mt-2">Regístrate como proveedor de servicios</p>
              <p className="text-xs text-primary/80 mt-1">Únete a la comunidad de servicios de Cuenca</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field
                label="Nombre completo"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Carlos Pérez"
                required
              />
              <Field
                label="Correo electrónico"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                required
              />
              <Field
                label="Contraseña"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <Field
                label="Teléfono (WhatsApp)"
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleTelefonoChange}
                onBlur={handleTelefonoBlur}
                placeholder="ej: +593984338767"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Número de cédula"
                  name="cedula"
                  value={form.cedula}
                  onChange={handleChange}
                  placeholder="0102030405"
                  required
                />
                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-text mb-1.5">
                    Categoría
                  </label>
                  <InputCategorias
                    value={form.categoria}
                    onChange={(value) => setForm((f) => ({ ...f, categoria: value }))}
                    placeholder="Selecciona tu categoría..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-text mb-1.5">
                  Descripción <span className="text-text-muted font-normal">(opcional)</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Cuéntanos sobre tu experiencia y los servicios que ofreces…"
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-surface resize-none"
                />
              </div>

              {/* Foto de perfil */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Foto de perfil <span className="text-danger">*</span>
                  <span className="text-text-muted font-normal"> JPG/PNG · máx. 5 MB</span>
                </label>
                <div className="flex items-center gap-4">
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      alt="preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-border shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7 text-primary/40" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFoto}
                    className="flex-1 text-sm text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                </div>
                {fotoError && (
                  <p className="mt-1 text-xs text-danger">{fotoError}</p>
                )}
              </div>

              {/* Nota verificación */}
              <div className="flex gap-3 bg-primary/5 border border-primary/15 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-primary leading-relaxed">
                  Tu cuenta será verificada por nuestro equipo. Podrás subir tu cédula desde el panel una vez creada.
                </p>
              </div>

              {error && (
                <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando solicitud…' : 'Registrarme como proveedor'}
              </button>
            </form>

            <p className="text-center text-sm text-text-muted mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Ingresar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, onBlur, placeholder, required }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-text mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-surface"
      />
    </div>
  );
}
