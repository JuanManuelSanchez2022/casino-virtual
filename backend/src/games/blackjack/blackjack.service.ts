import prisma from '../../config/database';
import { Prisma } from '@prisma/client';
import { BlackjackEngine } from './blackjack.engine';
import { BLACKJACK_CONFIG } from './blackjack.config';
import {
  BlackjackConfig,
  BlackjackBet,
  BlackjackGameState,
  BlackjackGame,
  BlackjackResult,
} from './blackjack.types';
import { Card } from './blackjack.types';

type CardJSON = {
  suit: string;
  rank: string;
  value: number;
};

const cardToJSON = (card: Card): CardJSON => ({
  suit: card.suit,
  rank: card.rank,
  value: card.value,
});

const cardsToJSON = (cards: Card[]): CardJSON[] => cards.map(cardToJSON);

const jsonToCard = (json: CardJSON): Card => ({
  suit: json.suit as any,
  rank: json.rank as any,
  value: json.value,
});

const jsonToCards = (json: CardJSON[]): Card[] => json.map(jsonToCard);

const validateBet = (bet: BlackjackBet): void => {
  if (!Number.isInteger(bet.amount) || bet.amount <= 0) {
    throw new Error('La apuesta debe ser un número entero mayor a 0.');
  }
  if (bet.amount < BLACKJACK_CONFIG.minBet || bet.amount > BLACKJACK_CONFIG.maxBet) {
    throw new Error(`La apuesta debe estar entre ${BLACKJACK_CONFIG.minBet} y ${BLACKJACK_CONFIG.maxBet}.`);
  }
};

const createInitialDeck = (engine: BlackjackEngine) => {
  const deck = engine.createDeck();
  return engine.shuffleDeck(deck);
};

const dealInitialCards = (engine: BlackjackEngine, deck: Card[]) => {
  const playerCards = [engine.drawCard(deck), engine.drawCard(deck)];
  const dealerCards = [engine.drawCard(deck), engine.drawCard(deck)];
  return { playerCards, dealerCards, remainingDeck: deck };
};

type ResponseCard = Card & { hidden?: boolean };

type StoredBlackjackState = {
  state: BlackjackGameState;
  bet: number;
  deck: CardJSON[];
  playerHand: CardJSON[];
  dealerHand: CardJSON[];
  playerValue: number;
  dealerValue: number;
  dealerHidden: boolean;
  result?: BlackjackResult;
};

const getStoredGame = async (gameId: string): Promise<StoredBlackjackState | null> => {
  const session = await prisma.gameSession.findUnique({
    where: { id: gameId },
  });

  if (!session) {
    return null;
  }

  const spin = await prisma.spin.findFirst({
    where: { sessionId: gameId },
    orderBy: { createdAt: 'desc' },
  });

  if (!spin) {
    return null;
  }

  const winningLines = spin.winningLines as any;
  if (!winningLines) {
    return null;
  }

  return {
    state: winningLines.state as BlackjackGameState,
    bet: spin.bet,
    deck: winningLines.deck || [],
    playerHand: winningLines.playerHand || [],
    dealerHand: winningLines.dealerHand || [],
    playerValue: winningLines.playerValue || 0,
    dealerValue: winningLines.dealerValue || 0,
    dealerHidden: winningLines.dealerHidden ?? true,
    result: winningLines.result as BlackjackResult | undefined,
  };
};

const updateStoredGame = async (
  gameId: string,
  data: Partial<StoredBlackjackState>
): Promise<void> => {
  const spin = await prisma.spin.findFirst({
    where: { sessionId: gameId },
    orderBy: { createdAt: 'desc' },
  });

  if (!spin) return;

  const currentWinningLines = (spin.winningLines as any) || {};
  const updatedWinningLines = { ...currentWinningLines, ...data };

  await prisma.spin.update({
    where: { id: spin.id },
    data: {
      winningLines: updatedWinningLines,
    },
  });

  if (data.state === 'FINISHED') {
    await prisma.gameSession.update({
      where: { id: gameId },
      data: {
        endedAt: new Date(),
      },
    });
  }
};

