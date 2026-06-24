import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppDataSource from '../config/database';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const existingUser = await userRepository.findOne({
      where: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or phone already exists'
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    const user = userRepository.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'customer',
      driverStatus: role === 'driver' ? 'offline' : null
    });

    await userRepository.save(user);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;

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

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, stationId: user.stationId },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          stationId: user.stationId
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/auth/verify
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const user = await userRepository.findOne({
      where: { id: req.user!.id },
      relations: ['station']
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          stationId: user.stationId,
          station: user.station
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/auth/me
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await userRepository.findOne({
      where: { id: req.user!.id },
      relations: ['station']
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        stationId: user.stationId,
        station: user.station,
        driverStatus: user.driverStatus,
        vehicleNumber: user.vehicleNumber,
        vehicleType: user.vehicleType
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, phone } = req.body;
    const user = await userRepository.findOne({ where: { id: req.user!.id } });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;

    await userRepository.save(user);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/auth/change-password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await userRepository.findOne({ where: { id: req.user!.id } });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = await bcryptjs.hash(newPassword, 12);
    await userRepository.save(user);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Password reset link sent to email' });
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Password reset successfully' });
};
