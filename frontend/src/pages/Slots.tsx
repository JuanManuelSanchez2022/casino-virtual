import React, { useEffect, useRef, useState } from 'react';
import { useSlots } from '../hooks/useSlots';
import { useWallet } from '../hooks/useWallet';

interface SlotsProps {
  onBack?: () => void;
}

const SYMBOL_IMAGES: Record<number, string> = {
  1: '/assets/slots/cherry.png',
  2: '/assets/slots/lemon.png',
  3: '/assets/slots/orange.png',
  4: '/assets/slots/bell.png',
  5: '/assets/slots/heart.png',
  6: '/assets/slots/bar.png',
  7: '/assets/slots/seven.png',
  8: '/assets/slots/diamond.png',
};

const SYMBOL_NAMES: Record<number, string> = {
  1: 'Cereza',
  2: 'Limón',
  3: 'Naranja',
  4: 'Campana',
  5: 'Corazón',
  6: 'BAR',
  7: '7',
  8: 'Diamante',
};

const PAYTABLE = [
  { symbol: 7, multiplier: 'x50' },
  { symbol: 8, multiplier: 'x30' },
  { symbol: 6, multiplier: 'x20' },
  { symbol: 4, multiplier: 'x15' },
  { symbol: 5, multiplier: 'x10' },
  { symbol: 1, multiplier: 'x8' },
  { symbol: 2, multiplier: 'x6' },
  { symbol: 3, multiplier: 'x5' },
];

const BET_OPTIONS = [1, 2, 5, 10, 20, 50, 100, 500];

/*
 * Líneas de pago posibles.
 *
 * 0 = fila superior
 * 1 = fila central
 * 2 = fila inferior
 */
const PAYLINES: number[][] = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
];

interface WinningPosition {
  reel: number;
  row: number;
}

interface WinningLine {
  positions: WinningPosition[];
  lineIndex?: number;
  win?: number;
}

/*
 * Convierte la información recibida desde el backend
 * en posiciones que podemos dibujar sobre los carretes.
 */
const normalizeWinningLines = (
  winningLines: any[]
): WinningLine[] => {
  if (!Array.isArray(winningLines)) {
    return [];
  }

  const normalized: WinningLine[] = [];

  winningLines.forEach((line: any, index: number) => {
    if (Array.isArray(line?.positions)) {
      const positions = line.positions
        .map((position: any) => {
          const reel =
            position?.reel ??
            position?.column ??
            position?.col;

          const row =
            position?.row ??
            position?.line;

          if (
            typeof reel === 'number' &&
            typeof row === 'number'
          ) {
            return {
              reel,
              row,
            };
          }

          return null;
        })
        .filter(Boolean) as WinningPosition[];

      if (positions.length > 0) {
        normalized.push({
          positions,
          lineIndex:
            typeof line.lineIndex === 'number'
              ? line.lineIndex
              : index,
          win:
            typeof line.win === 'number'
              ? line.win
              : undefined,
        });

        return;
      }
    }

    const lineIndex =
      typeof line === 'number'
        ? line
        : typeof line?.line === 'number'
        ? line.line
        : typeof line?.lineIndex === 'number'
        ? line.lineIndex
        : index;

    if (
      lineIndex >= 0 &&
      lineIndex < PAYLINES.length
    ) {
      normalized.push({
        positions: PAYLINES[lineIndex].map(
          (row, reel) => ({
            reel,
            row,
          })
        ),
        lineIndex,
        win:
          typeof line?.win === 'number'
            ? line.win
            : undefined,
      });
    }
  });

  return normalized;
};