export const startBlackjack = async (
  userId: string,
  bet: BlackjackBet
): Promise<{
  gameId: string;
  playerCards: Card[];
  dealerCards: ResponseCard[];
  playerValue: number;
  dealerVisibleValue: number;
  state: BlackjackGameState;
  bet: number;
  balance: number;
}> => {
  validateBet(bet);

  const gameRecord = await prisma.game.findUnique({
    where: { slug: 'blackjack' },
  });

  if (!gameRecord || !gameRecord.isActive) {
    throw new Error('Juego no disponible.');
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  if (wallet.balance < bet.amount) {
    throw new Error('Saldo insuficiente.');
  }

  const existingGame = await prisma.gameSession.findFirst({
    where: {
      userId,
      gameId: gameRecord.id,
      endedAt: null,
    },
    orderBy: { startedAt: 'desc' },
  });

  if (existingGame) {
    throw new Error('Ya tienes una partida de Blackjack en curso. Termínala antes de iniciar una nueva.');
  }

  const engine = new BlackjackEngine(BLACKJACK_CONFIG);
  const deck = createInitialDeck(engine);
  const { playerCards, dealerCards, remainingDeck } = dealInitialCards(engine, deck);

  const playerHand = engine.getHand(playerCards);
  const dealerHand = engine.getHand(dealerCards);

  let state: BlackjackGameState = 'PLAYER_TURN';
  let result: BlackjackResult | undefined;
  let dealerHidden = true;

  if (playerHand.isBlackjack) {
    if (dealerHand.isBlackjack) {
      result = 'PUSH';
      state = 'FINISHED';
      dealerHidden = false;
    } else {
      result = 'BLACKJACK';
      state = 'FINISHED';
      dealerHidden = false;
    }
  } else if (dealerHand.isBlackjack) {
    result = 'LOSE';
    state = 'FINISHED';
    dealerHidden = false;
  }

  const session = await prisma.gameSession.create({
    data: {
      userId,
      gameId: gameRecord.id,
    },
  });

  const spin = await prisma.spin.create({
    data: {
      sessionId: session.id,
      userId,
      gameId: gameRecord.id,
      bet: bet.amount,
      win: 0,
      symbols: {
        playerCards: cardsToJSON(playerCards),
        dealerCards: cardsToJSON(dealerCards),
      },
      winningLines: {
        state,
        bet: bet.amount,
        deck: cardsToJSON(remainingDeck),
        playerHand: cardsToJSON(playerCards),
        dealerHand: cardsToJSON(dealerCards),
        playerValue: playerHand.value,
        dealerValue: dealerHand.value,
        dealerHidden,
        result,
      },
      paytableVersion: engine.getPaytableVersion(),
    },
  });

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: bet.amount },
        totalLost: { increment: bet.amount },
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'BET',
        amount: -bet.amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance - bet.amount,
        gameId: gameRecord.id,
        spinId: spin.id,
        description: `Apuesta en Blackjack`,
      },
    });
  });

  const dealerVisibleValue = dealerHidden ? dealerCards[0].value : dealerHand.value;

  return {
    gameId: session.id,
    playerCards,
    dealerCards: dealerHidden ? [{ ...dealerCards[0], hidden: true }, { ...dealerCards[1], hidden: true }] : dealerCards,
    playerValue: playerHand.value,
    dealerVisibleValue,
    state,
    bet: bet.amount,
    balance: wallet.balance - bet.amount,
  };
};

