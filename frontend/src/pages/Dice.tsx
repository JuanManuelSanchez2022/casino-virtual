import { useEffect, useRef, useState } from 'react';
import { useDice } from '../hooks/useDice';
import { useWallet } from '../hooks/useWallet';

const BET_OPTIONS = [1, 2, 5, 10, 20, 50, 100, 500];

const CHOICE_OPTIONS = [
  {
    key: 'LOW' as const,
    label: 'BAJO',
    range: '2 - 6',
    mult: 'x2',
  },
  {
    key: 'SEVEN' as const,
    label: 'SIETE',
    range: '7',
    mult: 'x5',
  },
  {
    key: 'HIGH' as const,
    label: 'ALTO',
    range: '8 - 12',
    mult: 'x2',
  },
];

const DIE_IMAGES: Record<number, string> = {
  1: '/assets/games/dice_one.png',
  2: '/assets/games/dice_two.png',
  3: '/assets/games/dice_three.png',
  4: '/assets/games/dice_four.png',
  5: '/assets/games/dice_five.png',
  6: '/assets/games/dice_six.png',
};

export default function Dice() {
  const { playing, lastResult, play } = useDice();
  const { wallet, updateBalance } = useWallet();

  const [bet, setBet] = useState(100);
  const [choice, setChoice] = useState<
    'LOW' | 'SEVEN' | 'HIGH' | null
  >(null);

  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);

  const [animating, setAnimating] = useState(false);

  const [displayDie1, setDisplayDie1] = useState<number | null>(null);
  const [displayDie2, setDisplayDie2] = useState<number | null>(null);

  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const animStartRef = useRef<number>(0);

  const MIN_ANIMATION_MS = 1000;

  /*
   * Limpieza de timers al desmontar el componente.
   */
  useEffect(() => {
    return () => {
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current);
        animIntervalRef.current = null;
      }

      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = null;
      }
    };
  }, []);

  /*
   * Detiene la animación y muestra los dados reales
   * devueltos por el servidor.
   */
  const finishAnimation = (die1: number, die2: number) => {
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }

    setDisplayDie1(die1);
    setDisplayDie2(die2);
    setAnimating(false);
    setShowResult(true);
  };

  const handlePlay = async () => {
    if (!choice) {
      setError('Elegí una opción: BAJO, SIETE o ALTO.');
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

    /*
     * Evita una segunda jugada mientras todavía
     * se está mostrando la animación.
     */
    if (playing || animating) {
      return;
    }

    setError('');
    setShowResult(false);
    setAnimating(true);

    animStartRef.current = Date.now();

    /*
     * Limpiamos cualquier timer anterior.
     */
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
    }

    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
    }

    /*
     * Dejamos los dados "rodando" visualmente.
     * Estos valores son solamente visuales.
     * El resultado verdadero siempre viene del backend.
     */
    animIntervalRef.current = setInterval(() => {
      setDisplayDie1(Math.floor(Math.random() * 6) + 1);
      setDisplayDie2(Math.floor(Math.random() * 6) + 1);
    }, 100);

    try {
      /*
       * El backend genera los dados reales.
       */
      const result = await play(bet, choice);

      const elapsed = Date.now() - animStartRef.current;

      const remaining = Math.max(
        0,
        MIN_ANIMATION_MS - elapsed
      );

      /*
       * Esperamos lo necesario para que la animación
       * dure como mínimo MIN_ANIMATION_MS.
       */
      resultTimeoutRef.current = setTimeout(() => {
        resultTimeoutRef.current = null;

        finishAnimation(
          result.dice.die1,
          result.dice.die2
        );

        updateBalance(result.balance);
      }, remaining);
    } catch (e: any) {
      /*
       * Si el backend falla NO mostramos un resultado falso.
       */
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current);
        animIntervalRef.current = null;
      }

      setAnimating(false);
      setShowResult(false);

      setError(
        e?.message || 'No se pudo realizar la jugada.'
      );
    }
  };

  const canPlay =
    !playing &&
    !animating &&
    !!wallet &&
    wallet.balance >= bet &&
    !!choice;

  const isWin =
    showResult &&
    lastResult !== null &&
    lastResult.win > 0;

  const resultLabel = lastResult
    ? lastResult.dice.result === 'SEVEN'
      ? 'SIETE'
      : lastResult.dice.result === 'LOW'
        ? 'BAJO'
        : 'ALTO'
    : '';

  /*
   * Mientras todavía no hay resultado usamos 1.
   * Durante la animación estos valores cambian rápidamente.
   */
  const die1Image =
    displayDie1 !== null
      ? DIE_IMAGES[displayDie1]
      : DIE_IMAGES[1];

  const die2Image =
    displayDie2 !== null
      ? DIE_IMAGES[displayDie2]
      : DIE_IMAGES[1];

  return (
    <div className="relative min-h-screen text-white">
      {/* Fondo */}
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

      {/* Oscurecimiento del fondo */}
      <div
        className="
          fixed
          inset-0
          z-0
          bg-black/30
          pointer-events-none
        "
      />

      {/* Contenido */}
      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-4xl mx-auto">

          {/* Título */}
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-black text-casino-gold">
              🎲 Dados
            </h1>

            <p className="text-gray-300 mt-2">
              High / Low / Seven
            </p>

            {wallet && (
              <div className="mt-4 inline-block">
                <div className="bg-black/70 border border-casino-border rounded-xl px-6 py-3">
                  <span className="text-gray-400">
                    Saldo
                  </span>

                  <span className="ml-3 text-casino-gold font-bold text-xl">
                    {wallet.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Panel principal */}
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

            {/* Área de dados */}
            <div
              className="
                bg-black/80
                border-2
                border-casino-border
                rounded-2xl
                p-5
                md:p-8
                mb-8
              "
            >
              <div className="text-center text-gray-400 text-sm mb-4">
                {animating
                  ? 'Lanzando los dados...'
                  : showResult
                    ? 'Resultado'
                    : 'Prepará tu jugada'}
              </div>

              <div className="flex justify-center items-center gap-6 md:gap-12">

                {/* Dado 1 */}
                <div
                  className={`
                    w-32
                    h-32
                    md:w-44
                    md:h-44
                    flex
                    items-center
                    justify-center
                    ${animating ? 'animate-bounce' : ''}
                  `}
                >
                  <img
                    src={die1Image}
                    alt={`Dado ${displayDie1 ?? 1}`}
                    className="
                      w-full
                      h-full
                      object-contain
                      drop-shadow-[0_8px_12px_rgba(0,0,0,0.7)]
                    "
                  />
                </div>

                {/* Separador */}
                <div className="text-3xl md:text-5xl font-black text-casino-gold">
                  +
                </div>

                {/* Dado 2 */}
                <div
                  className={`
                    w-32
                    h-32
                    md:w-44
                    md:h-44
                    flex
                    items-center
                    justify-center
                    ${animating ? 'animate-bounce' : ''}
                  `}
                >
                  <img
                    src={die2Image}
                    alt={`Dado ${displayDie2 ?? 1}`}
                    className="
                      w-full
                      h-full
                      object-contain
                      drop-shadow-[0_8px_12px_rgba(0,0,0,0.7)]
                    "
                  />
                </div>

              </div>

              {/* Resultado */}
              {showResult && lastResult && (
                <div
                  className={`
                    mt-6
                    rounded-xl
                    p-5
                    text-center
                    border-2
                    ${
                      isWin
                        ? 'bg-yellow-500/10 border-yellow-400'
                        : 'bg-red-500/10 border-red-500'
                    }
                  `}
                >
                  <div
                    className={`
                      text-2xl
                      md:text-3xl
                      font-black
                      ${
                        isWin
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }
                    `}
                  >
                    {isWin
                      ? '🎉 ¡GANASTE!'
                      : '❌ PERDISTE'}
                  </div>

                  <div className="mt-2 text-gray-300">
                    Resultado:{' '}
                    <span className="text-casino-gold font-bold">
                      {resultLabel}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Apuesta */}
            <div className="mb-8">
              <div className="text-gray-300 font-medium text-center mb-3">
                Apuesta
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {BET_OPTIONS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBet(amount)}
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
                          : 'bg-black text-gray-300 border-casino-border hover:border-casino-gold hover:text-casino-gold'
                      }

                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    `}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Selección */}
            <div className="mb-8">
              <div className="text-gray-300 font-medium text-center mb-3">
                Selección
              </div>

              <div className="flex flex-col md:flex-row justify-center gap-3">
                {CHOICE_OPTIONS.map(option => (
                  <button
                    key={option.key}
                    onClick={() => setChoice(option.key)}
                    disabled={playing || animating}
                    className={`
                      flex-1
                      max-w-xs
                      mx-auto
                      w-full
                      p-4
                      rounded-xl
                      border-2
                      transition-all

                      ${
                        choice === option.key
                          ? 'border-casino-gold bg-casino-gold/10 shadow-[0_0_14px_rgba(255,215,0,0.75)] scale-105'
                          : 'border-casino-border bg-black/50 hover:border-casino-gold'
                      }

                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    `}
                  >
                    <div className="text-lg font-bold text-casino-gold">
                      {option.label}
                    </div>

                    <div className="text-sm text-gray-300">
                      {option.range}
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      Premio {option.mult}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botón lanzar */}
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
                    canPlay
                      ? 'bg-casino-gold text-black hover:scale-105 hover:shadow-[0_0_25px_rgba(255,215,0,0.5)]'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {animating || playing
                  ? '🎲 LANZANDO...'
                  : '🎲 LANZAR'}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div
                className="
                  mt-5
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

            {/* Detalles del resultado */}
            {showResult && lastResult && (
              <div
                className="
                  mt-8
                  bg-black/50
                  border
                  border-casino-border
                  rounded-xl
                  p-5
                "
              >
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">

                  <div>
                    <div className="text-gray-400 text-sm">
                      Dado 1
                    </div>
                    <div className="text-casino-gold font-bold text-xl">
                      {lastResult.dice.die1}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-sm">
                      Dado 2
                    </div>
                    <div className="text-casino-gold font-bold text-xl">
                      {lastResult.dice.die2}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-sm">
                      Suma
                    </div>
                    <div className="text-casino-gold font-bold text-xl">
                      {lastResult.dice.total}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-sm">
                      Premio
                    </div>
                    <div className="text-casino-gold font-bold text-xl">
                      {lastResult.win}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-sm">
                      Saldo
                    </div>
                    <div className="text-casino-gold font-bold text-xl">
                      {lastResult.balance.toLocaleString()}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}