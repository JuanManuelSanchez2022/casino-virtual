import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface GameHistoryItem {
  id: string;
  gameName: string;
  bet: number;
  win: number;
  createdAt: string;
}

export default function History() {
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<{ spins: GameHistoryItem[]; totalPages: number }>(`/games/history?page=${page}&limit=20`)
      .then(res => {
        setHistory(res.spins);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Historial de Partidas</h1>

      <div className="bg-casino-card rounded-2xl p-6 border border-casino-border">
        {loading ? (
          <div className="text-center text-casino-muted py-8">Cargando...</div>
        ) : history.length === 0 ? (
          <div className="text-center text-casino-muted py-8">
            No hay partidas para mostrar.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-casino-border">
                    <th className="py-3 px-4 text-casino-muted font-medium">Fecha</th>
                    <th className="py-3 px-4 text-casino-muted font-medium">Juego</th>
                    <th className="py-3 px-4 text-casino-muted font-medium text-right">Apuesta</th>
                    <th className="py-3 px-4 text-casino-muted font-medium text-right">Premio</th>
                    <th className="py-3 px-4 text-casino-muted font-medium text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id} className="border-b border-casino-border/50 hover:bg-casino-card/50">
                      <td className="py-3 px-4 text-sm">
                        {new Date(item.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium">{item.gameName}</td>
                      <td className="py-3 px-4 text-right font-mono text-casino-muted">
                        {item.bet.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${
                        item.win > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.win > 0 ? '+' : ''}{item.win.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${
                        item.win > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.win > 0 ? 'Ganancia' : 'Pérdida'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 bg-casino-darker border border-casino-border rounded-lg disabled:opacity-50 hover:bg-casino-border transition-colors"
              >
                Anterior
              </button>
              <span className="text-casino-muted">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-casino-darker border border-casino-border rounded-lg disabled:opacity-50 hover:bg-casino-border transition-colors"
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
