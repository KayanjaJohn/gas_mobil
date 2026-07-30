import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import AppDataSource from "../config/database";
import { User } from "../entities/User";

interface DecodedToken {
  userId?: string;
  id?: string;
  email: string;
  name?: string;
  role?: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, error: "Authorization token required" });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("❌ JWT_SECRET is not set in environment");
      return res.status(500).json({ success: false, error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, jwtSecret as any) as DecodedToken;

    // SUPPORT BOTH OLD { id } AND NEW { userId } TOKEN SHAPES
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Invalid token payload" });
    }

    (req as any).userId = userId;
    (req as any).userName = decoded.name || "Unknown User";

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    (req as any).user = user;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    return res.status(401).json({ success: false, error: "Authentication failed" });
  }
};

export const generateToken = (userId: string, email: string, name?: string, role?: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign(
    { userId, id: userId, email, name, role },
    jwtSecret as any,
    { expiresIn: process.env.JWT_EXPIRE || "15m" } as any,
  );
};

export const generateRefreshToken = (userId: string) => {
  const refreshSecret = process.env.REFRESH_SECRET;
  if (!refreshSecret) {
    throw new Error("REFRESH_SECRET is not set");
  }
  return jwt.sign(
    { userId, id: userId },
    refreshSecret as any,
    { expiresIn: process.env.REFRESH_EXPIRES_IN || "7d" } as any,
  );
};

export const verifyToken = (token: string): DecodedToken | null => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return null;
    return jwt.verify(token, jwtSecret as any) as DecodedToken;
  } catch {
    return null;
  }
};