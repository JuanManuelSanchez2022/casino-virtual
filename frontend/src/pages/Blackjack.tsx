import { useWallet } from '../hooks/useWallet';
import { useBlackjack } from '../hooks/useBlackjack';
import { getCardSymbol, getCardColor, formatCardValue } from '../types/blackjack';
import { BlackjackGameState, Card } from '../types/blackjack';

const BET_OPTIONS = [10, 20, 50, 100, 200, 500, 1000, 5000];

const getStateLabel = (state: BlackjackGameState): string => {
  switch (state) {
    case 'PLAYER_TURN':
      return 'TU TURNO';
    case 'DEALER_TURN':
      return 'TURNO DEL DEALER';
    case 'FINISHED':
      return 'PARTIDA TERMINADA';
    default:
      return 'APOSTANDO';
  }
};

const getResultLabel = (result?: string): string => {
  switch (result) {
    case 'WIN':
      return '🎉 ¡GANASTE!';
    case 'LOSE':
      return '😔 PERDISTE';
    case 'PUSH':
      return '🤝 EMPATE';
    case 'BLACKJACK':
      return '🎰 ¡BLACKJACK!';
    default:
      return '';
  }
};

const getResultColor = (result?: string): string => {
  switch (result) {
    case 'WIN':
    case 'BLACKJACK':
      return 'text-green-400';
    case 'LOSE':
      return 'text-red-400';
    case 'PUSH':
      return 'text-yellow-400';
    default:
      return 'text-white';
  }
};

const getPayoutLabel = (result?: string, payout?: number): string => {
  if (!result) return '';
  switch (result) {
    case 'WIN':
      return `+$${payout || 0} (1:1)`;
    case 'BLACKJACK':
      return `+$${payout || 0} (3:2)`;
    case 'PUSH':
      return `Devuelto: $${payout || 0}`;
    case 'LOSE':
      return `Perdido: $${payout || 0}`;
    default:
      return '';
  }
};

