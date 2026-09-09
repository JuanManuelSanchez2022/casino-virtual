import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProfile, updateProfile } from '../controllers/userController';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
