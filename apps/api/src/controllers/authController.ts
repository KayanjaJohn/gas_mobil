import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppDataSource from '../config/database';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

// ── NEW: Token generation helper ─────────────────────────────
const generateTokens = (user: User) => {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_SECRET;

  if (!jwtSecret || !refreshSecret) {
    throw new Error('JWT_SECRET and REFRESH_SECRET must be set in environment');
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    refreshSecret,
    { expiresIn: (process.env.REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken };
};

// ── NEW: Refresh token endpoint (required by mobile app) ─────
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Refresh token required' });
    }

    const refreshSecret = process.env.REFRESH_SECRET;
    if (!refreshSecret) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, refreshSecret) as { id: string };
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.json({
      success: true,
      data: {
        token: accessToken,        // backward compat
        accessToken,                // explicit
        refreshToken: newRefreshToken,
      }
    });
  } catch (error: any) {
    console.error('[Auth] Refresh error:', error.message);
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
};

// ── MODIFIED: Register (added validation + refresh token) ────
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role = 'customer' } = req.body;

    // NEW: Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const existingUser = await userRepository.findOne({
      where: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email or phone already registered' });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    const user = userRepository.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      isActive: true,
    });

    await userRepository.save(user);

    // NEW: Generate both tokens
    const { accessToken, refreshToken } = generateTokens(user);

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        token: accessToken,           // backward compat (keep this!)
        accessToken,                   // explicit
        refreshToken,                  // NEW: required by mobile app
        user: userWithoutPassword,
      }
    });
  } catch (error: any) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

// ── MODIFIED: Login (added validation + refresh token) ──────
export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;

    // NEW: Validation
    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, error: 'Email/phone and password required' });
    }

    const user = await userRepository.findOne({
      where: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // NEW: Generate both tokens
    const { accessToken, refreshToken } = generateTokens(user);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        token: accessToken,           // backward compat (keep this!)
        accessToken,                   // explicit
        refreshToken,                  // NEW: required by mobile app
        user: userWithoutPassword,
      }
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

// ── PRESERVED: All your existing endpoints (unchanged) ──────

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    const userData = await userRepository.findOne({ where: { id: user.id } });
    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = userData;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    const userData = await userRepository.findOne({
      where: { id: user.id },
      relations: ['station']
    });
    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = userData;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    const { name, phone, email } = req.body;
    const userData = await userRepository.findOne({ where: { id: user.id } });
    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (name) userData.name = name;
    if (phone) userData.phone = phone;
    if (email) userData.email = email;
    await userRepository.save(userData);
    const { password: _, ...userWithoutPassword } = userData;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    const { currentPassword, newPassword } = req.body;
    const userData = await userRepository.findOne({ where: { id: user.id } });
    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const isValidPassword = await bcryptjs.compare(currentPassword, userData.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    userData.password = await bcryptjs.hash(newPassword, 12);
    await userRepository.save(userData);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};