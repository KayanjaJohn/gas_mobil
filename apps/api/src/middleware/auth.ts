import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppDataSource from '../config/database';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET is not set in environment');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  authMiddleware(req, res, next);
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  authMiddleware(req, res, next);
};