export default function Slots({ onBack }: SlotsProps) {
  const { spinning, spin } = useSlots();
  const { wallet, updateBalance } = useWallet();

  const [bet, setBet] = useState(100);

  const [reels, setReels] = useState<number[][]>([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 1],
    [2, 3, 4],
    [5, 6, 7],
  ]);

  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [error, setError] = useState('');

  const [winningLines, setWinningLines] = useState<
    WinningLine[]
  >([]);

  const winTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const spinAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const winAudioRef =
    useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    spinAudioRef.current = new Audio(
      '/assets/sounds/hitech_slot.ogg'
    );

    winAudioRef.current = new Audio(
      '/assets/sounds/you-win.mp3'
    );

    spinAudioRef.current.preload = 'auto';
    winAudioRef.current.preload = 'auto';

    return () => {
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current.currentTime = 0;
      }

      if (winAudioRef.current) {
        winAudioRef.current.pause();
        winAudioRef.current.currentTime = 0;
      }

      if (winTimeoutRef.current) {
        clearTimeout(winTimeoutRef.current);
      }
    };
  }, []);

  const randomSymbol = () => {
    return Math.floor(Math.random() * 8) + 1;
  };

  const animateReels = async (
    resultSymbols: number[][]
  ) => {
    const durations = [
      600,
      900,
      1200,
      1500,
      1800,
    ];

    const animations = durations.map(
      (duration, reelIndex) => {
        return new Promise<void>(resolve => {
          const interval = setInterval(() => {
            setReels(previous => {
              const next = previous.map(
                (reel, index) => {
                  if (index !== reelIndex) {
                    return reel;
                  }

                  return [
                    randomSymbol(),
                    randomSymbol(),
                    randomSymbol(),
                  ];
                }
              );

              return next;
            });
          }, 80);

          setTimeout(() => {
            clearInterval(interval);

            setReels(previous => {
              const next = [...previous];

              next[reelIndex] =
                resultSymbols[reelIndex];

              return next;
            });

            resolve();
          }, duration);
        });
      }
    );

    await Promise.all(animations);
  };

  const isWinningPosition = (
    reel: number,
    row: number
  ) => {
    return winningLines.some(line =>
      line.positions.some(
        position =>
          position.reel === reel &&
          position.row === row
      )
    );
  };

  const getWinningPositions = (): WinningPosition[] => {
    const positions: WinningPosition[] = [];

    winningLines.forEach(line => {
      line.positions.forEach(position => {
        const exists = positions.some(
          existing =>
            existing.reel === position.reel &&
            existing.row === position.row
        );

        if (!exists) {
          positions.push(position);
        }
      });
    });

    return positions;
  };

  const handleSpin = async () => {
    if (spinning) {
      return;
    }

    if (!wallet) {
      setError('No se encontró la billetera.');
      return;
    }

    if (bet > wallet.balance) {
      setError('Saldo insuficiente.');
      return;
    }

    setError('');
    setShowWin(false);
    setWinAmount(0);
    setWinningLines([]);

    if (winTimeoutRef.current) {
      clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = null;
    }

    if (winAudioRef.current) {
      winAudioRef.current.pause();
      winAudioRef.current.currentTime = 0;
    }

    if (spinAudioRef.current) {
      spinAudioRef.current.pause();
      spinAudioRef.current.currentTime = 0;

      spinAudioRef.current.play().catch(error => {
        console.warn(
          'No se pudo reproducir el sonido de giro:',
          error
        );
      });
    }

    try {
      const result = await spin(bet);

      await animateReels(result.symbols);

      updateBalance(result.balance);

      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current.currentTime = 0;
      }

      if (result.win > 0) {
        const normalized =
          normalizeWinningLines(
            result.winningLines
          );

        setWinningLines(normalized);

        setWinAmount(result.win);
        setShowWin(true);

        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0;

          winAudioRef.current.play().catch(error => {
            console.warn(
              'No se pudo reproducir el sonido de victoria:',
              error
            );
          });
        }

        winTimeoutRef.current = setTimeout(() => {
          setShowWin(false);
          setWinAmount(0);
          setWinningLines([]);
          winTimeoutRef.current = null;
        }, 3000);
      }
    } catch (error: any) {
      console.error(
        'Error al girar:',
        error
      );

      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current.currentTime = 0;
      }

      setError(
        error?.message ||
          'No se pudo realizar la jugada.'
      );
    }
  };

  const selectBet = (amount: number) => {
    if (spinning) {
      return;
    }

    setBet(amount);
    setError('');
  };

  const canSpin =
    !spinning &&
    !!wallet &&
    wallet.balance >= bet;

  const winningPositions =
    getWinningPositions();

  const hasWinningResult =
    winningLines.length > 0;

  return (
    <div className="relative min-h-screen text-white">

      {/* ===================================================== */}
      {/* BACKGROUND - CAPA INDEPENDIENTE                      */}
      {/* ===================================================== */}

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

      {/* ===================================================== */}
      {/* CAPA OSCURA MUY SUAVE PARA MEJORAR LEGIBILIDAD       */}
      {/* ===================================================== */}

      <div
        className="
          fixed
          inset-0
          z-0
          bg-black/20
          pointer-events-none
        "
      />

      {/* ===================================================== */}
      {/* CONTENIDO DEL JUEGO                                  */}
      {/* ===================================================== */}

      <div className="relative z-10 min-h-screen p-4">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">

          <div>
            <h1 className="text-3xl font-bold text-casino-gold">
              🎰 Tragamonedas
            </h1>

            <p className="text-gray-300 mt-1">
              Probá tu suerte con créditos virtuales
            </p>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="
                px-4
                py-2
                bg-casino-darker/90
                border
                border-casino-border
                rounded-lg
                hover:border-casino-gold
                transition
              "
            >
              Volver
            </button>
          )}

        </div>

        {/* MÁQUINA */}
        <div
          className="
            bg-casino-darker/95
            backdrop-blur-sm
            border
            border-casino-border
            rounded-2xl
            p-4
            md:p-8
            shadow-2xl
          "
        >

          {/* DISPLAY */}
          <div
            className="
              bg-black
              border-4
              border-casino-gold
              rounded-xl
              p-3
              md:p-5
            "
          >

            {/* ÁREA DE CARRETES */}
            <div className="relative">

              {/* REELS */}
              <div className="grid grid-cols-5 gap-2 md:gap-3">

                {reels.map(
                  (reel, reelIndex) => (
                    <div
                      key={reelIndex}
                      className="flex flex-col gap-2"
                    >

                      {reel.map(
                        (symbol, rowIndex) => {

                          const isWinner =
                            isWinningPosition(
                              reelIndex,
                              rowIndex
                            );

                          return (
                            <div
                              key={`${reelIndex}-${rowIndex}`}
                              className={`
                                relative
                                aspect-square
                                bg-white
                                rounded-lg
                                flex
                                items-center
                                justify-center
                                overflow-visible
                                border-2
                                border-gray-300
                                shadow-inner
                                transition-all
                                duration-300

                                ${
                                  spinning
                                    ? 'animate-pulse'
                                    : ''
                                }

                                ${
                                  hasWinningResult &&
                                  !isWinner
                                    ? 'opacity-30 grayscale'
                                    : ''
                                }

                                ${
                                  isWinner
                                    ? 'scale-105 z-20'
                                    : ''
                                }
                              `}
                            >

                              {/* IMAGEN DEL SÍMBOLO */}
                              {SYMBOL_IMAGES[symbol] ? (
                                <img
                                  src={
                                    SYMBOL_IMAGES[
                                      symbol
                                    ]
                                  }
                                  alt={
                                    SYMBOL_NAMES[
                                      symbol
                                    ] ||
                                    'Símbolo'
                                  }
                                  className={`
                                    w-full
                                    h-full
                                    object-contain
                                    p-1
                                    transition-all
                                    duration-300

                                    ${
                                      isWinner
                                        ? `
                                          drop-shadow-[0_0_10px_rgba(255,215,0,1)]
                                          drop-shadow-[0_0_20px_rgba(255,180,0,0.8)]
                                        `
                                        : ''
                                    }
                                  `}
                                />
                              ) : (
                                <span className="text-4xl">
                                  ❓
                                </span>
                              )}

                              {/* NODO GANADOR */}
                              {isWinner && (
                                <>
                                  <div
                                    className="
                                      absolute
                                      left-1/2
                                      top-1/2
                                      -translate-x-1/2
                                      -translate-y-1/2
                                      w-5
                                      h-5
                                      md:w-6
                                      md:h-6
                                      rounded-full
                                      bg-casino-gold
                                      border-2
                                      border-white
                                      shadow-[0_0_8px_rgba(255,215,0,1),0_0_20px_rgba(255,180,0,0.9)]
                                      animate-pulse
                                      z-30
                                      pointer-events-none
                                    "
                                  />

                                  <div
                                    className="
                                      absolute
                                      left-1/2
                                      top-1/2
                                      -translate-x-1/2
                                      -translate-y-1/2
                                      w-10
                                      h-10
                                      rounded-full
                                      border
                                      border-casino-gold
                                      opacity-70
                                      animate-ping
                                      z-20
                                      pointer-events-none
                                    "
                                  />
                                </>
                              )}

                            </div>
                          );
                        }
                      )}

                    </div>
                  )
                )}

              </div>

              {/* LÍNEAS GANADORAS */}
              {hasWinningResult && (
                <svg
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    pointer-events-none
                    z-40
                    overflow-visible
                  "
                  viewBox="0 0 500 300"
                  preserveAspectRatio="none"
                >

                  <defs>

                    {/* BRILLO */}
                    <filter
                      id="goldGlow"
                      x="-100%"
                      y="-100%"
                      width="300%"
                      height="300%"
                    >

                      <feGaussianBlur
                        stdDeviation="3"
                        result="blur"
                      />

                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>

                    </filter>

                    {/* GRADIENTE DORADO */}
                    <linearGradient
                      id="paylineGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >

                      <stop
                        offset="0%"
                        stopColor="#fff7a8"
                      />

                      <stop
                        offset="50%"
                        stopColor="#ffd700"
                      />

                      <stop
                        offset="100%"
                        stopColor="#fff7a8"
                      />

                    </linearGradient>

                  </defs>

                  {winningLines.map(
                    (line, lineIndex) => {

                      if (
                        line.positions.length === 0
                      ) {
                        return null;
                      }

                      const points =
                        line.positions.map(
                          position => {

                            const x =
                              ((position.reel +
                                0.5) /
                                5) *
                              500;

                            const y =
                              ((position.row +
                                0.5) /
                                3) *
                              300;

                            return `${x},${y}`;
                          }
                        );

                      const pointsString =
                        points.join(' ');

                      return (
                        <g
                          key={`winning-line-${lineIndex}`}
                        >

                          {/* HALO EXTERIOR */}
                          <polyline
                            points={
                              pointsString
                            }
                            fill="none"
                            stroke="#ffd700"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.15"
                            filter="url(#goldGlow)"
                          />

                          {/* LÍNEA DORADA */}
                          <polyline
                            points={
                              pointsString
                            }
                            fill="none"
                            stroke="url(#paylineGradient)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#goldGlow)"
                          />

                          {/* CENTRO BLANCO */}
                          <polyline
                            points={
                              pointsString
                            }
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.85"
                          />

                          {/* NODOS */}
                          {line.positions.map(
                            (
                              position,
                              positionIndex
                            ) => {

                              const cx =
                                ((position.reel +
                                  0.5) /
                                  5) *
                                500;

                              const cy =
                                ((position.row +
                                  0.5) /
                                  3) *
                                300;

                              return (
                                <g
                                  key={`node-${lineIndex}-${positionIndex}`}
                                >

                                  {/* HALO */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r="14"
                                    fill="#ffd700"
                                    opacity="0.18"
                                    filter="url(#goldGlow)"
                                  />

                                  {/* NODO */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r="6"
                                    fill="#ffd700"
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                    filter="url(#goldGlow)"
                                  />

                                  {/* PUNTO CENTRAL */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r="2"
                                    fill="#ffffff"
                                  />

                                </g>
                              );
                            }
                          )}

                        </g>
                      );
                    }
                  )}

                </svg>
              )}

            </div>

          </div>

          {/* INDICADOR DE COMBINACIÓN */}
          {winningPositions.length > 0 && (
            <div
              className="
                mt-4
                text-center
                text-sm
                text-casino-gold
                font-semibold
                animate-pulse
              "
            >
              ✨ Combinación ganadora encontrada
            </div>
          )}

          {/* WIN MESSAGE */}
          {showWin && (
            <div
              className="
                mt-6
                bg-gradient-to-r
                from-yellow-600
                via-yellow-400
                to-yellow-600
                text-black
                rounded-xl
                p-5
                text-center
                shadow-lg
                animate-pulse
              "
            >

              <div className="text-4xl font-black">
                🎉 ¡GANASTE! 🎉
              </div>

              <div className="text-2xl font-bold mt-2">
                +{winAmount.toLocaleString()} créditos
              </div>

            </div>
          )}

          {/* ERROR */}
          {error && (
            <div
              className="
                mt-4
                bg-red-900/40
                border
                border-red-500
                text-red-200
                rounded-lg
                p-3
                text-center
              "
            >
              {error}
            </div>
          )}

          {/* CONTROLES */}
          <div
            className="
              mt-6
              flex
              flex-col
              md:flex-row
              items-center
              justify-between
              gap-5
            "
          >

            {/* APUESTA */}
            <div className="w-full md:w-auto">

              <div
                className="
                  text-gray-300
                  font-medium
                  text-center
                  mb-2
                "
              >
                Apuesta
              </div>

              <div
                className="
                  flex
                  flex-wrap
                  justify-center
                  gap-2
                "
              >

                {BET_OPTIONS.map(amount => {

                  const selected =
                    bet === amount;

                  return (
                    <button
                      key={amount}
                      onClick={() =>
                        selectBet(amount)
                      }
                      disabled={spinning}
                      className={`
                        min-w-[52px]
                        px-3
                        py-2
                        rounded-lg
                        font-bold
                        border
                        transition-all
                        duration-150

                        ${
                          selected
                            ? `
                              bg-casino-gold
                              text-black
                              border-casino-gold
                              shadow-[0_0_14px_rgba(255,215,0,0.75)]
                              scale-105
                            `
                            : `
                              bg-black
                              text-gray-300
                              border-casino-border
                              hover:border-casino-gold
                              hover:text-casino-gold
                              hover:bg-gray-900
                            `
                        }

                        ${
                          spinning
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }
                      `}
                    >
                      {amount}
                    </button>
                  );
                })}

              </div>

              <div
                className="
                  text-center
                  text-xs
                  text-gray-500
                  mt-2
                "
              >
                Créditos por giro
              </div>

            </div>

            {/* GIRAR */}
            <button
              onClick={handleSpin}
              disabled={!canSpin}
              className={`
                px-10
                py-4
                rounded-xl
                font-black
                text-xl
                uppercase
                tracking-wider
                transition-all

                ${
                  canSpin
                    ? `
                      bg-casino-gold
                      text-black
                      hover:scale-105
                      hover:shadow-lg
                    `
                    : `
                      bg-gray-700
                      text-gray-400
                      cursor-not-allowed
                    `
                }
              `}
            >
              {spinning
                ? 'Girando...'
                : '🎰 GIRAR'}
            </button>

            {/* SALDO */}
            <div
              className="
                text-center
                md:text-right
              "
            >

              <div className="text-sm text-gray-400">
                Saldo
              </div>

              <div
                className="
                  text-2xl
                  font-bold
                  text-casino-gold
                "
              >
                {wallet
                  ? wallet.balance.toLocaleString()
                  : '0'}
              </div>

              <div
                className="
                  text-xs
                  text-gray-500
                "
              >
                créditos virtuales
              </div>

            </div>

          </div>
        </div>

        {/* TABLA DE PREMIOS */}
        <div
          className="
            mt-8
            bg-casino-darker/95
            backdrop-blur-sm
            border
            border-casino-border
            rounded-xl
            p-5
          "
        >

          <h2
            className="
              text-xl
              font-bold
              text-casino-gold
              mb-4
            "
          >
            Tabla de premios
          </h2>

          <div
            className="
              grid
              grid-cols-2
              md:grid-cols-4
              gap-3
            "
          >

            {PAYTABLE.map(item => (

              <div
                key={item.symbol}
                className="
                  bg-black
                  rounded-lg
                  p-3
                  flex
                  items-center
                  justify-between
                  border
                  border-casino-border
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  <div
                    className="
                      w-10
                      h-10
                      bg-white
                      rounded-md
                      flex
                      items-center
                      justify-center
                    "
                  >

                    <img
                      src={
                        SYMBOL_IMAGES[
                          item.symbol
                        ]
                      }
                      alt={
                        SYMBOL_NAMES[
                          item.symbol
                        ]
                      }
                      className="
                        w-full
                        h-full
                        object-contain
                        p-1
                      "
                    />

                  </div>

                  <span
                    className="
                      text-sm
                      text-gray-300
                    "
                  >
                    {
                      SYMBOL_NAMES[
                        item.symbol
                      ]
                    }
                  </span>

                </div>

                <span
                  className="
                    font-bold
                    text-casino-gold
                  "
                >
                  {item.multiplier}
                </span>

              </div>

            ))}

          </div>

          <div
            className="
              mt-4
              text-sm
              text-gray-500
            "
          >
            Los premios dependen de las combinaciones obtenidas
            y se calculan en el servidor.
          </div>

        </div>

      </div>
    </div>
  );
}





