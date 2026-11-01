import express from 'express';
import { getWallet } from '../controllers/walletController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, getWallet);
router.post('/top-up', authMiddleware, (_req, res) => {
  res.status(503).json({
    success: false,
    error: "Wallet top-ups are disabled. GasMobil currently accepts cash on delivery only.",
  });
});

export default router;