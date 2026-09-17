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

const processNaturalBlackjack = async (
  tx: Prisma.TransactionClient,
  userId: string,
  wallet: { id: string; balance: number },
  gameRecord: { id: string },
  session: { id: string },
  betAmount: number,
  playerHand: any,
  dealerHand: any,
  spin: { id: string },
  engine: BlackjackEngine
): Promise<{
  result: BlackjackResult;
  payout: number;
  finalBalance: number;
  dealerHidden: boolean;
}> => {
  let result: BlackjackResult;
  let payout = 0;
  let finalBalance = wallet.balance - betAmount;
  let dealerHidden = false;

  if (playerHand.isBlackjack && dealerHand.isBlackjack) {
    result = 'PUSH';
    payout = betAmount;
    finalBalance = wallet.balance;
  } else if (playerHand.isBlackjack) {
    result = 'BLACKJACK';
    payout = Math.round(betAmount * BLACKJACK_CONFIG.blackjackPayout);
    finalBalance = wallet.balance + payout;
  } else {
    result = 'LOSE';
    payout = 0;
    finalBalance = wallet.balance - betAmount;
  }

  if (payout > 0) {
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: { increment: payout },
        totalWon: { increment: payout },
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'WIN',
        amount: payout,
        balanceBefore: finalBalance - payout,
        balanceAfter: finalBalance,
        gameId: gameRecord.id,
        spinId: spin.id,
        description: result === 'BLACKJACK' ? `Blackjack natural (3:2)` : `Empate - apuesta devuelta`,
      },
    });
  } else if (result === 'PUSH') {
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: { increment: betAmount },
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'WIN',
        amount: betAmount,
        balanceBefore: wallet.balance - betAmount,
        balanceAfter: wallet.balance,
        gameId: gameRecord.id,
        spinId: spin.id,
        description: `Empate - apuesta devuelta`,
      },
    });
  }

  await tx.spin.update({
    where: { id: spin.id },
    data: {
      win: payout,
      winningLines: {
        state: 'FINISHED',
        bet: betAmount,
        deck: [],
        playerHand: [],
        dealerHand: [],
        playerValue: playerHand.value,
        dealerValue: dealerHand.value,
        dealerHidden: false,
        result,
      },
    },
  });

  await tx.gameSession.update({
    where: { id: session.id },
    data: {
      totalBet: { increment: betAmount },
      totalWin: { increment: payout },
      endedAt: new Date(),
    },
  });

  return { result, payout, finalBalance, dealerHidden };
};

