import { useNavigate } from 'react-router-dom';

interface Game {
  id: string;
  name: string;
  icon: string;
  image: string;
  description: string;
  available: boolean;
  route?: string;
}

const GAMES: Game[] = [
  {
    id: 'slots',
    name: 'Tragamonedas',
    icon: '🎰',
    image: '/assets/games/slots.png',
    description: 'Probá tu suerte con diferentes combinaciones.',
    available: true,
    route: '/slots',
  },
  {
    id: 'roulette',
    name: 'Ruleta',
    icon: '🎡',
    image: '/assets/games/background.png',
    description: 'Ruleta europea 0-36. Apostá al número, color o combinaciones.',
    available: true,
    route: '/roulette',
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    icon: '🃏',
    image: '/assets/games/blackjack.png',
    description: 'Acercate a 21 sin pasarte.',
    available: false,
    route: '/blackjack',
  },
  {
    id: 'dice',
    name: 'Dados',
    icon: '🎲',
    image: '/assets/games/dice.png',
    description: 'Poné a prueba tu suerte con los dados.',
    available: true,
    route: '/dice',
  },
  {
    id: 'plinko',
    name: 'Plinko',
    icon: '🟣',
    image: '/assets/games/plinko.png',
    description: 'Soltá la ficha y descubrí dónde termina.',
    available: false,
    route: '/plinko',
  },
  {
    id: 'mines',
    name: 'Mines',
    icon: '💣',
    image: '/assets/games/mines.png',
    description: 'Encontrá los premios y evitá las minas.',
    available: false,
    route: '/mines',
  },
  {
    id: 'video-poker',
    name: 'Video Poker',
    icon: '🃏',
    image: '/assets/games/video-poker.png',
    description: 'Armá la mejor combinación de cartas.',
    available: false,
    route: '/video-poker',
  },
  {
    id: 'baccarat',
    name: 'Baccarat',
    icon: '🎯',
    image: '/assets/games/baccarat.png',
    description: 'Elegí entre jugador, banca o empate.',
    available: false,
    route: '/baccarat',
  },
  {
    id: 'horse-racing',
    name: 'Carreras',
    icon: '🏇',
    image: '/assets/games/horse-racing.png',
    description: 'Elegí tu caballo y seguí la carrera.',
    available: false,
    route: '/horse-racing',
  },
];

export default function Home() {
  const navigate = useNavigate();

  const handleGameClick = (game: Game) => {
    if (!game.available || !game.route) {
      return;
    }

    navigate(game.route);
  };

  return (
    <div className="min-h-screen bg-casino-dark text-white">

      {/* HERO */}
      <section className="px-4 pt-8 pb-10">
        <div className="max-w-6xl mx-auto text-center">

          <div className="text-5xl mb-4">
            🎰
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-casino-gold">
            Casino Virtual
          </h1>

          <p className="mt-3 text-gray-400 text-lg">
            Elegí tu juego y disfrutá de la experiencia
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Todos los juegos utilizan créditos virtuales.
          </p>

        </div>
      </section>

      {/* JUEGOS */}
      <section className="px-4 pb-12">

        <div className="max-w-6xl mx-auto">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Juegos
            </h2>

            <div className="text-sm text-gray-500">
              {GAMES.filter(game => game.available).length} disponibles
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {GAMES.map(game => (

              <div
                key={game.id}
                className={`
                  group
                  bg-casino-darker
                  border
                  border-casino-border
                  rounded-2xl
                  overflow-hidden
                  shadow-xl
                  transition-all
                  duration-200
                  ${
                    game.available
                      ? 'hover:border-casino-gold hover:-translate-y-1 hover:shadow-2xl cursor-pointer'
                      : 'opacity-80'
                  }
                `}
                onClick={() => handleGameClick(game)}
              >

{/* IMAGEN DEL JUEGO */}
<div className="relative aspect-[16/9] bg-black overflow-hidden">

  <img
    src={game.image}
    alt={game.name}
    className={`
      w-full
      h-full
      object-cover
      transition-transform
      duration-300
      ${
        game.available
          ? 'group-hover:scale-105'
          : ''
      }
    `}
  />

  {/* ESTADO */}
                  <div className="absolute top-3 right-3">

                    {game.available ? (
                      <span className="px-3 py-1 bg-casino-gold text-black rounded-full text-xs font-bold shadow-lg">
                        DISPONIBLE
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-black/80 border border-gray-600 rounded-full text-xs font-bold text-gray-400">
                        PRÓXIMAMENTE
                      </span>
                    )}

                  </div>

                </div>

                {/* INFORMACIÓN */}
                <div className="p-5">

                  <div className="flex items-center gap-3">

                    <div className="text-3xl">
                      {game.icon}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {game.name}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {game.description}
                      </p>
                    </div>

                  </div>

                  {/* BOTÓN */}
                  <button
                    disabled={!game.available}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleGameClick(game);
                    }}
                    className={`
                      w-full
                      mt-5
                      py-3
                      rounded-xl
                      font-bold
                      transition-all
                      ${
                        game.available
                          ? `
                            bg-casino-gold
                            text-black
                            hover:scale-[1.02]
                            hover:shadow-lg
                          `
                          : `
                            bg-gray-800
                            text-gray-500
                            cursor-not-allowed
                          `
                      }
                    `}
                  >
                    {game.available
                      ? '🎰 JUGAR'
                      : 'PRÓXIMAMENTE'}
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-casino-border py-6 px-4">

        <div className="max-w-6xl mx-auto text-center text-sm text-gray-600">
          Casino Virtual · Entretenimiento con créditos virtuales
        </div>

      </footer>

    </div>
  );
}




