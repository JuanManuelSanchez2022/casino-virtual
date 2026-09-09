import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWallet, addVirtualCredits } from '../controllers/walletController';

const router = Router();

router.get('/', authenticate, getWallet);
router.post('/virtual-topup', authenticate, addVirtualCredits);

export default router;
