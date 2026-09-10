import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoulette, type RouletteBet, type RouletteBetType } from '../hooks/useRoulette';
import { useWallet } from '../hooks/useWallet';

const BET_OPTIONS = [1, 2, 5, 10, 20, 50, 100, 500];

const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
];

const TABLE_NUMBERS: number[] = Array.from(
  { length: 36 },
  (_, i) => i + 1
);

const getNumberColor = (n: number): 'red' | 'black' | 'green' => {
  if (n === 0) return 'green';
  return RED_NUMBERS.includes(n) ? 'red' : 'black';
};

const getColorLabel = (color: string) => {
  if (color === 'RED') return 'ROJO';
  if (color === 'BLACK') return 'NEGRO';
  return 'VERDE';
};

const getBetLabel = (bet: RouletteBet): string => {
  if (bet.type === 'NUMBER') {
    return `Número ${bet.value}`;
  }
  const labels: Record<string, string> = {
    RED: 'ROJO',
    BLACK: 'NEGRO',
    EVEN: 'PAR',
    ODD: 'IMPAR',
    LOW: '1 - 18',
    HIGH: '19 - 36',
    DOZEN_1: '1ª DOCENA',
    DOZEN_2: '2ª DOCENA',
    DOZEN_3: '3ª DOCENA',
    COLUMN_1: '1ª COLUMNA',
    COLUMN_2: '2ª COLUMNA',
    COLUMN_3: '3ª COLUMNA',
  };
  return labels[bet.type] || bet.type;
};

const isBetSelected = (
  selectedBets: RouletteBet[],
  type: RouletteBetType,
  value?: number
): boolean => {
  return selectedBets.some(
    (b) => b.type === type && (b.value ?? null) === (value ?? null)
  );
};

const getBetAmount = (
  selectedBets: RouletteBet[],
  type: RouletteBetType,
  value?: number
): number | null => {
  const bet = selectedBets.find(
    (b) => b.type === type && (b.value ?? null) === (value ?? null)
  );
  return bet ? bet.amount : null;
};

const EVEN_BETS: { key: RouletteBetType; label: string; sub: string }[] = [
  { key: 'RED', label: 'ROJO', sub: 'x2' },
  { key: 'BLACK', label: 'NEGRO', sub: 'x2' },
  { key: 'EVEN', label: 'PAR', sub: 'x2' },
  { key: 'ODD', label: 'IMPAR', sub: 'x2' },
  { key: 'LOW', label: '1 - 18', sub: 'x2' },
  { key: 'HIGH', label: '19 - 36', sub: 'x2' },
];

const DOZEN_BETS: { key: RouletteBetType; label: string; sub: string; mult: string }[] = [
  { key: 'DOZEN_1', label: '1ª DOCENA', sub: '1 - 12', mult: 'x3' },
  { key: 'DOZEN_2', label: '2ª DOCENA', sub: '13 - 24', mult: 'x3' },
  { key: 'DOZEN_3', label: '3ª DOCENA', sub: '25 - 36', mult: 'x3' },
];

const COLUMN_BETS: { key: RouletteBetType; label: string; mult: string }[] = [
  { key: 'COLUMN_1', label: '1ª COLUMNA', mult: 'x3' },
  { key: 'COLUMN_2', label: '2ª COLUMNA', mult: 'x3' },
  { key: 'COLUMN_3', label: '3ª COLUMNA', mult: 'x3' },
];

