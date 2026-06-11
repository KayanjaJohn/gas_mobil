import express from 'express';
import { getWallet, addMoneyToWallet } from '../controllers/walletController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, getWallet);
router.post('/add-money', authMiddleware, addMoneyToWallet);

export default router;
