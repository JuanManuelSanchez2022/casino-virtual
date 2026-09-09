import { useWallet } from '../hooks/useWallet';

const TOPUP_OPTIONS = [1000, 5000, 10000, 50000, 100000];

export default function Wallet() {
  const { wallet, loading, addCredits } = useWallet();

  if (loading) {
    return <div className="text-casino-muted">Cargando saldo...</div>;
  }

  if (!wallet) {
    return <div className="text-casino-muted">Error al cargar billetera</div>;
  }

  const handleTopup = async (amount: number) => {
    await addCredits(amount);
  };

  return (
    <div className="bg-casino-card rounded-2xl p-6 border border-casino-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Saldo Virtual</h3>
        <span className="text-xs text-casino-muted bg-casino-darker px-3 py-1 rounded-full">
          Sin valor monetario
        </span>
      </div>
      <div className="text-4xl font-bold text-casino-gold mb-4">
        {wallet.balance.toLocaleString()} <span className="text-xl">créditos</span>
      </div>
      <div className="border-t border-casino-border pt-4">
        <p className="text-sm text-casino-muted mb-3">Agregar créditos virtuales:</p>
        <div className="flex flex-wrap gap-2">
          {TOPUP_OPTIONS.map(amount => (
            <button
              key={amount}
              onClick={() => handleTopup(amount)}
              className="px-4 py-2 bg-casino-darker hover:bg-casino-border border border-casino-border rounded-lg text-casino-text transition-colors"
            >
              +{amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
