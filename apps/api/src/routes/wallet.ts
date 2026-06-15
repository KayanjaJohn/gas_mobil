import express from 'express';
import { getWallet, topUpWallet } from '../controllers/walletController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, getWallet);
router.post('/top-up', authMiddleware, topUpWallet);

export default router;