export const hitBlackjack = async (
  userId: string,
  gameId: string
): Promise<{
  gameId: string;
  playerCards: ResponseCard[];
  dealerCards: ResponseCard[];
  playerValue: number;
  dealerVisibleValue: number;
  state: BlackjackGameState;
  bet: number;
  balance: number;
}> => {
  const session = await prisma.gameSession.findUnique({
    where: { id: gameId },
  });

  if (!session || session.userId !== userId) {
    throw new Error('Partida no encontrada.');
  }

  if (session.endedAt) {
    throw new Error('La partida ya ha terminado.');
  }

  const storedGame = await getStoredGame(gameId);
  if (!storedGame) {
    throw new Error('No hay datos de la partida.');
  }

  if (storedGame.state !== 'PLAYER_TURN') {
    throw new Error('No es tu turno para pedir carta.');
  }

  const gameRecord = await prisma.game.findUnique({
    where: { slug: 'blackjack' },
  });

  if (!gameRecord || !gameRecord.isActive) {
    throw new Error('Juego no disponible.');
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  const engine = new BlackjackEngine(BLACKJACK_CONFIG);
  const remainingDeck = jsonToCards(storedGame.deck);
  const playerHandCards = jsonToCards(storedGame.playerHand);
  const dealerHandCards = jsonToCards(storedGame.dealerHand);

  const newCard = engine.drawCard(remainingDeck);
  const newPlayerCards = [...playerHandCards, newCard];
  const playerHand = engine.getHand(newPlayerCards);

  let state: BlackjackGameState = storedGame.state;
  let result = storedGame.result;
  let dealerHidden = storedGame.dealerHidden;

  if (playerHand.isBust) {
    state = 'FINISHED';
    result = 'LOSE';
    dealerHidden = false;
  } else if (playerHand.value === 21) {
    state = 'DEALER_TURN';
  }

  await updateStoredGame(gameId, {
    playerHand: cardsToJSON(newPlayerCards),
    playerValue: playerHand.value,
    state,
    result,
    dealerHidden,
    deck: cardsToJSON(remainingDeck),
  });

  const dealerHand = engine.getHand(dealerHandCards);
  const dealerVisibleValue = dealerHidden ? dealerHandCards[0].value : dealerHand.value;

  const responsePlayerCards = newPlayerCards;
  const responseDealerCards: ResponseCard[] = dealerHidden
    ? [{ ...dealerHandCards[0], hidden: true }, { ...dealerHandCards[1], hidden: true }]
    : dealerHandCards;

  return {
    gameId: session.id,
    playerCards: responsePlayerCards,
    dealerCards: responseDealerCards,
    playerValue: playerHand.value,
    dealerVisibleValue,
    state,
    bet: storedGame.bet,
    balance: wallet.balance,
  };
};

export const standBlackjack = async (
  userId: string,
  gameId: string
): Promise<{
  gameId: string;
  playerCards: Card[];
  dealerCards: Card[];
  playerValue: number;
  dealerValue: number;
  state: BlackjackGameState;
  result: BlackjackResult;
  payout: number;
  balance: number;
}> => {
  const session = await prisma.gameSession.findUnique({
    where: { id: gameId },
  });

  if (!session || session.userId !== userId) {
    throw new Error('Partida no encontrada.');
  }

  if (session.endedAt) {
    throw new Error('La partida ya ha terminado.');
  }

  const storedGame = await getStoredGame(gameId);
  if (!storedGame) {
    throw new Error('No hay datos de la partida.');
  }

  if (storedGame.state !== 'PLAYER_TURN') {
    throw new Error('No es tu turno para plantarte.');
  }

  const gameRecord = await prisma.game.findUnique({
    where: { slug: 'blackjack' },
  });

  if (!gameRecord || !gameRecord.isActive) {
    throw new Error('Juego no disponible.');
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  const engine = new BlackjackEngine(BLACKJACK_CONFIG);

  let dealerCards = jsonToCards(storedGame.dealerHand);
  let remainingDeck = jsonToCards(storedGame.deck);
  const playerHandCards = jsonToCards(storedGame.playerHand);

  dealerCards.push(engine.drawCard(remainingDeck));
  let dealerHand = engine.getHand(dealerCards);

  while (engine.shouldDealerHit(dealerHand)) {
    dealerCards.push(engine.drawCard(remainingDeck));
    dealerHand = engine.getHand(dealerCards);
  }

  const playerHand = engine.getHand(playerHandCards);
  const result = engine.determineResult(playerHand, dealerHand);
  const payout = engine.calculatePayout(storedGame.bet, result);

  const record = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let finalBalance = wallet.balance - storedGame.bet;

    if (payout > 0) {
      const winWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { increment: payout },
          totalWon: { increment: payout },
        },
      });
      finalBalance = winWallet.balance;

      await tx.transaction.create({
        data: {
          userId,
          walletId: winWallet.id,
          type: 'WIN',
          amount: payout,
          balanceBefore: finalBalance - payout,
          balanceAfter: finalBalance,
          gameId: gameRecord.id,
          description: `Premio en Blackjack`,
        },
      });
    }

    const spin = await tx.spin.findFirst({
      where: { sessionId: gameId },
      orderBy: { createdAt: 'desc' },
    });

    if (spin) {
      await tx.spin.update({
        where: { id: spin.id },
        data: {
          win: payout,
          winningLines: {
            state: 'FINISHED',
            bet: storedGame.bet,
            deck: cardsToJSON(remainingDeck),
            playerHand: cardsToJSON(playerHandCards),
            dealerHand: cardsToJSON(dealerCards),
            playerValue: playerHand.value,
            dealerValue: dealerHand.value,
            dealerHidden: false,
            result,
          },
        },
      });
    }

    await tx.gameSession.update({
      where: { id: gameId },
      data: {
        totalBet: { increment: storedGame.bet },
        totalWin: { increment: payout },
        endedAt: new Date(),
      },
    });

    return { finalBalance };
  });

  return {
    gameId: session.id,
    playerCards: playerHandCards,
    dealerCards: dealerCards,
    playerValue: playerHand.value,
    dealerValue: dealerHand.value,
    state: 'FINISHED',
    result,
    payout,
    balance: record.finalBalance,
  };
};