const processGameFinish = async (
  tx: Prisma.TransactionClient,
  userId: string,
  wallet: { id: string; balance: number },
  gameRecord: { id: string },
  session: { id: string },
  storedGame: StoredBlackjackState,
  spin: { id: string },
  playerHandCards: Card[],
  dealerHandCards: Card[],
  playerHand: any,
  dealerHand: any,
  result: BlackjackResult,
  betAmount: number,
  engine: BlackjackEngine
): Promise<{ payout: number; finalBalance: number }> => {
  const payout = engine.calculatePayout(betAmount, result);
  let finalBalance = wallet.balance - betAmount;

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
        spinId: spin.id,
        description: result === 'BLACKJACK' ? `Blackjack (3:2)` : `Victoria en Blackjack`,
      },
    });
  } else if (result === 'PUSH') {
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: { increment: betAmount },
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'WIN',
        amount: betAmount,
        balanceBefore: wallet.balance - betAmount,
        balanceAfter: wallet.balance,
        gameId: gameRecord.id,
        spinId: spin.id,
        description: `Empate - apuesta devuelta`,
      },
    });
    finalBalance = wallet.balance;
  }

  await tx.spin.update({
    where: { id: spin.id },
    data: {
      win: payout,
      winningLines: {
        state: 'FINISHED',
        bet: betAmount,
        deck: cardsToJSON([]),
        playerHand: cardsToJSON(playerHandCards),
        dealerHand: cardsToJSON(dealerHandCards),
        playerValue: playerHand.value,
        dealerValue: dealerHand.value,
        dealerHidden: false,
        result,
      },
    },
  });

  await tx.gameSession.update({
    where: { id: session.id },
    data: {
      totalBet: { increment: betAmount },
      totalWin: { increment: payout },
      endedAt: new Date(),
    },
  });

  return { payout, finalBalance };
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
  result?: BlackjackResult;
  payout?: number;
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
  let payout: number | undefined;
  let finalBalance = wallet.balance - bet.amount;
  let dealerHidden = true;
  let sessionId: string;

  if (playerHand.isBlackjack || dealerHand.isBlackjack) {
    state = 'FINISHED';
    dealerHidden = false;

    const session = await prisma.gameSession.create({
      data: {
        userId,
        gameId: gameRecord.id,
      },
    });

    sessionId = session.id;

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
          state: 'FINISHED',
          bet: bet.amount,
          deck: [],
          playerHand: [],
          dealerHand: [],
          playerValue: playerHand.value,
          dealerValue: dealerHand.value,
          dealerHidden: false,
          result: undefined,
        },
        paytableVersion: engine.getPaytableVersion(),
      },
    });

    const processed = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return await processNaturalBlackjack(
        tx,
        userId,
        wallet,
        gameRecord,
        session,
        bet.amount,
        playerHand,
        dealerHand,
        spin,
        engine
      );
    });

    result = processed.result;
    payout = processed.payout;
    finalBalance = processed.finalBalance;
    dealerHidden = processed.dealerHidden;
  } else {
    const session = await prisma.gameSession.create({
      data: {
        userId,
        gameId: gameRecord.id,
      },
    });

    await prisma.spin.create({
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
          description: `Apuesta en Blackjack`,
        },
      });
    });

    sessionId = session.id;
  }

  const dealerVisibleValue = dealerHidden ? dealerCards[0].value : dealerHand.value;

  return {
    gameId: sessionId,
    playerCards,
    dealerCards: dealerHidden
      ? [{ ...dealerCards[0], hidden: false }, { ...dealerCards[1], hidden: true }]
      : dealerCards,
    playerValue: playerHand.value,
    dealerVisibleValue,
    state,
    bet: bet.amount,
    balance: finalBalance,
    result,
    payout,
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
  let result: BlackjackResult | undefined = storedGame.result;
  let payout: number | undefined;
  let finalBalance = wallet.balance;
  let dealerHidden = storedGame.dealerHidden;

  if (playerHand.isBust) {
    state = 'FINISHED';
    result = 'LOSE';
    payout = 0;
    dealerHidden = false;

    const spin = await prisma.spin.findFirst({
      where: { sessionId: gameId },
      orderBy: { createdAt: 'desc' },
    });

    if (spin) {
      const processed = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        return await processGameFinish(
          tx,
          userId,
          wallet,
          gameRecord,
          session,
          storedGame,
          spin,
          newPlayerCards,
          dealerHandCards,
          playerHand,
          engine.getHand(dealerHandCards),
          'LOSE',
          storedGame.bet,
          engine
        );
      });
      finalBalance = processed.finalBalance;
    }
  } else if (playerHand.value === 21) {
    state = 'DEALER_TURN';
    dealerHidden = false;

    dealerHandCards.push(engine.drawCard(remainingDeck));
    let dealerHand = engine.getHand(dealerHandCards);

    while (engine.shouldDealerHit(dealerHand)) {
      dealerHandCards.push(engine.drawCard(remainingDeck));
      dealerHand = engine.getHand(dealerHandCards);
    }

    const finalResult = engine.determineResult(playerHand, dealerHand);
    result = finalResult;
    state = 'FINISHED';

    const spin = await prisma.spin.findFirst({
      where: { sessionId: gameId },
      orderBy: { createdAt: 'desc' },
    });

    if (spin) {
      const processed = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        return await processGameFinish(
          tx,
          userId,
          wallet,
          gameRecord,
          session,
          storedGame,
          spin,
          newPlayerCards,
          dealerHandCards,
          playerHand,
          dealerHand,
          finalResult,
          storedGame.bet,
          engine
        );
      });
      payout = processed.payout;
      finalBalance = processed.finalBalance;
    }
  } else {
    state = 'PLAYER_TURN';
    dealerHidden = true;
    await updateStoredGame(gameId, {
      playerHand: cardsToJSON(newPlayerCards),
      playerValue: playerHand.value,
      state,
      dealerHidden,
      deck: cardsToJSON(remainingDeck),
    });
  }

  const dealerHand = engine.getHand(dealerHandCards);
  const dealerVisibleValue = dealerHidden ? dealerHandCards[0].value : dealerHand.value;

  const responseDealerCards: ResponseCard[] = dealerHidden
    ? [{ ...dealerHandCards[0], hidden: false }, { ...dealerHandCards[1], hidden: true }]
    : dealerHandCards;

  return {
    gameId: session.id,
    playerCards: newPlayerCards,
    dealerCards: responseDealerCards,
    playerValue: playerHand.value,
    dealerVisibleValue,
    dealerValue: dealerHidden ? dealerHand.value : dealerHand.value,
    state,
    bet: storedGame.bet,
    balance: finalBalance,
    result,
    payout,
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

  let dealerHandCards = jsonToCards(storedGame.dealerHand);
  let remainingDeck = jsonToCards(storedGame.deck);
  const playerHandCards = jsonToCards(storedGame.playerHand);

  dealerHandCards.push(engine.drawCard(remainingDeck));
  let dealerHand = engine.getHand(dealerHandCards);

  while (engine.shouldDealerHit(dealerHand)) {
    dealerHandCards.push(engine.drawCard(remainingDeck));
    dealerHand = engine.getHand(dealerHandCards);
  }

  const playerHand = engine.getHand(playerHandCards);
  const result = engine.determineResult(playerHand, dealerHand);

  const spin = await prisma.spin.findFirst({
    where: { sessionId: gameId },
    orderBy: { createdAt: 'desc' },
  });

  if (!spin) {
    throw new Error('No hay datos de la partida.');
  }

  const record = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    return await processGameFinish(
      tx,
      userId,
      wallet,
      gameRecord,
      session,
      storedGame,
      spin,
      playerHandCards,
      dealerHandCards,
      playerHand,
      dealerHand,
      result,
      storedGame.bet,
      engine
    );
  });

  return {
    gameId: session.id,
    playerCards: playerHandCards,
    dealerCards: dealerHandCards,
    playerValue: playerHand.value,
    dealerValue: dealerHand.value,
    state: 'FINISHED',
    result,
    payout: record.payout,
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
    ? [{ ...dealerHandCards[0], hidden: false }, { ...dealerHandCards[1], hidden: true }]
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