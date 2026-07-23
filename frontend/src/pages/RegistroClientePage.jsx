import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import Navbar from '../components/Navbar';
import { normalizeTel } from '../lib/telefono';

export default function RegistroClientePage() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm] = useState({
    nombre:   '',
    email:    '',
    password: '',
    telefono: '+593',
  });
  const [fotoPerfil, setFotoPerfil]   = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoError, setFotoError]     = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleTelefonoChange = (e) => {
    const val = e.target.value;
    if (!val.startsWith('+593')) {
      setForm((f) => ({ ...f, telefono: '+593' }));
    } else {
      setForm((f) => ({ ...f, telefono: val }));
    }
  };

  const handleTelefonoBlur = () => {
    setForm((f) => ({
      ...f,
      telefono: normalizeTel(f.telefono),
    }));
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
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) =>
        fd.append(k, k === 'telefono' ? normalizeTel(v) : v)
      );
      fd.append('fotoPerfil', fotoPerfil);
      await api.post('/api/auth/register', fd);
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

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
              <p className="text-text-muted text-sm mt-2">Crea tu cuenta gratuita</p>
              <p className="text-xs text-primary/80 mt-1">Únete a la comunidad de servicios de Cuenca</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field
                label="Nombre completo"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="María López"
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
                label="Teléfono"
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleTelefonoChange}
                onBlur={handleTelefonoBlur}
                placeholder="ej: +593984338767"
                required
              />

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
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
            </form>

            <p className="text-center text-sm text-text-muted mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Ingresar
              </Link>
            </p>

            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-xs text-text-muted">
                ¿Eres profesional?{' '}
                <Link to="/registro-proveedor" className="text-primary hover:underline">
                  Regístrate como proveedor
                </Link>
              </p>
            </div>
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
