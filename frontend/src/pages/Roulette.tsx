import { useState, useCallback } from 'react';
import {
  useRoulette,
  type RouletteBet,
  type RouletteBetType,
} from '../hooks/useRoulette';
import { useWallet } from '../hooks/useWallet';

const BET_OPTIONS = [1, 2, 5, 10, 20, 50, 100, 500];

const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
];

const TABLE_ROWS: number[][] = [
  Array.from({ length: 12 }, (_, i) => 1 + i * 3),
  Array.from({ length: 12 }, (_, i) => 2 + i * 3),
  Array.from({ length: 12 }, (_, i) => 3 + i * 3),
];

const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13,
  36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20,
  14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const SEGMENT_ANGLE = 360 / 37;
const FULL_ROTATIONS = 5;
const ANIMATION_DURATION_MS = 5000;

/*
 * Calcula una rotación SIEMPRE hacia adelante.
 *
 * Esto evita que la ruleta pueda hacer:
 * acelerar -> casi detenerse -> volver a acelerar.
 *
 * El número sorteado por backend sigue siendo la única
 * fuente de verdad.
 */
const calculateTargetRotation = (
  winningNumber: number,
  currentRotation: number
): number => {
  const index = WHEEL_ORDER.indexOf(winningNumber);

  if (index === -1) {
    return currentRotation + FULL_ROTATIONS * 360;
  }

  const targetAngle = -(index * SEGMENT_ANGLE);

  const normalizedTarget =
    ((targetAngle % 360) + 360) % 360;

  const currentNormalized =
    ((currentRotation % 360) + 360) % 360;

  /*
   * Delta POSITIVO.
   *
   * La ruleta nunca retrocede para buscar el número.
   */
  const forwardDelta =
    (normalizedTarget - currentNormalized + 360) % 360;

  return (
    currentRotation +
    FULL_ROTATIONS * 360 +
    forwardDelta
  );
};

const getNumberColor = (
  n: number
): 'red' | 'black' | 'green' => {
  if (n === 0) return 'green';

  return RED_NUMBERS.includes(n)
    ? 'red'
    : 'black';
};

const getColorName = (
  n: number
): string => {
  if (n === 0) return 'VERDE';

  return RED_NUMBERS.includes(n)
    ? 'ROJO'
    : 'NEGRO';
};

