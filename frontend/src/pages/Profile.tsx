import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await api.put('/user/profile', { fullName });
      setMessage('Perfil actualizado correctamente.');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-casino-muted">Inicia sesión para ver tu perfil.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Mi Perfil</h1>

      <div className="bg-casino-card rounded-2xl p-6 border border-casino-border mb-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Usuario</label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-lg text-casino-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-lg text-casino-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-lg focus:outline-none focus:border-casino-gold"
              placeholder="Tu nombre"
            />
          </div>
          {message && (
            <div className={`px-4 py-3 rounded-lg ${message.includes('correctamente') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-casino-gold hover:bg-casino-goldDark text-casino-darker font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>

      <div className="bg-casino-card rounded-2xl p-6 border border-casino-border">
        <h3 className="text-lg font-semibold mb-4">Acciones</h3>
        <button
          onClick={logout}
          className="w-full py-3 bg-casino-accent hover:bg-casino-accentHover text-white font-bold rounded-lg transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
