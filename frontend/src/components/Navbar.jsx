import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-surface border-b border-border h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary tracking-tight">
          ServiLink
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-text-muted hover:text-text transition-colors">
            Explorar
          </Link>
          <a href="/#como-funciona" className="text-sm text-text-muted hover:text-text transition-colors">
            ¿Cómo funciona?
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Ingresar
          </Link>
          <Link
            to="/registro"
            className="text-sm font-medium bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
          >
            Registro
          </Link>
        </div>
      </div>
    </nav>
  );
}
