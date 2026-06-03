import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import Navbar from '../components/Navbar';

const CATEGORIAS = [
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'plomeria',     label: 'Plomería' },
  { value: 'medicina',     label: 'Medicina' },
  { value: 'carpinteria',  label: 'Carpintería' },
  { value: 'asesoria',     label: 'Asesoría' },
  { value: 'otro',         label: 'Otro' },
];

export default function RegistroProveedorPage() {
  const [form, setForm] = useState({
    nombre:      '',
    email:       '',
    password:    '',
    telefono:    '+593',
    cedula:      '',
    categoria:   '',
    descripcion: '',
  });
  const [error, setError]     = useState('');
  const [exito, setExito]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // register-provider usa multipart/form-data (middleware Multer en el backend)
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));

      await api.post('/api/auth/register-provider', formData);
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
            <h2 className="text-xl font-bold text-text mb-2">¡Solicitud enviada!</h2>
            <p className="text-text-muted text-sm leading-relaxed mb-6">
              Tu cuenta está en revisión. Te notificaremos por WhatsApp cuando sea aprobada.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors"
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
                onChange={handleChange}
                placeholder="+593991234567"
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
                  <select
                    id="categoria"
                    name="categoria"
                    value={form.categoria}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-surface"
                  >
                    <option value="">Selecciona…</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
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
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-surface resize-none"
                />
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
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

function Field({ label, name, type = 'text', value, onChange, placeholder, required }) {
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
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-lg border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-surface"
      />
    </div>
  );
}
