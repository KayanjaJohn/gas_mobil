import express from 'express';
import { register, login, verify, updateProfile } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/authValidator';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/verify', authMiddleware, verify);
router.put('/profile', authMiddleware, updateProfile);

export default router;