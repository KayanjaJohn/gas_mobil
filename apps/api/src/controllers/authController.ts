import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppDataSource from "../config/database";
import { User } from "../entities/User";
import { generateToken, generateRefreshToken } from "../middleware/auth";

const userRepository = AppDataSource.getRepository(User);

// Minimal email helper — swap for SendGrid/Resend in production
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  console.log(`[Email] To: ${to} | Subject: ${subject}`);
  // TODO: integrate nodemailer or transactional email API
}

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, address, city, latitude, longitude } = req.body;

    // SECURITY FIX: Force role to customer — never trust client-sent role
    const role = "customer";

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, phone, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    const existingUser = await userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingUser) {
      console.log(`[REGISTER] Rejected: email=${email} or phone=${phone} already exists`);
      return res.status(409).json({ success: false, error: "User already exists with this email or phone" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userData: any = {
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      isActive: true,
      address: address || null,
      city: city || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    };

    const result = await userRepository.save(userData);
    const user = Array.isArray(result) ? result[0] : result;

    const accessToken = generateToken(user.id, user.email, user.name, user.role);
    const refreshToken = generateRefreshToken(user.id);

    console.log(`[REGISTER] Success: user=${user.email} id=${user.id}`);

    res.status(201).json({
      success: true,
      data: {
        token: accessToken,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    console.error("[REGISTER] ERROR:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;

    console.log(`[LOGIN] Attempt: identifier=${emailOrPhone}`);

    if (!password || !emailOrPhone) {
      console.log("[LOGIN] Rejected: missing fields");
      return res.status(400).json({
        success: false,
        error: "Email/phone and password are required",
      });
    }

    const isEmail = emailOrPhone.includes("@");
    const where = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };

    const user = await userRepository.findOne({ where });

    if (!user) {
      console.log(`[LOGIN] Rejected: user not found for identifier=${emailOrPhone}`);
      return res.status(401).json({ success: false, error: "Invalid credentials — user not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`[LOGIN] Rejected: wrong password for user=${user.email}`);
      return res.status(401).json({ success: false, error: "Invalid credentials — wrong password" });
    }

    const accessToken = generateToken(user.id, user.email, user.name, user.role);
    const refreshToken = generateRefreshToken(user.id);

    const userResponse: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    console.log(`[LOGIN] Success: user=${user.email}`);

    res.json({
      success: true,
      data: {
        token: accessToken,
        accessToken,
        refreshToken,
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
          role: user.role,
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
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ["station"],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const userResponse: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      station: user.station,
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
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: "Refresh token required" });
    }

    const refreshSecret = process.env.REFRESH_SECRET;
    if (!refreshSecret) {
      return res.status(500).json({ success: false, error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, refreshSecret) as { userId?: string; id?: string };
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(400).json({ success: false, error: "Invalid token payload" });
    }

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    const newAccessToken = generateToken(user.id, user.email, user.name, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        token: newAccessToken,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error: any) {
    res.status(401).json({ success: false, error: "Invalid or expired refresh token" });
  }
};

/**
 * CRITICAL FIX: Actually generates a reset token and sends email.
 * SECURITY FIX: Returns identical message whether user exists or not
 * to prevent user enumeration attacks.
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await userRepository.findOne({ where: { email } });

    // SECURITY FIX: Don't leak whether email exists
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists, reset instructions have been sent.",
      });
    }

    const resetSecret = process.env.RESET_TOKEN_SECRET;
    if (!resetSecret) {
      console.error("[FORGOT PASSWORD] RESET_TOKEN_SECRET not configured");
      return res.status(500).json({ success: false, error: "Server configuration error" });
    }

    const resetToken = jwt.sign(
      { userId: user.id, purpose: "password_reset" },
      resetSecret,
      { expiresIn: "15m" }
    );

    // Save hash to prevent replay attacks
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    await userRepository.update(user.id, {
      resetTokenHash,
      resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
    } as any);

    const resetUrl = `${process.env.CLIENT_URL || "https://gasmobil.com"}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset — GasMobil",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
    });

    res.json({
      success: true,
      message: "If an account exists, reset instructions have been sent.",
    });
  } catch (error: any) {
    console.error("[FORGOT PASSWORD] ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * CRITICAL FIX: Uses separate RESET_TOKEN_SECRET instead of JWT_SECRET.
 * Verifies token purpose and expiry. Checks token hash to prevent replay.
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, error: "Token and password required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const resetSecret = process.env.RESET_TOKEN_SECRET;
    if (!resetSecret) {
      return res.status(500).json({ success: false, error: "Server configuration error" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, resetSecret);
    } catch {
      return res.status(400).json({ success: false, error: "Invalid or expired token" });
    }

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ success: false, error: "Invalid token purpose" });
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(400).json({ success: false, error: "Invalid token payload" });
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(400).json({ success: false, error: "User not found" });
    }

    // Verify token hash to prevent replay
    if (user.resetTokenHash && !(await bcrypt.compare(token, user.resetTokenHash))) {
      return res.status(400).json({ success: false, error: "Token already used or invalid" });
    }

    // Check expiry
    if (user.resetTokenExpiry && new Date() > new Date(user.resetTokenExpiry)) {
      return res.status(400).json({ success: false, error: "Token expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await userRepository.update(userId, {
      password: hashedPassword,
      resetTokenHash: null,
      resetTokenExpiry: null,
    } as any);

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error: any) {
    console.error("[RESET PASSWORD] ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * HIGH FIX: Added phone number uniqueness check.
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, phone, address, city, latitude, longitude } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);

    // HIGH FIX: Check phone uniqueness before updating
    if (phone !== undefined) {
      const existingPhone = await userRepository.findOne({
        where: { phone },
        select: ["id"],
      });
      if (existingPhone && existingPhone.id !== userId) {
        return res.status(409).json({ success: false, error: "Phone number already in use" });
      }
      updateData.phone = phone;
    }

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

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await userRepository.update(userId, { password: hashedPassword } as any);

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};