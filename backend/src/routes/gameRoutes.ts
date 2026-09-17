import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listGames, getGame, spin, getHistory } from '../controllers/gameController';
import { play as dicePlay } from '../controllers/diceController';
import { play as roulettePlay } from '../controllers/rouletteController';
import { start as blackjackStart, hit as blackjackHit, stand as blackjackStand, getState as blackjackState } from '../controllers/blackjackController';

const router = Router();

router.get('/', authenticate, listGames);
router.get('/:slug', authenticate, getGame);
router.post('/slots/spin', authenticate, spin);
router.post('/dice/play', authenticate, dicePlay);
router.post('/roulette/play', authenticate, roulettePlay);
router.post('/blackjack/start', authenticate, blackjackStart);
router.post('/blackjack/:id/hit', authenticate, blackjackHit);
router.post('/blackjack/:id/stand', authenticate, blackjackStand);
router.get('/blackjack/:id', authenticate, blackjackState);
router.get('/history', authenticate, getHistory);

export default router;
