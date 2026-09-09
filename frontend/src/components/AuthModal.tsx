import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!phone.trim()) {
          throw new Error('El número de teléfono es obligatorio.');
        }

        await register(
          email,
          username,
          password,
          fullName,
          phone
        );
      }

      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setFullName('');
    setPhone('');
    setError('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-casino-card rounded-2xl p-8 w-full max-w-md border border-casino-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isLogin ? 'Iniciar Sesión' : 'Registro'}
          </h2>

          <button
            onClick={onClose}
            className="text-casino-muted hover:text-white"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre de usuario
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-lg focus:outline-none focus:border-casino-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre completo (opcional)
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-lg focus:outline-none focus:border-casino-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Número de teléfono
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+54 9 351 123 4567"
                  className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-lg focus:outline-none focus:border-casino-gold"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-lg focus:outline-none focus:border-casino-gold"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-lg focus:outline-none focus:border-casino-gold"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-casino-gold hover:bg-casino-goldDark text-casino-darker font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading
              ? 'Cargando...'
              : isLogin
                ? 'Iniciar Sesión'
                : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-casino-muted mt-4">
          {isLogin
            ? '¿No tienes cuenta?'
            : '¿Ya tienes cuenta?'}

          <button
            onClick={toggleMode}
            className="text-casino-gold hover:underline ml-1"
          >
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
