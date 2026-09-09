import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import walletRoutes from './walletRoutes';
import gameRoutes from './gameRoutes';
import transactionRoutes from './transactionRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/wallet', walletRoutes);
router.use('/games', gameRoutes);
router.use('/transactions', transactionRoutes);

export default router;