export default function Roulette() {
  const { playing, lastResult, play } = useRoulette();
  const { wallet, updateBalance } = useWallet();
  const [stake, setStake] = useState(100);
  const [selectedBets, setSelectedBets] = useState<RouletteBet[]>([]);

  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  const totalBet = selectedBets.reduce(
    (sum, b) => sum + b.amount,
    0
  );

  const addBet = useCallback(
    (type: RouletteBetType, value?: number) => {
      const newBet: RouletteBet = { type, value, amount: stake };

      setSelectedBets((prev) => {
        for (let i = 0; i < prev.length; i++) {
          const existing = prev[i];
          if (
            existing.type === type &&
            (existing.value ?? null) === (value ?? null)
          ) {
            const updated = [...prev];
            updated[i] = {
              ...existing,
              amount: existing.amount + stake,
            };
            return updated;
          }
        }
        return [...prev, newBet];
      });
    },
    [stake]
  );

  const removeBet = useCallback((index: number) => {
    setSelectedBets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearBets = useCallback(() => {
    setSelectedBets([]);
  }, []);

  const animationIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const resultTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const animationStartRef = useRef(0);

  const MIN_ANIMATION_MS = 3500;

  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }

      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectNumber = (number: number) => {
    if (playing || animating) return;

    addBet('NUMBER', number);
    setError('');
  };

  const handleSelectBetType = (type: RouletteBetType) => {
    if (playing || animating) return;

    addBet(type);
    setError('');
  };

  const handleBetChange = (amount: number) => {
    if (playing || animating) return;

    setStake(amount);
    setError('');
  };

  const handlePlay = async () => {
    if (playing || animating) return;

    if (selectedBets.length === 0) {
      setError('Elegí al menos una apuesta.');
      return;
    }

    if (!wallet) {
      setError('Billetera no encontrada.');
      return;
    }

    if (wallet.balance < totalBet) {
      setError('Saldo insuficiente.');
      return;
    }

    setError('');
    setShowResult(false);
    setDisplayNumber(null);
    setAnimating(true);

    animationStartRef.current = Date.now();

    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }

    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
    }

    /*
     * La animación es únicamente visual.
     * El resultado real SIEMPRE lo determina el backend.
     */
    const startRotation = wheelRotation;
    const extraRotations =
      (5 + Math.floor(Math.random() * 3)) * 360;

    const targetRotation =
      startRotation + extraRotations;

    const frameDuration = 30;
    let elapsed = 0;

    animationIntervalRef.current = setInterval(() => {
      elapsed += frameDuration;

      const progress = Math.min(
        1,
        elapsed / MIN_ANIMATION_MS
      );

      const easeOut =
        1 - Math.pow(1 - progress, 3);

      setWheelRotation(
        startRotation +
          (targetRotation - startRotation) *
            easeOut
      );

      /*
       * Número mostrado durante el giro:
       * solamente efecto visual.
       * No se utiliza para determinar el resultado.
       */
      setDisplayNumber(
        Math.floor(Math.random() * 37)
      );

      if (progress >= 1) {
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
        }
      }
    }, frameDuration);

    try {
      const result = await play(selectedBets);

      const requestElapsed =
        Date.now() - animationStartRef.current;

      const remaining =
        Math.max(
          0,
          MIN_ANIMATION_MS - requestElapsed
        );

      resultTimeoutRef.current = setTimeout(() => {
        /*
         * ESTE es el único número real.
         * Viene directamente del backend.
         */
        setDisplayNumber(result.result.number);

        setWheelRotation(prev => prev + 360);

        updateBalance(result.balance);

        setShowResult(true);
        setAnimating(false);
      }, remaining);
    } catch (e: any) {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }

      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = null;
      }

      setAnimating(false);
      setDisplayNumber(null);

      setError(
        e?.message ||
          'No se pudo realizar la jugada.'
      );
    }
  };

  const canPlay =
    !playing &&
    !animating &&
    !!wallet &&
    wallet.balance >= totalBet &&
    selectedBets.length > 0;

  const isWin =
    lastResult !== null &&
    lastResult.totalWin > 0;

  const displayedColor =
    displayNumber !== null
      ? getNumberColor(displayNumber)
      : null;

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
          backgroundImage:
            "url('/assets/games/background.png')",
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
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-black text-casino-gold">
              🎰 RULETA
            </h1>

            <p className="text-gray-300 mt-1">
              Ruleta Europea · 0 - 36
            </p>
          </div>

          {/* Balance */}
          {wallet && (
            <div className="flex justify-center mb-6">
              <div
                className="
                  px-6
                  py-3
                  rounded-xl
                  bg-black/70
                  border
                  border-casino-border
                  shadow-lg
                "
              >
                <span className="text-gray-400 mr-2">
                  Saldo:
                </span>

                <span className="text-casino-gold font-black text-xl">
                  {wallet.balance.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          )}

          {/* Roulette wheel */}
          <div className="flex justify-center mb-8">
            <div
              className="
                relative
                w-72
                h-72
                md:w-80
                md:h-80
                rounded-full
                bg-black
                border-8
                border-casino-gold
                shadow-[0_0_35px_rgba(255,215,0,0.35)]
                flex
                items-center
                justify-center
                overflow-hidden
              "
            >
              {/* Wheel */}
              <div
                className="
                  absolute
                  inset-3
                  rounded-full
                  border-4
                  border-gray-700
                  transition-transform
                  duration-100
                "
                style={{
                  transform:
                    `rotate(${wheelRotation}deg)`,
                  background:
                    'conic-gradient(' +
                    '#16803c 0deg 9.73deg,' +
                    '#111827 9.73deg 19.46deg,' +
                    '#b91c1c 19.46deg 29.19deg,' +
                    '#111827 29.19deg 38.92deg,' +
                    '#b91c1c 38.92deg 48.65deg,' +
                    '#111827 48.65deg 58.38deg,' +
                    '#b91c1c 58.38deg 68.11deg,' +
                    '#111827 68.11deg 77.84deg,' +
                    '#b91c1c 77.84deg 87.57deg,' +
                    '#111827 87.57deg 97.30deg,' +
                    '#b91c1c 97.30deg 107.03deg,' +
                    '#111827 107.03deg 116.76deg,' +
                    '#b91c1c 116.76deg 126.49deg,' +
                    '#111827 126.49deg 136.22deg,' +
                    '#b91c1c 136.22deg 145.95deg,' +
                    '#111827 145.95deg 155.68deg,' +
                    '#b91c1c 155.68deg 165.41deg,' +
                    '#111827 165.41deg 175.14deg,' +
                    '#b91c1c 175.14deg 184.87deg,' +
                    '#111827 184.87deg 194.60deg,' +
                    '#b91c1c 194.60deg 204.33deg,' +
                    '#111827 204.33deg 214.06deg,' +
                    '#b91c1c 214.06deg 223.79deg,' +
                    '#111827 223.79deg 233.52deg,' +
                    '#b91c1c 233.52deg 243.25deg,' +
                    '#111827 243.25deg 252.98deg,' +
                    '#b91c1c 252.98deg 262.71deg,' +
                    '#111827 262.71deg 272.44deg,' +
                    '#b91c1c 272.44deg 282.17deg,' +
                    '#111827 282.17deg 291.90deg,' +
                    '#b91c1c 291.90deg 301.63deg,' +
                    '#111827 301.63deg 311.36deg,' +
                    '#b91c1c 311.36deg 321.09deg,' +
                    '#111827 321.09deg 330.82deg,' +
                    '#b91c1c 330.82deg 340.55deg,' +
                    '#111827 340.55deg 350.28deg,' +
                    '#b91c1c 350.28deg 360deg)',
                }}
              />

              {/* Inner circle */}
              <div
                className="
                  relative
                  z-10
                  w-32
                  h-32
                  md:w-36
                  md:h-36
                  rounded-full
                  bg-casino-darker
                  border-4
                  border-casino-gold
                  flex
                  items-center
                  justify-center
                  shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]
                "
              >
                {displayNumber !== null ? (
                  <div className="text-center">
                    <div
                      className={`
                        text-5xl
                        md:text-6xl
                        font-black
                        ${
                          displayedColor === 'red'
                            ? 'text-red-500'
                            : displayedColor === 'green'
                            ? 'text-green-500'
                            : 'text-white'
                        }
                      `}
                    >
                      {displayNumber}
                    </div>

                    {!animating && (
                      <div className="text-xs text-gray-400 mt-1">
                        {lastResult
                          ? getColorLabel(
                              lastResult.result.color
                            )
                          : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-6xl">
                    🎰
                  </div>
                )}
              </div>

              {/* Pointer */}
              <div
                className="
                  absolute
                  top-0
                  left-1/2
                  -translate-x-1/2
                  z-20
                  w-0
                  h-0
                  border-l-[10px]
                  border-r-[10px]
                  border-t-[22px]
                  border-l-transparent
                  border-r-transparent
                  border-t-casino-gold
                  drop-shadow-lg
                "
              />
            </div>
          </div>

          {/* Betting amount */}
          <div className="mb-6">
            <div className="text-gray-300 font-medium text-center mb-2">
              Apuesta
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {BET_OPTIONS.map(amount => (
                <button
                  key={amount}
                  onClick={() =>
                    handleBetChange(amount)
                  }
                  disabled={playing || animating}
                  className={`
                    px-4
                    py-2
                    rounded-lg
                    font-bold
                    border
                    transition-all
                    duration-150
                    ${
                      stake === amount
                        ? 'bg-casino-gold text-black border-casino-gold shadow-[0_0_14px_rgba(255,215,0,0.75)] scale-105'
                        : 'bg-black/80 text-gray-300 border-casino-border hover:border-casino-gold hover:text-casino-gold'
                    }
                  `}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Betting table */}
          <div className="bg-black/75 border border-casino-border rounded-2xl p-4 mb-6">
            <div className="text-center text-gray-300 font-bold mb-3">
              TABLERO DE APUESTAS
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-3 gap-1 mb-1">
              {COLUMN_BETS.map(option => (
                <button
                  key={option.key}
                  onClick={() =>
                    handleSelectBetType(option.key)
                  }
                  disabled={playing || animating}
                  className={`
                    p-2
                    rounded-lg
                    border
                    font-bold
                    text-xs
                    transition-all
                    ${
                      isBetSelected(selectedBets, option.key)
                        ? 'border-casino-gold bg-casino-gold/15 shadow-[0_0_10px_rgba(255,215,0,0.6)] scale-[1.02]'
                        : 'border-casino-border bg-casino-darker hover:border-casino-gold hover:text-casino-gold'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Zero + Number grid */}
            <div className="grid grid-cols-3 gap-1">
              {/* Zero button — occupies first column */}
              <button
                onClick={() => handleSelectNumber(0)}
                disabled={playing || animating}
                className={`
                  h-10
                  md:h-11
                  rounded-md
                  font-black
                  border-2
                  transition-all
                  relative
                  ${
                    isBetSelected(selectedBets, 'NUMBER', 0)
                      ? 'ring-2 ring-casino-gold scale-105 shadow-[0_0_12px_rgba(255,215,0,0.8)]'
                      : 'hover:scale-105 hover:border-casino-gold'
                  }
                  bg-green-700 border-green-500
                `}
              >
                <div className="flex flex-col items-center">
                  <span>0</span>
                  {getBetAmount(selectedBets, 'NUMBER', 0) !== null && (
                    <span className="text-xs text-casino-gold">
                      $ {getBetAmount(selectedBets, 'NUMBER', 0)}
                    </span>
                  )}
                </div>
              </button>

              {/* Numbers 1-36 in 12 rows × 3 columns */}
              {TABLE_NUMBERS.map(number => {
                const color =
                  getNumberColor(number);

                const selected =
                  isBetSelected(
                    selectedBets,
                    'NUMBER',
                    number
                  );

                const betAmount =
                  getBetAmount(selectedBets, 'NUMBER', number);

                return (
                  <button
                    key={number}
                    onClick={() =>
                      handleSelectNumber(number)
                    }
                    disabled={playing || animating}
                    className={`
                      h-10
                      md:h-11
                      rounded-md
                      font-black
                      border-2
                      transition-all
                      relative
                      ${
                        color === 'red'
                          ? 'bg-red-700 border-red-500'
                          : 'bg-gray-950 border-gray-700'
                      }
                      ${
                        selected
                          ? 'ring-2 ring-casino-gold scale-105 shadow-[0_0_12px_rgba(255,215,0,0.8)]'
                          : 'hover:scale-105 hover:border-casino-gold'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center">
                      <span>{number}</span>
                      {betAmount !== null && (
                        <span className="text-xs text-casino-gold">
                          $ {betAmount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exterior bets */}
          <div className="bg-black/75 border border-casino-border rounded-2xl p-4 mb-5">
            <div className="text-center text-gray-300 font-bold mb-3">
              APUESTAS EXTERIORES
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {EVEN_BETS.map(option => {
                const selected =
                  isBetSelected(
                    selectedBets,
                    option.key
                  );

                return (
                  <button
                    key={option.key}
                    onClick={() =>
                      handleSelectBetType(
                        option.key
                      )
                    }
                    disabled={playing || animating}
                    className={`
                      p-3
                      rounded-xl
                      border-2
                      transition-all
                      ${
                        selected
                          ? 'border-casino-gold bg-casino-gold/15 shadow-[0_0_12px_rgba(255,215,0,0.6)] scale-[1.02]'
                          : 'border-casino-border bg-casino-darker hover:border-casino-gold'
                      }
                    `}
                  >
                    <div
                      className={`
                        font-black
                        ${
                          option.key === 'RED'
                            ? 'text-red-500'
                            : option.key === 'BLACK'
                            ? 'text-gray-100'
                            : 'text-casino-gold'
                        }
                      `}
                    >
                      {option.label}
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      {option.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dozens */}
          <div className="bg-black/75 border border-casino-border rounded-2xl p-4 mb-5">
            <div className="text-center text-gray-300 font-bold mb-3">
              DOCENAS
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {DOZEN_BETS.map(option => {
                const selected =
                  isBetSelected(
                    selectedBets,
                    option.key
                  );

                return (
                  <button
                    key={option.key}
                    onClick={() =>
                      handleSelectBetType(
                        option.key
                      )
                    }
                    disabled={playing || animating}
                    className={`
                      p-3
                      rounded-xl
                      border-2
                      transition-all
                      ${
                        selected
                          ? 'border-casino-gold bg-casino-gold/15 shadow-[0_0_12px_rgba(255,215,0,0.6)]'
                          : 'border-casino-border bg-casino-darker hover:border-casino-gold'
                      }
                    `}
                  >
                    <div className="font-black text-casino-gold">
                      {option.label}
                    </div>

                    <div className="text-sm text-gray-300">
                      {option.sub}
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      {option.mult}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bets summary */}
          {selectedBets.length > 0 && (
            <div className="bg-black/75 border border-casino-border rounded-2xl p-4 mb-6">
              <div className="text-center text-gray-300 font-bold mb-3">
                MIS APUESTAS
              </div>

              <div className="space-y-2">
                {selectedBets.map((bet, index) => {
                  const existingIndex = selectedBets
                    .slice(0, index)
                    .findIndex(
                      (b) =>
                        b.type === bet.type &&
                        (b.value ?? null) === (bet.value ?? null)
                    );

                  return (
                    <div
                      key={index}
                      className={`
                        flex
                        justify-between
                        items-center
                        p-2
                        rounded-lg
                        bg-casino-darker/50
                        ${
                          existingIndex !== -1
                            ? 'hidden'
                            : ''
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`
                            font-bold
                            ${
                              bet.type === 'RED'
                                ? 'text-red-500'
                                : bet.type === 'BLACK'
                                ? 'text-gray-200'
                                : bet.type === 'NUMBER' &&
                                  getNumberColor(bet.value ?? 0) === 'red'
                                ? 'text-red-500'
                                : bet.type === 'NUMBER' &&
                                  getNumberColor(bet.value ?? 0) === 'green'
                                ? 'text-green-500'
                                : 'text-casino-gold'
                            }
                          `}
                        >
                          {getBetLabel(bet)}
                        </span>

                        <span className="text-gray-400">
                          $ {bet.amount}
                        </span>
                      </div>

                      <button
                        onClick={() => removeBet(index)}
                        disabled={playing || animating}
                        className="
                          text-red-400
                          hover:text-red-300
                          hover:bg-red-900/20
                          rounded-full
                          w-6
                          h-6
                          flex
                          items-center
                          justify-center
                          text-sm
                          font-bold
                          transition-all
                        "
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <div
                className="
                  flex
                  justify-between
                  items-center
                  mt-3
                  pt-3
                  border-t
                  border-casino-border
                "
              >
                <span className="text-gray-400 font-bold">
                  TOTAL
                </span>
                <span className="text-casino-gold font-black text-xl">
                  $ {totalBet}
                </span>
              </div>

              <div className="mt-3 flex justify-center">
                <button
                  onClick={clearBets}
                  disabled={playing || animating}
                  className="
                    px-4
                    py-1
                    rounded-lg
                    text-xs
                    font-bold
                    border
                    border-red-800
                    text-red-300
                    bg-red-900/20
                    hover:bg-red-900/40
                    hover:border-red-600
                    transition-all
                  "
                >
                  LIMPIAR
                </button>
              </div>
            </div>
          )}

          {/* Play button */}
          <div className="flex justify-center">
            <button
              onClick={handlePlay}
              disabled={!canPlay}
              className={`
                px-12
                py-4
                rounded-xl
                font-black
                text-xl
                uppercase
                tracking-wider
                transition-all
                ${
                  !canPlay
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-casino-gold text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(255,215,0,0.7)]'
                }
              `}
            >
              {playing || animating
                ? '🎰 GIRANDO...'
                : '🎰 GIRAR'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="
                mt-4
                max-w-xl
                mx-auto
                bg-red-900/50
                border
                border-red-500
                text-red-200
                rounded-xl
                p-3
                text-center
              "
            >
              {error}
            </div>
          )}

          {/* Result */}
          {showResult && lastResult && (
            <div
              className={`
                mt-8
                max-w-xl
                mx-auto
                rounded-2xl
                p-6
                border-2
                text-center
                ${
                  isWin
                    ? 'bg-green-900/40 border-green-500'
                    : 'bg-red-900/30 border-red-500'
                }
              `}
            >
              <div className="text-gray-300 text-sm mb-2">
                RESULTADO
              </div>

              <div
                className={`
                  text-7xl
                  font-black
                  mb-3
                  ${
                    lastResult.result.color ===
                    'RED'
                      ? 'text-red-500'
                      : lastResult.result.color ===
                        'GREEN'
                      ? 'text-green-500'
                      : 'text-white'
                  }
                `}
              >
                {lastResult.result.number}
              </div>

              <div className="text-lg font-bold mb-4">
                {getColorLabel(
                  lastResult.result.color
                )}
              </div>

              {/* Individual bet results */}
              <div className="bg-black/40 rounded-xl p-3 mb-4">
                <div className="text-gray-400 text-xs font-bold mb-2">
                  APUESTAS DE LA RONDA
                </div>

                <div className="space-y-2">
                  {lastResult.bets.map((betResult, idx) => {
                    const isBetWin = betResult.won;

                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300 font-medium">
                            {getBetLabel(betResult)}
                          </span>
                          <span className="text-gray-400 text-sm">
                            $ {betResult.amount}
                          </span>
                        </div>

                        <div
                          className={`
                            font-bold
                            text-sm
                            ${
                              isBetWin
                                ? 'text-green-400'
                                : 'text-gray-500'
                            }
                          `}
                        >
                          {isBetWin
                            ? `+$${betResult.win}`
                            : 'PERDIÓ'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-gray-400">
                    Total Apostado
                  </div>
                  <div className="text-casino-gold font-bold text-lg">
                    {lastResult.totalBet}
                  </div>
                </div>

                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-gray-400">
                    Total Ganado
                  </div>
                  <div className="text-casino-gold font-bold text-lg">
                    {lastResult.totalWin}
                  </div>
                </div>

                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-gray-400">
                    Resultado Neto
                  </div>
                  <div
                    className={`
                      font-bold
                      text-lg
                      ${
                        lastResult.netResult > 0
                          ? 'text-green-400'
                          : lastResult.netResult < 0
                          ? 'text-red-400'
                          : 'text-gray-300'
                    }
                    `}
                  >
                    {lastResult.netResult > 0
                      ? `+$${lastResult.netResult}`
                      : `$${lastResult.netResult}`}
                  </div>
                </div>

                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-gray-400">
                    Saldo
                  </div>
                  <div className="text-casino-gold font-bold text-lg">
                    {lastResult.balance.toLocaleString(
                      'es-AR'
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`
                  mt-5
                  font-black
                  text-xl
                  ${
                    isWin
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                `}
              >
                {isWin
                  ? '🎉 ¡GANASTE!'
                  : '😔 No hubo premio'}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}