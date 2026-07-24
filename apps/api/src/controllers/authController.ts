import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import AppDataSource from "../config/database";
import { User } from "../entities/User";
import { generateToken } from "../middleware/auth";

const userRepository = AppDataSource.getRepository(User);

export const register = async (req: Request, res: Response) => {
  console.log("[REGISTER] Request received:", JSON.stringify(req.body, null, 2));

  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, phone, and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters"
      });
    }

    const existingUser = await userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: any = {
      name,
      email,
      phone,
      password: hashedPassword,
    };

    const result = await userRepository.save(userData);
    const user = Array.isArray(result) ? result[0] : result;

    const token = generateToken(user.id, user.email, user.name);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      },
    });
  } catch (error: any) {
    console.error("[REGISTER] ERROR:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  console.log("[LOGIN] Request received:", JSON.stringify(req.body, null, 2));

  try {
    const { emailOrPhone, password } = req.body;

    if (!password || !emailOrPhone) {
      return res.status(400).json({
        success: false,
        error: "Email/phone and password are required"
      });
    }

    const isEmail = emailOrPhone.includes("@");
    const where = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };

    const user = await userRepository.findOne({ where });

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.email, user.name);

    const userResponse: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    res.json({
      success: true,
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error: any) {
    console.error("[LOGIN] ERROR:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      },
    });
  } catch (error: any) {
    console.error("[VERIFY] ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyToken = verify;

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const userResponse: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    res.json({
      success: true,
      data: userResponse,
    });
  } catch (error: any) {
    console.error("[GET CURRENT USER] ERROR:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: "Token required" });
    }

    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || "secret";

    const decoded = jwt.verify(token, jwtSecret);
    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    const newToken = generateToken(user.id, user.email, user.name);

    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error: any) {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, message: "Password reset instructions sent" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || "secret";

    const decoded = jwt.verify(token, jwtSecret);
    const hashedPassword = await bcrypt.hash(password, 10);

    await userRepository.update(decoded.userId, { password: hashedPassword } as any);

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, error: "Invalid or expired token" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, phone } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    await userRepository.update(userId, updateData);

    const user = await userRepository.findOne({ where: { id: userId } });

    const userResponse: any = {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      phone: user!.phone,
      role: user!.role,
    };

    res.json({ success: true, data: userResponse });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.update(userId, { password: hashedPassword } as any);

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
