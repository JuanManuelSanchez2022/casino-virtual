import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listTransactions } from '../controllers/transactionController';

const router = Router();

router.get('/', authenticate, listTransactions);

export default router;
