import { useAuth } from '../hooks/useAuth';
import { useAuthModal } from '../hooks/useAuthModal';

export default function Header() {
  const { user, logout } = useAuth();
  const { openAuthModal } = useAuthModal();

  return (
    <header className="bg-casino-card border-b border-casino-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/" className="text-2xl font-bold gradient-text">
            🎰 Casino Virtual
          </a>
          <nav className="hidden md:flex gap-6">
            <a href="/" className="text-casino-muted hover:text-casino-gold transition-colors">Inicio</a>
            <a href="/slots" className="text-casino-muted hover:text-casino-gold transition-colors">Juegos</a>
            <a href="/history" className="text-casino-muted hover:text-casino-gold transition-colors">Historial</a>
            <a href="/profile" className="text-casino-muted hover:text-casino-gold transition-colors">Perfil</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-casino-gold font-semibold">
                {user.username}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-casino-accent hover:bg-casino-accentHover rounded-lg transition-colors"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-4 py-2 bg-casino-gold hover:bg-casino-goldDark text-casino-darker font-bold rounded-lg transition-colors"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