const getBetLabel = (
  bet: RouletteBet
): string => {
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

const getPayoutMultiplier = (
  type: RouletteBetType
): number => {
  if (type === 'NUMBER') return 36;

  if (
    type === 'DOZEN_1' ||
    type === 'DOZEN_2' ||
    type === 'DOZEN_3' ||
    type === 'COLUMN_1' ||
    type === 'COLUMN_2' ||
    type === 'COLUMN_3'
  ) {
    return 3;
  }

  return 2;
};

/*
 * Determina si una apuesta ganó según el número sorteado.
 */
const isWinningBet = (
  bet: RouletteBet,
  winningNumber: number
): boolean => {
  switch (bet.type) {
    case 'NUMBER':
      return bet.value === winningNumber;

    case 'RED':
      return (
        winningNumber !== 0 &&
        RED_NUMBERS.includes(winningNumber)
      );

    case 'BLACK':
      return (
        winningNumber !== 0 &&
        !RED_NUMBERS.includes(winningNumber)
      );

    case 'EVEN':
      return (
        winningNumber !== 0 &&
        winningNumber % 2 === 0
      );

    case 'ODD':
      return (
        winningNumber !== 0 &&
        winningNumber % 2 !== 0
      );

    case 'LOW':
      return (
        winningNumber >= 1 &&
        winningNumber <= 18
      );

    case 'HIGH':
      return (
        winningNumber >= 19 &&
        winningNumber <= 36
      );

    case 'DOZEN_1':
      return (
        winningNumber >= 1 &&
        winningNumber <= 12
      );

    case 'DOZEN_2':
      return (
        winningNumber >= 13 &&
        winningNumber <= 24
      );

    case 'DOZEN_3':
      return (
        winningNumber >= 25 &&
        winningNumber <= 36
      );

    case 'COLUMN_1':
      return (
        winningNumber >= 1 &&
        winningNumber <= 36 &&
        winningNumber % 3 === 1
      );

    case 'COLUMN_2':
      return (
        winningNumber >= 1 &&
        winningNumber <= 36 &&
        winningNumber % 3 === 2
      );

    case 'COLUMN_3':
      return (
        winningNumber >= 1 &&
        winningNumber <= 36 &&
        winningNumber % 3 === 0
      );

    default:
      return false;
  }
};

const isBetSelected = (
  selectedBets: RouletteBet[],
  type: RouletteBetType,
  value?: number
): boolean => {
  return selectedBets.some(
    (b) =>
      b.type === type &&
      (b.value ?? null) === (value ?? null)
  );
};

const getBetAmount = (
  selectedBets: RouletteBet[],
  type: RouletteBetType,
  value?: number
): number | null => {
  const bet = selectedBets.find(
    (b) =>
      b.type === type &&
      (b.value ?? null) === (value ?? null)
  );

  return bet ? bet.amount : null;
};

const EVEN_BETS: {
  key: RouletteBetType;
  label: string;
  sub: string;
}[] = [
  {
    key: 'RED',
    label: 'ROJO',
    sub: 'x2',
  },
  {
    key: 'BLACK',
    label: 'NEGRO',
    sub: 'x2',
  },
  {
    key: 'EVEN',
    label: 'PAR',
    sub: 'x2',
  },
  {
    key: 'ODD',
    label: 'IMPAR',
    sub: 'x2',
  },
  {
    key: 'LOW',
    label: '1 - 18',
    sub: 'x2',
  },
  {
    key: 'HIGH',
    label: '19 - 36',
    sub: 'x2',
  },
];

const DOZEN_BETS: {
  key: RouletteBetType;
  label: string;
  sub: string;
  mult: string;
}[] = [
  {
    key: 'DOZEN_1',
    label: '1ª DOCENA',
    sub: '1 - 12',
    mult: 'x3',
  },
  {
    key: 'DOZEN_2',
    label: '2ª DOCENA',
    sub: '13 - 24',
    mult: 'x3',
  },
  {
    key: 'DOZEN_3',
    label: '3ª DOCENA',
    sub: '25 - 36',
    mult: 'x3',
  },
];

const COLUMN_BETS: {
  key: RouletteBetType;
  label: string;
  mult: string;
}[] = [
  {
    key: 'COLUMN_1',
    label: '1ª COLUMNA',
    mult: 'x3',
  },
  {
    key: 'COLUMN_2',
    label: '2ª COLUMNA',
    mult: 'x3',
  },
  {
    key: 'COLUMN_3',
    label: '3ª COLUMNA',
    mult: 'x3',
  },
];

type WinningBetDetail = {
  label: string;
  amount: number;
  multiplier: number;
  win: number;
};

type ResultSummary = {
  number: number;
  color: string;
  totalBet: number;
  totalWin: number;
  winningBets: WinningBetDetail[];
};

export default function Roulette() {
  const {
    playing,
    lastResult,
    play,
  } = useRoulette();

  const {
    wallet,
    updateBalance,
  } = useWallet();

  const [stake, setStake] = useState(100);

  const [selectedBets, setSelectedBets] =
    useState<RouletteBet[]>([]);

  const [error, setError] =
    useState('');

  const [animating, setAnimating] =
    useState(false);

  const [showResult, setShowResult] =
    useState(false);

  const [wheelRotation, setWheelRotation] =
    useState(0);

  const [resultSummary, setResultSummary] =
    useState<ResultSummary | null>(null);

  const totalBet =
    selectedBets.reduce(
      (sum, b) => sum + b.amount,
      0
    );

  const addBet = useCallback(
    (
      type: RouletteBetType,
      value?: number
    ) => {
      const newBet: RouletteBet = {
        type,
        value,
        amount: stake,
      };

      setSelectedBets((prev) => {
        for (
          let i = 0;
          i < prev.length;
          i++
        ) {
          const existing = prev[i];

          if (
            existing.type === type &&
            (existing.value ?? null) ===
              (value ?? null)
          ) {
            const updated = [...prev];

            updated[i] = {
              ...existing,
              amount:
                existing.amount + stake,
            };

            return updated;
          }
        }

        return [...prev, newBet];
      });
    },
    [stake]
  );

  const removeBet = useCallback(
    (index: number) => {
      setSelectedBets((prev) =>
        prev.filter((_, i) => i !== index)
      );
    },
    []
  );

  const clearBets = useCallback(() => {
    setSelectedBets([]);
  }, []);

  const handleSelectNumber = (
    number: number
  ) => {
    if (playing || animating) return;

    addBet('NUMBER', number);
    setError('');
  };

  const handleSelectBetType = (
    type: RouletteBetType
  ) => {
    if (playing || animating) return;

    addBet(type);
    setError('');
  };

  const handleBetChange = (
    amount: number
  ) => {
    if (playing || animating) return;

    setStake(amount);
    setError('');
  };

  const handlePlay = async () => {
    if (playing || animating) return;

    if (selectedBets.length === 0) {
      setError(
        'Elegí al menos una apuesta.'
      );
      return;
    }

    if (!wallet) {
      setError(
        'Billetera no encontrada.'
      );
      return;
    }

    if (wallet.balance < totalBet) {
      setError(
        'Saldo insuficiente.'
      );
      return;
    }

    setError('');
    setShowResult(false);
    setResultSummary(null);
    setAnimating(true);

    try {
      /*
       * El backend realiza el sorteo.
       *
       * NO generamos otro número en frontend.
       */
      const result =
        await play(selectedBets);

      const winningNumber =
        result.result.number;

      /*
       * Calculamos la posición final de la ruleta
       * utilizando exclusivamente el número entregado
       * por el backend.
       */
      const targetRotation =
        calculateTargetRotation(
          winningNumber,
          wheelRotation
        );

      setWheelRotation(
        targetRotation
      );

      /*
       * Guardamos las apuestas actuales antes de que
       * termine la animación.
       */
      const playedBets =
        [...selectedBets];

      const playedTotalBet =
        totalBet;

      const winningBets:
        WinningBetDetail[] = [];

      for (
        let i = 0;
        i < playedBets.length;
        i++
      ) {
        const bet =
          playedBets[i];

        if (
          isWinningBet(
            bet,
            winningNumber
          )
        ) {
          const multiplier =
            getPayoutMultiplier(
              bet.type
            );

          const win =
            bet.amount * multiplier;

          winningBets.push({
            label:
              getBetLabel(bet),
            amount:
              bet.amount,
            multiplier,
            win,
          });
        }
      }

      /*
       * El backend sigue siendo la fuente de verdad
       * para la ganancia total.
       */
      const totalWin =
        Number(
          result.totalWin ?? 0
        );

      setTimeout(() => {
        updateBalance(
          result.balance
        );

        setResultSummary({
          number:
            winningNumber,
          color:
            getColorName(
              winningNumber
            ),
          totalBet:
            playedTotalBet,
          totalWin,
          winningBets,
        });

        setShowResult(true);
        setAnimating(false);
      }, ANIMATION_DURATION_MS);

    } catch (e: any) {
      setAnimating(false);

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

  return (
    <div className="relative min-h-screen text-white overflow-x-visible">

      {/* ===================================================== */}
      {/* BACKGROUND                                            */}
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

      {/* ===================================================== */}
      {/* CONTENT                                               */}
      {/* ===================================================== */}

      <div className="relative z-10 min-h-screen p-4 pb-10">

        <div className="max-w-6xl mx-0 px-4 py-8 relative left-[-350px]">

          {/* ================================================= */}
          {/* HEADER                                            */}
          {/* ================================================= */}

          <div className="text-center mb-6">

            <h1 className="text-4xl md:text-5xl font-black text-casino-gold">
              🎰 RULETA
            </h1>

            <p className="text-gray-300 mt-1">
              Ruleta Europea · 0 - 36
            </p>

          </div>


          {/* ================================================= */}
          {/* BALANCE                                           */}
          {/* ================================================= */}

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
                  {wallet.balance.toLocaleString(
                    'es-AR'
                  )}
                </span>

              </div>

            </div>
          )}


          {/* ===================================================== */}
          {/* GAME LAYOUT                                           */}
          {/* ROULETTE | PAÑO | MIS APUESTAS                       */}
          {/* ===================================================== */}

          <div
            className="
              flex
              flex-col
              lg:grid
              lg:grid-cols-[600px_680px_180px]
              gap-2
              items-start
            "
          >

            {/* ================================================= */}
            {/* BOX 1: ROULETTE                                  */}
            {/* ================================================= */}

            <div
              className="
                relative
                w-[600px]
                h-[600px]
                ml-[0px]
                lg:mb-0
              "
            >

              {/* Outer frame - FIXED */}
              <img
                src="/assets/games/ruleta-borde.png"
                alt="Ruleta borde"
                className="
                  absolute
                  inset-0
                  w-full
                  h-full
                  object-contain
                  z-0
                  pointer-events-none
                "
                draggable={false}
              />

              {/* Inner wheel - ROTATES */}
              <img
                src="/assets/games/ruleta-centro.png"
                alt="Ruleta centro"
                className="
                  absolute
                  top-1/2
                  left-1/2
                  z-10
                  will-change-transform
                "
                style={{
                  width: '525px',
                  height: '525px',

                  transform:
                    `translate(-50%, -50%) rotate(${wheelRotation}deg)`,

                  transformOrigin:
                    'center center',

                  /*
                   * Desaceleración progresiva.
                   *
                   * No utilizamos el cubic-bezier anterior
                   * que podía generar una variación de
                   * velocidad poco natural.
                   */
                  transition:
                    `${ANIMATION_DURATION_MS}ms cubic-bezier(0.12, 0.72, 0.22, 1)`,
                }}
                draggable={false}
              />

              {/* Winning number indicator */}
              {showResult &&
                lastResult && (
                  <div
                    className="
                      absolute
                      top-1/2
                      left-1/2
                      -translate-x-1/2
                      -translate-y-1/2
                      z-20
                      flex
                      items-center
                      justify-center
                    "
                  >

                    <span className="text-4xl font-bold text-casino-gold">
                      {lastResult.result.number}
                    </span>

                  </div>
                )}

            </div>


            {/* ================================================= */}
            {/* BOX 2: BETTING PAD                               */}
            {/* ================================================= */}

            <div
              className="
                flex
                flex-col
                w-[680px]
                min-w-[680px]
              "
            >

              {/* ================================================= */}
              {/* BETTING AMOUNT                                     */}
              {/* ================================================= */}

              <div className="mb-6">

                <div className="text-gray-300 font-medium text-center mb-2">
                  Apuesta
                </div>

                <div className="flex flex-wrap justify-center gap-2">

                  {BET_OPTIONS.map(
                    (amount) => (
                      <button
                        key={amount}
                        onClick={() =>
                          handleBetChange(
                            amount
                          )
                        }
                        disabled={
                          playing ||
                          animating
                        }
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
                    )
                  )}

                </div>

              </div>


              {/* ================================================= */}
              {/* BETTING TABLE                                     */}
              {/* ================================================= */}

              <div
                className="
                  bg-black/75
                  border
                  border-casino-border
                  rounded-2xl
                  p-4
                  mb-6
                "
              >

                <div className="text-center text-gray-300 font-bold mb-3">
                  TABLERO DE APUESTAS
                </div>


                {/* ZERO + NUMBER GRID */}

                <div
                  className="
                    grid
                    grid-cols-[48px_repeat(12,minmax(0,1fr))]
                    grid-rows-[repeat(3,44px)]
                    gap-1
                  "
                >

                  {/* ZERO */}

                  <button
                    onClick={() =>
                      handleSelectNumber(0)
                    }
                    disabled={
                      playing ||
                      animating
                    }
                    className={`
                      row-span-3
                      h-[134px]
                      rounded-md
                      font-black
                      border-2
                      transition-all
                      relative

                      ${
                        isBetSelected(
                          selectedBets,
                          'NUMBER',
                          0
                        )
                          ? 'ring-2 ring-casino-gold scale-105 shadow-[0_0_12px_rgba(255,215,0,0.8)]'
                          : 'hover:scale-105 hover:border-casino-gold'
                      }

                      bg-green-700
                      border-green-500
                    `}
                  >

                    <div className="flex flex-col items-center justify-center h-full">

                      <span>
                        0
                      </span>

                      {getBetAmount(
                        selectedBets,
                        'NUMBER',
                        0
                      ) !== null && (
                        <span className="text-xs text-casino-gold">
                          $ {getBetAmount(
                            selectedBets,
                            'NUMBER',
                            0
                          )}
                        </span>
                      )}

                    </div>

                  </button>


                  {/* ================================================= */}
                  {/* ROW 1: 1 4 7 10 ... 34                          */}
                  {/* ================================================= */}

                  {TABLE_ROWS[0].map(
                    (number) => {

                      const color =
                        getNumberColor(
                          number
                        );

                      const selected =
                        isBetSelected(
                          selectedBets,
                          'NUMBER',
                          number
                        );

                      const betAmount =
                        getBetAmount(
                          selectedBets,
                          'NUMBER',
                          number
                        );

                      return (
                        <button
                          key={number}
                          onClick={() =>
                            handleSelectNumber(
                              number
                            )
                          }
                          disabled={
                            playing ||
                            animating
                          }
                          className={`
                            h-[44px]
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

                          <div className="flex flex-col items-center justify-center h-full">

                            <span>
                              {number}
                            </span>

                            {betAmount !==
                              null && (
                              <span className="text-xs text-casino-gold">
                                $ {betAmount}
                              </span>
                            )}

                          </div>

                        </button>
                      );
                    }
                  )}


                  {/* ================================================= */}
                  {/* ROW 2: 2 5 8 11 ... 35                         */}
                  {/* ================================================= */}

                  {TABLE_ROWS[1].map(
                    (number) => {

                      const color =
                        getNumberColor(
                          number
                        );

                      const selected =
                        isBetSelected(
                          selectedBets,
                          'NUMBER',
                          number
                        );

                      const betAmount =
                        getBetAmount(
                          selectedBets,
                          'NUMBER',
                          number
                        );

                      return (
                        <button
                          key={number}
                          onClick={() =>
                            handleSelectNumber(
                              number
                            )
                          }
                          disabled={
                            playing ||
                            animating
                          }
                          className={`
                            h-[44px]
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

                          <div className="flex flex-col items-center justify-center h-full">

                            <span>
                              {number}
                            </span>

                            {betAmount !==
                              null && (
                              <span className="text-xs text-casino-gold">
                                $ {betAmount}
                              </span>
                            )}

                          </div>

                        </button>
                      );
                    }
                  )}


                  {/* ================================================= */}
                  {/* ROW 3: 3 6 9 12 ... 36                        */}
                  {/* ================================================= */}

                  {TABLE_ROWS[2].map(
                    (number) => {

                      const color =
                        getNumberColor(
                          number
                        );

                      const selected =
                        isBetSelected(
                          selectedBets,
                          'NUMBER',
                          number
                        );

                      const betAmount =
                        getBetAmount(
                          selectedBets,
                          'NUMBER',
                          number
                        );

                      return (
                        <button
                          key={number}
                          onClick={() =>
                            handleSelectNumber(
                              number
                            )
                          }
                          disabled={
                            playing ||
                            animating
                          }
                          className={`
                            h-[44px]
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

                          <div className="flex flex-col items-center justify-center h-full">

                            <span>
                              {number}
                            </span>

                            {betAmount !==
                              null && (
                              <span className="text-xs text-casino-gold">
                                $ {betAmount}
                              </span>
                            )}

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>


                {/* ================================================= */}
                {/* COLUMN BETS                                       */}
                {/* ================================================= */}

                <div className="grid grid-cols-3 gap-1 mt-1">

                  {COLUMN_BETS.map(
                    (option) => (
                      <button
                        key={option.key}
                        onClick={() =>
                          handleSelectBetType(
                            option.key
                          )
                        }
                        disabled={
                          playing ||
                          animating
                        }
                        className={`
                          p-2
                          rounded-md
                          border
                          font-bold
                          text-xs
                          transition-all

                          ${
                            isBetSelected(
                              selectedBets,
                              option.key
                            )
                              ? 'border-casino-gold bg-casino-gold/15 shadow-[0_0_10px_rgba(255,215,0,0.6)] scale-[1.02]'
                              : 'border-casino-border bg-casino-darker hover:border-casino-gold hover:text-casino-gold'
                          }
                        `}
                      >

                        <div>
                          {option.label}
                        </div>

                        <div className="text-casino-gold mt-1">
                          {option.mult}
                        </div>

                      </button>
                    )
                  )}

                </div>

              </div>


              {/* ================================================= */}
              {/* EXTERIOR BETS                                    */}
              {/* ================================================= */}

              <div className="mb-6">

                <div className="text-center text-gray-300 font-bold mb-3">
                  APUESTAS EXTERIORES
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">

                  {EVEN_BETS.map(
                    (option) => (
                      <button
                        key={option.key}
                        onClick={() =>
                          handleSelectBetType(
                            option.key
                          )
                        }
                        disabled={
                          playing ||
                          animating
                        }
                        className={`
                          p-3
                          rounded-lg
                          border
                          font-bold
                          transition-all

                          ${
                            isBetSelected(
                              selectedBets,
                              option.key
                            )
                              ? 'border-casino-gold bg-casino-gold/15 shadow-[0_0_10px_rgba(255,215,0,0.6)] scale-[1.02]'
                              : 'border-casino-border bg-black/75 hover:border-casino-gold hover:text-casino-gold'
                          }
                        `}
                      >

                        <div>
                          {option.label}
                        </div>

                        <div className="text-casino-gold text-xs mt-1">
                          {option.sub}
                        </div>

                      </button>
                    )
                  )}

                </div>

              </div>


              {/* ================================================= */}
              {/* DOZENS                                            */}
              {/* ================================================= */}

              <div className="mb-6">

                <div className="text-center text-gray-300 font-bold mb-3">
                  DOCENAS
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">

                  {DOZEN_BETS.map(
                    (option) => (
                      <button
                        key={option.key}
                        onClick={() =>
                          handleSelectBetType(
                            option.key
                          )
                        }
                        disabled={
                          playing ||
                          animating
                        }
                        className={`
                          p-3
                          rounded-lg
                          border
                          font-bold
                          transition-all

                          ${
                            isBetSelected(
                              selectedBets,
                              option.key
                            )
                              ? 'border-casino-gold bg-casino-gold/15 shadow-[0_0_10px_rgba(255,215,0,0.6)] scale-[1.02]'
                              : 'border-casino-border bg-black/75 hover:border-casino-gold hover:text-casino-gold'
                          }
                        `}
                      >

                        <div>
                          {option.label}
                        </div>

                        <div className="text-gray-400 text-xs mt-1">
                          {option.sub}
                        </div>

                        <div className="text-casino-gold text-xs mt-1">
                          {option.mult}
                        </div>

                      </button>
                    )
                  )}

                </div>

              </div>


              {/* ================================================= */}
              {/* PLAY BUTTON                                       */}
              {/* ================================================= */}

              <button
                onClick={handlePlay}
                disabled={!canPlay}
                className={`
                  w-full
                  py-4
                  rounded-xl
                  font-black
                  text-xl
                  transition-all
                  border-2

                  ${
                    canPlay
                      ? 'bg-casino-gold text-black border-casino-gold hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,215,0,0.7)]'
                      : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                  }
                `}
              >
                {animating
                  ? '🎰 GIRANDO...'
                  : '🎰 GIRAR'}
              </button>


              {/* ================================================= */}
              {/* ERROR                                             */}
              {/* ================================================= */}

              {error && (
                <div
                  className="
                    mt-4
                    p-3
                    rounded-lg
                    bg-red-900/50
                    border
                    border-red-500
                    text-red-200
                    text-center
                  "
                >
                  {error}
                </div>
              )}


              {/* ================================================= */}
              {/* RESULT MESSAGE                                    */}
              {/* ================================================= */}

              {resultSummary && (
                <div
                  className={`
                    mt-4
                    p-4
                    rounded-xl
                    border-2
                    ${
                      resultSummary.totalWin > 0
                        ? 'bg-green-900/50 border-green-500'
                        : 'bg-red-900/50 border-red-500'
                    }
                  `}
                >

                  {/* Result header */}

                  <div className="text-center mb-3">

                    <div className="text-xs font-bold text-gray-300">
                      RESULTADO
                    </div>

                    <div className="text-4xl font-black text-casino-gold">
                      {resultSummary.number}
                    </div>

                    <div className="font-bold">
                      {resultSummary.color}
                    </div>

                  </div>


                  {/* WIN */}

                  {resultSummary.totalWin > 0 ? (

                    <div>

                      <div className="text-center text-green-300 font-black text-lg mb-3">
                        🎉 ¡GANASTE!
                      </div>

                      <div className="text-sm text-gray-200 mb-2">
                        Ganaste por:
                      </div>

                      <div className="space-y-2">

                        {resultSummary.winningBets.map(
                          (win, index) => (
                            <div
                              key={`${win.label}-${index}`}
                              className="
                                flex
                                items-center
                                justify-between
                                gap-2
                                p-2
                                rounded-lg
                                bg-black/50
                                border
                                border-green-700
                              "
                            >

                              <div className="min-w-0">

                                <div className="font-bold text-sm">
                                  {win.label}
                                </div>

                                <div className="text-xs text-gray-400">
                                  Apuesta $ {win.amount}
                                  {' · '}
                                  x{win.multiplier}
                                </div>

                              </div>

                              <div className="text-green-400 font-black whitespace-nowrap">
                                +$ {win.win}
                              </div>

                            </div>
                          )
                        )}

                      </div>


                      {/* Total win */}

                      <div
                        className="
                          mt-3
                          pt-3
                          border-t
                          border-green-700
                          flex
                          justify-between
                          items-center
                          font-black
                        "
                      >

                        <span>
                          GANANCIA TOTAL
                        </span>

                        <span className="text-green-400 text-xl">
                          +$ {resultSummary.totalWin}
                        </span>

                      </div>

                    </div>

                  ) : (

                    /* LOSS */

                    <div className="text-center">

                      <div className="text-red-300 font-black text-lg mb-2">
                        ❌ PERDISTE
                      </div>

                      <div className="text-gray-300 text-sm">
                        No acertaste ninguna de tus apuestas.
                      </div>

                      <div className="mt-3 text-red-300 font-black">
                        -$ {resultSummary.totalBet}
                      </div>

                    </div>

                  )}

                </div>
              )}

            </div>


            {/* ================================================= */}
            {/* BOX 3: MY BETS                                    */}
            {/* ================================================= */}

            <div
              className="
                bg-black/75
                border
                border-casino-border
                rounded-2xl
                p-3
                w-[180px]
                min-w-[180px]
              "
            >

              <div className="text-center text-gray-300 font-bold mb-4 text-sm">
                MIS APUESTAS
              </div>


              {selectedBets.length === 0 ? (

                <div className="text-center text-gray-500 text-xs py-6">
                  No hay apuestas
                </div>

              ) : (

                <>

                  <div className="space-y-2">

                    {selectedBets.map(
                      (bet, index) => (
                        <div
                          key={`${bet.type}-${bet.value ?? 'none'}-${index}`}
                          className="
                            flex
                            items-center
                            justify-between
                            gap-1
                            p-2
                            rounded-lg
                            bg-black/60
                            border
                            border-casino-border
                          "
                        >

                          <div className="min-w-0">

                            <div className="font-bold text-xs truncate">
                              {getBetLabel(bet)}
                            </div>

                            <div className="text-casino-gold text-xs">
                              $ {bet.amount}
                            </div>

                          </div>

                          <button
                            onClick={() =>
                              removeBet(index)
                            }
                            disabled={
                              playing ||
                              animating
                            }
                            className="
                              shrink-0
                              w-6
                              h-6
                              rounded-full
                              bg-red-900/60
                              border
                              border-red-600
                              text-red-300
                              font-black
                              hover:bg-red-700
                              transition-colors
                            "
                          >
                            ×
                          </button>

                        </div>
                      )
                    )}

                  </div>


                  {/* Total */}

                  <div
                    className="
                      mt-4
                      pt-3
                      border-t
                      border-casino-border
                      flex
                      flex-col
                      gap-1
                      font-black
                    "
                  >

                    <span className="text-xs">
                      TOTAL
                    </span>

                    <span className="text-casino-gold">
                      $ {totalBet}
                    </span>

                  </div>


                  {/* Clear bets */}

                  <button
                    onClick={clearBets}
                    disabled={
                      playing ||
                      animating
                    }
                    className="
                      w-full
                      mt-3
                      py-2
                      rounded-lg
                      border
                      border-red-700
                      bg-red-900/30
                      text-red-300
                      text-xs
                      font-bold
                      hover:bg-red-900/60
                      transition-colors
                    "
                  >
                    LIMPIAR
                  </button>

                </>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
