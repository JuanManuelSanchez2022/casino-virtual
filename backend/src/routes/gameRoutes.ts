import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listGames, getGame, spin, getHistory } from '../controllers/gameController';
import { play } from '../controllers/diceController';

const router = Router();

router.get('/', authenticate, listGames);
router.get('/:slug', authenticate, getGame);
router.post('/slots/spin', authenticate, spin);
router.post('/dice/play', authenticate, play);
router.get('/history', authenticate, getHistory);

export default router;
