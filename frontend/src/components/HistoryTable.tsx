import { Transaction } from '../types';

interface HistoryTableProps {
  transactions: Transaction[];
}

export default function HistoryTable({ transactions }: HistoryTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center text-casino-muted py-8">
        No hay transacciones para mostrar.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-casino-border">
            <th className="py-3 px-4 text-casino-muted font-medium">Fecha</th>
            <th className="py-3 px-4 text-casino-muted font-medium">Tipo</th>
            <th className="py-3 px-4 text-casino-muted font-medium">Descripción</th>
            <th className="py-3 px-4 text-casino-muted font-medium text-right">Monto</th>
            <th className="py-3 px-4 text-casino-muted font-medium text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id} className="border-b border-casino-border/50 hover:bg-casino-card/50">
              <td className="py-3 px-4 text-sm">
                {new Date(tx.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  tx.type === 'WIN' ? 'bg-green-900/50 text-green-300' :
                  tx.type === 'VIRTUAL_TOPUP' ? 'bg-blue-900/50 text-blue-300' :
                  tx.type === 'BET' ? 'bg-red-900/50 text-red-300' :
                  'bg-casino-border text-casino-muted'
                }`}>
                  {tx.type}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-casino-muted">{tx.description || '-'}</td>
              <td className={`py-3 px-4 text-right font-mono font-bold ${
                tx.amount > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right font-mono text-casino-gold">
                {tx.balanceAfter.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
