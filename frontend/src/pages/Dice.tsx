import React, { useState } from 'react';
import { useDice } from '../hooks/useDice';
import { useWallet } from '../hooks/useWallet';

export default function Dice() {
  const { playing, lastResult, play } = useDice();
  const { wallet, updateBalance } = useWallet();
  const [bet, setBet] = useState(100);
  const [choice, setChoice] = useState<string>('');
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen bg-casino-dark text-white p-4">
      <h1 className="text-3xl font-bold text-casino-gold">🎲 Dados</h1>
      <p className="text-gray-400 mt-1">High / Low / Seven</p>
      <div className="mt-6">
        <div className="text-gray-300 font-medium text-center mb-2">Apuesta</div>
        <div className="flex flex-wrap justify-center gap-2">
          {[1, 2, 5, 10, 20, 50, 100, 500].map(amount => (
            <button
              key={amount}
              onClick={() => setBet(amount)}
              disabled={playing}
              className={`px-3 py-2 rounded-lg font-bold border transition-all duration-150 ${
                bet === amount
                  ? 'bg-casino-gold text-black border-casino-gold shadow-[0_0_14px_rgba(255,215,0,0.75)] scale-105'
                  : 'bg-black text-gray-300 border-casino-border hover:border-casino-gold hover:text-casino-gold'
              }`}
            >
              {amount}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <div className="text-gray-300 font-medium text-center mb-2">Selección</div>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { key: 'LOW', label: 'BAJO', range: '2 - 6', mult: 'x2' },
            { key: 'SEVEN', label: 'SIETE', range: '7', mult: 'x5' },
            { key: 'HIGH', label: 'ALTO', range: '8 - 12', mult: 'x2' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setChoice(opt.key)}
              disabled={playing}
              className={`w-36 p-4 rounded-xl border-2 transition-all ${
                choice === opt.key
                  ? 'border-casino-gold bg-casino-gold/10 shadow-[0_0_14px_rgba(255,215,0,0.75)]'
                  : 'border-casino-border bg-casino-darker hover:border-casino-gold'
              }`}
            >
              <div className="text-lg font-bold text-casino-gold">{opt.label}</div>
              <div className="text-sm text-gray-300">{opt.range}</div>
              <div className="text-xs text-gray-400 mt-1">{opt.mult}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <button
          onClick={async () => {
            if (!choice) {
              setError('Elegí una opción.');
              return;
            }
            setError('');
            try {
              const result = await play(bet, choice as any);
              if (result) updateBalance(result.balance);
            } catch (e: any) {
              setError(e.message || 'Error');
            }
          }}
          disabled={playing || !choice || !wallet || wallet.balance < bet}
          className={`px-10 py-4 rounded-xl font-black text-xl uppercase tracking-wider transition-all ${
            playing || !choice || !wallet || wallet.balance < bet
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-casino-gold text-black hover:scale-105 hover:shadow-lg'
          }`}
        >
          {playing ? 'LANZANDO...' : '🎲 LANZAR'}
        </button>
      </div>
      {error && (
        <div className="mt-4 bg-red-900/40 border border-red-500 text-red-200 rounded-lg p-3 text-center">
          {error}
        </div>
      )}
      {lastResult && (
        <div className="mt-8 bg-casino-darker border border-casino-border rounded-2xl p-6">
          <div className="flex justify-center gap-8 mb-4">
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-5xl">
              {lastResult.dice.die1}
            </div>
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-5xl">
              {lastResult.dice.die2}
            </div>
          </div>
          <div className="text-center space-y-2">
            <div>Suma: <span className="text-casino-gold font-bold text-xl">{lastResult.dice.total}</span></div>
            <div>Resultado: <span className="text-casino-gold font-bold">{lastResult.dice.result}</span></div>
            <div>Apuesta: <span className="text-casino-gold font-bold">{lastResult.bet}</span></div>
            <div>Premio: <span className="text-casino-gold font-bold">{lastResult.win}</span></div>
            <div>Saldo: <span className="text-casino-gold font-bold">{lastResult.balance}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}