export default function Blackjack() {
  const { wallet } = useWallet();
  const {
    gameState,
    loading,
    error,
    start,
    hit,
    stand,
    canHit,
    canStand,
    isFinished,
    isPlayerTurn,
    isDealerTurn,
    clearError,
    reset,
  } = useBlackjack();

  const [stake, setStake] = useState(100);

  const handleBetChange = (amount: number) => {
    if (loading || isPlayerTurn || isDealerTurn) return;
    setStake(amount);
    clearError();
  };

  const handleStart = async () => {
    if (!wallet) {
      return;
    }

    if (wallet.balance < stake) {
      return;
    }

    try {
      await start(stake);
    } catch (e) {
      // Error handled in hook
    }
  };

  const handleHit = async () => {
    try {
      await hit();
    } catch (e) {
      // Error handled in hook
    }
  };

  const handleStand = async () => {
    try {
      await stand();
    } catch (e) {
      // Error handled in hook
    }
  };

  const handleNewGame = () => {
    reset();
    clearError();
  };

  const canStart = !loading && wallet && wallet.balance >= stake && !isPlayerTurn && !isDealerTurn && !isFinished;

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      {/* Background */}
      <div
        className="
          fixed
          inset-0
          z-0
          bg-cover
          bg-center
          bg-no-repeat
        "
        style={{
          backgroundImage: "url('/assets/games/background.png')",
        }}
      />

      {/* Overlay */}
      <div
        className="
          fixed
          inset-0
          z-0
          bg-black/35
          pointer-events-none
        "
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen p-4 pb-10">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-black text-casino-gold">
              🃏 BLACKJACK
            </h1>
            <p className="text-gray-300 mt-1">
              Acercate a 21 sin pasarte
            </p>
          </div>

          {/* Balance */}
          {wallet && (
            <div className="flex justify-center mb-6">
              <div className="px-6 py-3 rounded-xl bg-black/70 border border-casino-border shadow-lg">
                <span className="text-gray-400 mr-2">Saldo:</span>
                <span className="text-casino-gold font-black text-xl">
                  {wallet.balance.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          )}

          {/* Game Area */}
          <div className="bg-black/75 border border-casino-border rounded-2xl p-6 mb-6">
            {/* Dealer Hand */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-bold text-casino-gold">DEALER</span>
                {isDealerTurn && (
                  <span className="px-3 py-1 bg-yellow-600 text-black rounded-full text-xs font-bold animate-pulse">
                    TURNO DEL DEALER
                  </span>
                )}
                {gameState && gameState.state === 'FINISHED' && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs font-bold">
                    MANO REVELADA
                  </span>
                )}
              </div>

              <div className="flex justify-center gap-3">
                {gameState?.dealerCards.map((card: Card, index: number) => (
                  <div
                    key={index}
                    className={`
                      relative
                      w-20
                      h-28
                      rounded-lg
                      border-2
                      bg-white
                      shadow-lg
                      flex
                      items-center
                      justify-center
                      font-bold
                      text-3xl
                      transition-all
                      duration-300
                      ${card.hidden ? 'bg-gray-800 border-gray-600' : ''}
                    `}
                  >
                    {card.hidden ? (
                      <div className="text-4xl">🂠</div>
                    ) : (
                      <div className={getCardColor(card) === 'red' ? 'text-red-600' : 'text-black'}>
                        {getCardSymbol(card)}
                      </div>
                    )}
                    {!card.hidden && (
                      <div className="absolute top-1 left-1 text-xs font-bold" style={{ color: getCardColor(card) === 'red' ? '#dc2626' : '#000' }}>
                        {formatCardValue(card)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center mt-3 text-lg font-medium">
                {gameState && gameState.dealerVisibleValue !== undefined && (
                  <span className="text-gray-300">
                    Valor visible: <span className="text-casino-gold font-bold">{gameState.dealerVisibleValue}</span>
                  </span>
                )}
                {gameState && gameState.dealerValue !== undefined && gameState.state === 'FINISHED' && (
                  <span className="text-gray-300 ml-4">
                    Valor total: <span className="text-casino-gold font-bold">{gameState.dealerValue}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-casino-border my-6" />

            {/* Player Hand */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-bold text-casino-gold">TU MANO</span>
                {isPlayerTurn && (
                  <span className="px-3 py-1 bg-casino-gold text-black rounded-full text-xs font-bold animate-pulse">
                    TU TURNO
                  </span>
                )}
              </div>

              <div className="flex justify-center gap-3">
                {gameState?.playerCards.map((card: Card, index: number) => (
                  <div
                    key={index}
                    className={`
                      relative
                      w-20
                      h-28
                      rounded-lg
                      border-2
                      bg-white
                      shadow-lg
                      flex
                      items-center
                      justify-center
                      font-bold
                      text-3xl
                      ${getCardColor(card) === 'red' ? 'border-red-400' : 'border-gray-400'}
                    `}
                  >
                    <div className={getCardColor(card) === 'red' ? 'text-red-600' : 'text-black'}>
                      {getCardSymbol(card)}
                    </div>
                    <div className="absolute top-1 left-1 text-xs font-bold" style={{ color: getCardColor(card) === 'red' ? '#dc2626' : '#000' }}>
                      {formatCardValue(card)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-3 text-lg font-medium">
                {gameState && (
                  <span className="text-gray-300">
                    Valor: <span className="text-casino-gold font-bold">{gameState.playerValue}</span>
                  </span>
                )}
                {gameState && gameState.playerValue > 21 && (
                  <span className="text-red-400 ml-4 font-bold animate-pulse">¡BUST!</span>
                )}
                {gameState && gameState.playerValue === 21 && gameState.playerCards.length === 2 && (
                  <span className="text-yellow-400 ml-4 font-bold animate-pulse">¡BLACKJACK!</span>
                )}
              </div>
            </div>

            {/* Game State / Result */}
            {gameState && gameState.state === 'FINISHED' && (
              <div className="text-center py-4 rounded-xl bg-black/50 border border-casino-border mb-6">
                <div className="text-3xl font-black mb-2" style={{ color: getResultColor(gameState.result) }}>
                  {getResultLabel(gameState.result)}
                </div>
                <div className="text-lg text-gray-300 mb-2">
                  {getPayoutLabel(gameState.result, gameState.payout)}
                </div>
                <div className="text-gray-400">
                  Apuesta: <span className="text-casino-gold font-bold">${gameState.bet}</span>
                  {gameState.payout !== undefined && (
                    <span className="ml-4">Retorno: <span className="text-casino-gold font-bold">${gameState.payout + gameState.bet}</span></span>
                  )}
                </div>
              </div>
            )}

            {/* State Indicator */}
            {gameState && gameState.state !== 'FINISHED' && (
              <div className="text-center mb-4">
                <span className={`
                  px-4 py-2 rounded-full text-sm font-bold
                  ${isPlayerTurn ? 'bg-casino-gold text-black' : isDealerTurn ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-gray-400'}
                `}>
                  {getStateLabel(gameState.state)}
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-900/50 border border-red-500 text-red-200 rounded-xl text-center">
                {error}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Betting Controls */}
            {!gameState && (
              <div className="bg-black/75 border border-casino-border rounded-2xl p-6">
                <div className="text-center text-gray-300 font-bold mb-4">
                  REALIZÁ TU APUESTA
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {BET_OPTIONS.map(amount => (
                    <button
                      key={amount}
                      onClick={() => handleBetChange(amount)}
                      disabled={loading}
                      className={`
                        px-4 py-2 rounded-lg font-bold border transition-all duration-150
                        ${stake === amount
                          ? 'bg-casino-gold text-black border-casino-gold shadow-[0_0_14px_rgba(255,215,0,0.75)] scale-105'
                          : 'bg-black/80 text-gray-300 border-casino-border hover:border-casino-gold hover:text-casino-gold'}
                      `}
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleStart}
                    disabled={!canStart}
                    className={`
                      px-8 py-3 rounded-xl font-black text-lg uppercase tracking-wider transition-all
                      ${!canStart
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-casino-gold text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(255,215,0,0.7)]'}
                    `}
                  >
                    {loading ? '🃏 REPARTIENDO...' : '🃏 JUGAR'}
                  </button>
                </div>
              </div>
            )}

            {/* Game Controls */}
            {gameState && !isFinished && (
              <div className="bg-black/75 border border-casino-border rounded-2xl p-6">
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleHit}
                    disabled={!canHit}
                    className={`
                      px-8 py-3 rounded-xl font-black text-lg uppercase tracking-wider transition-all
                      ${!canHit
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:scale-105 hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]'}
                    `}
                  >
                    🃏 HIT
                  </button>

                  <button
                    onClick={handleStand}
                    disabled={!canStand}
                    className={`
                      px-8 py-3 rounded-xl font-black text-lg uppercase tracking-wider transition-all
                      ${!canStand
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.7)]'}
                    `}
                  >
                    ✋ STAND
                  </button>
                </div>
              </div>
            )}

            {/* New Game Button */}
            {gameState && isFinished && (
              <div className="flex justify-center">
                <button
                  onClick={handleNewGame}
                  className="
                    px-8 py-3 rounded-xl font-black text-lg uppercase tracking-wider
                    bg-casino-gold text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(255,215,0,0.7)]
                    transition-all
                  "
                >
                  🃏 NUEVA PARTIDA
                </button>
              </div>
            )}
          </div>

          {/* Balance Display */}
          {wallet && gameState && (
            <div className="mt-6 flex justify-center">
              <div className="px-6 py-3 rounded-xl bg-black/70 border border-casino-border shadow-lg">
                <span className="text-gray-400 mr-2">Saldo:</span>
                <span className="text-casino-gold font-black text-xl">
                  {gameState.balance.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 max-w-xl mx-auto bg-red-900/50 border border-red-500 text-red-200 rounded-xl p-3 text-center">
              {error}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';