export const getBlackjackState = async (
  userId: string,
  gameId: string
): Promise<{
  gameId: string;
  playerCards: ResponseCard[];
  dealerCards: ResponseCard[];
  playerValue: number;
  dealerVisibleValue: number;
  dealerValue: number;
  state: BlackjackGameState;
  bet: number;
  balance: number;
  result?: BlackjackResult;
  payout?: number;
}> => {
  const session = await prisma.gameSession.findUnique({
    where: { id: gameId },
  });

  if (!session || session.userId !== userId) {
    throw new Error('Partida no encontrada.');
  }

  const storedGame = await getStoredGame(gameId);
  if (!storedGame) {
    throw new Error('No hay datos de la partida.');
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  const engine = new BlackjackEngine(BLACKJACK_CONFIG);
  const playerHandCards = jsonToCards(storedGame.playerHand);
  const dealerHandCards = jsonToCards(storedGame.dealerHand);
  const dealerHand = engine.getHand(dealerHandCards);
  const dealerVisibleValue = storedGame.dealerHidden ? dealerHandCards[0].value : dealerHand.value;

  let payout: number | undefined;
  if (storedGame.result) {
    payout = engine.calculatePayout(storedGame.bet, storedGame.result);
  }

  const responseDealerCards: ResponseCard[] = storedGame.dealerHidden
    ? [{ ...dealerHandCards[0], hidden: true }, { ...dealerHandCards[1], hidden: true }]
    : dealerHandCards;

  return {
    gameId: session.id,
    playerCards: playerHandCards,
    dealerCards: responseDealerCards,
    playerValue: storedGame.playerValue,
    dealerVisibleValue,
    dealerValue: storedGame.dealerHidden ? dealerHand.value : storedGame.dealerValue,
    state: storedGame.state,
    bet: storedGame.bet,
    balance: wallet.balance,
    result: storedGame.result,
    payout,
  };
};