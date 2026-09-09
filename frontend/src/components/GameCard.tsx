import { Game } from '../types';

const GAME_ICONS: Record<string, string> = {
  slots: '🎰',
  roulette: '🎡',
  blackjack: '🃏',
};

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const icon = GAME_ICONS[game.slug] || '🎮';

  if (game.slug === 'slots') {
    return (
      <a
        href="/slots"
        className="block bg-casino-card rounded-2xl p-6 border border-casino-border hover:border-casino-gold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-casino-gold/20"
      >
        <div className="text-6xl mb-4 text-center">{icon}</div>
        <h3 className="text-xl font-bold text-center mb-2">{game.name}</h3>
        <p className="text-casino-muted text-center text-sm">{game.description}</p>
        <div className="mt-4 text-center">
          <span className="inline-block px-4 py-2 bg-casino-gold text-casino-darker font-bold rounded-lg">
            JUGAR AHORA
          </span>
        </div>
      </a>
    );
  }

  return (
    <div className="block bg-casino-card rounded-2xl p-6 border border-casino-border opacity-75">
      <div className="text-6xl mb-4 text-center">{icon}</div>
      <h3 className="text-xl font-bold text-center mb-2">{game.name}</h3>
      <p className="text-casino-muted text-center text-sm">{game.description}</p>
      <div className="mt-4 text-center">
        <span className="inline-block px-4 py-2 bg-casino-border text-casino-muted font-bold rounded-lg">
          PRÓXIMAMENTE
        </span>
      </div>
    </div>
  );
}
