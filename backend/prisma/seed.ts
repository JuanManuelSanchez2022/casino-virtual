import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slotsGame = await prisma.game.upsert({
    where: { slug: 'slots' },
    update: {},
    create: {
      slug: 'slots',
      name: 'Tragamonedas',
      description: '5 rodillos × 3 filas con múltiples líneas de pago',
      type: 'slots',
      isActive: true,
      config: { reels: 5, rows: 3 },
    },
  });

  const rouletteGame = await prisma.game.upsert({
    where: { slug: 'roulette' },
    update: {},
    create: {
      slug: 'roulette',
      name: 'Ruleta',
      description: 'Ruleta europea clásica. Apostá al número, color o diferentes combinaciones.',
      type: 'roulette',
      isActive: true,
    },
  });

  const blackjackGame = await prisma.game.upsert({
    where: { slug: 'blackjack' },
    update: {},
    create: {
      slug: 'blackjack',
      name: 'Blackjack',
      description: 'Blackjack 21 próximamente',
      type: 'blackjack',
      isActive: false,
    },
  });

  console.log({ slotsGame, rouletteGame, blackjackGame });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
