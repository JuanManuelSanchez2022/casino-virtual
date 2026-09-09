import React, { useEffect, useRef, useState } from 'react';
import {
  useRoulette,
  type RouletteBet,
  type RoulettePlayResult,
} from '../hooks/useRoulette';
import { useWallet } from '../hooks/useWallet';

const BET_OPTIONS = [1, 2, 5, 10, 20, 50, 100, 500];

const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
];

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34,
  6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18,
  29, 7, 28, 12, 35, 3, 26,
];

const getNumberColor = (n: number): 'red' | 'black' | 'green' => {
  if (n === 0) return 'green';
  return RED_NUMBERS.includes(n) ? 'red' : 'black';
};

const getColorLabel = (color: string) => {
  if (color === 'RED') return 'ROJO';
  if (color === 'BLACK') return 'NEGRO';
  return 'VERDE';
};

const EVEN_BETS = [
  { key: 'RED', label: 'ROJO', sub: 'x2' },
  { key: 'BLACK', label: 'NEGRO', sub: 'x2' },
  { key: 'EVEN', label: 'PAR', sub: 'x2' },
  { key: 'ODD', label: 'IMPAR', sub: 'x2' },
  { key: 'LOW', label: '1 - 18', sub: 'x2' },
  { key: 'HIGH', label: '19 - 36', sub: 'x2' },
];

const DOZEN_BETS = [
  { key: 'DOZEN_1', label: '1ª DOCENA', sub: '1 - 12', mult: 'x3' },
  { key: 'DOZEN_2', label: '2ª DOCENA', sub: '13 - 24', mult: 'x3' },
  { key: 'DOZEN_3', label: '3ª DOCENA', sub: '25 - 36', mult: 'x3' },
];

const COLUMN_BETS = [
  { key: 'COLUMN_1', label: '1ª COLUMNA', mult: 'x3' },
  { key: 'COLUMN_2', label: '2ª COLUMNA', mult: 'x3' },
  { key: 'COLUMN_3', label: '3ª COLUMNA', mult: 'x3' },
];

export default function Roulette() {
  const { playing, lastResult, play } = useRoulette();
  const { wallet, updateBalance } = useWallet();

  const [bet, setBet] = useState(100);
  const [selectedBet, setSelectedBet] =
    useState<RouletteBet | null>(null);

  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

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

    setSelectedBet({
      type: 'NUMBER',
      value: number,
      amount: bet,
    });

    setError('');
    setShowResult(false);
  };

  const handleSelectBetType = (type: string) => {
    if (playing || animating) return;

    setSelectedBet({
      type,
      amount: bet,
    });

    setError('');
    setShowResult(false);
  };

  const handleBetChange = (amount: number) => {
    if (playing || animating) return;

    setBet(amount);

    if (selectedBet) {
      setSelectedBet({
        ...selectedBet,
        amount,
      });
    }

    setError('');
  };

  const handlePlay = async () => {
    if (playing || animating) return;

    if (!selectedBet) {
      setError('Elegí una apuesta.');
      return;
    }

    if (!wallet) {
      setError('Billetera no encontrada.');
      return;
    }

    if (wallet.balance < bet) {
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
      const result = await play({
        ...selectedBet,
        amount: bet,
      });

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
    wallet.balance >= bet &&
    !!selectedBet;

  const isWin =
    lastResult !== null &&
    lastResult.win > 0;

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
                      bet === amount
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

          {/* Number board */}
          <div className="bg-black/75 border border-casino-border rounded-2xl p-4 mb-5">
            <div className="text-center text-gray-300 font-bold mb-3">
              NÚMEROS
            </div>

            <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
              {ROULETTE_NUMBERS.map(number => {
                const color =
                  getNumberColor(number);

                const selected =
                  selectedBet?.type === 'NUMBER' &&
                  selectedBet.value === number;

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
                      ${
                        color === 'red'
                          ? 'bg-red-700 border-red-500'
                          : color === 'black'
                          ? 'bg-gray-950 border-gray-700'
                          : 'bg-green-700 border-green-500'
                      }
                      ${
                        selected
                          ? 'ring-2 ring-casino-gold scale-105 shadow-[0_0_12px_rgba(255,215,0,0.8)]'
                          : 'hover:scale-105 hover:border-casino-gold'
                      }
                    `}
                  >
                    {number}
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
                  selectedBet?.type ===
                  option.key;

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
                  selectedBet?.type ===
                  option.key;

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

          {/* Columns */}
          <div className="bg-black/75 border border-casino-border rounded-2xl p-4 mb-6">
            <div className="text-center text-gray-300 font-bold mb-3">
              COLUMNAS
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {COLUMN_BETS.map(option => {
                const selected =
                  selectedBet?.type ===
                  option.key;

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

                    <div className="text-xs text-gray-400 mt-1">
                      {option.mult}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current bet */}
          {selectedBet && (
            <div className="text-center mb-4">
              <span className="text-gray-400">
                Apuesta seleccionada:{' '}
              </span>

              <span className="text-casino-gold font-bold">
                {selectedBet.type === 'NUMBER'
                  ? `Número ${selectedBet.value}`
                  : selectedBet.type}
              </span>

              <span className="text-gray-400">
                {' '}· {bet}
              </span>
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

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-gray-400">
                    Apuesta
                  </div>
                  <div className="text-casino-gold font-bold text-lg">
                    {lastResult.bet.amount}
                  </div>
                </div>

                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-gray-400">
                    Multiplicador
                  </div>
                  <div className="text-casino-gold font-bold text-lg">
                    x{lastResult.multiplier}
                  </div>
                </div>

                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-gray-400">
                    Premio
                  </div>
                  <div
                    className={`
                      font-bold
                      text-lg
                      ${
                        isWin
                          ? 'text-green-400'
                          : 'text-gray-300'
                      }
                    `}
                  >
                    {lastResult.win}
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