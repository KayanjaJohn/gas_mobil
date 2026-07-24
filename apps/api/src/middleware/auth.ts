import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import AppDataSource from "../config/database";
import { User } from "../entities/User";

interface DecodedToken {
  userId: string;
  email: string;
  name?: string;
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
    const jwtSecret = process.env.JWT_SECRET || "secret";
    const decoded = jwt.verify(token, jwtSecret as any) as DecodedToken;

    // Set both old-style and new-style properties for compatibility
    (req as any).userId = decoded.userId;
    (req as any).userName = decoded.name || "Unknown User";

    // Fetch full user for role checks
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ 
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    (req as any).user = user;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

export const generateToken = (userId: string, email: string, name?: string) => {
  const jwtSecret = process.env.JWT_SECRET || "secret";
  return jwt.sign(
    { userId, email, name },
    jwtSecret as any,
    { expiresIn: process.env.JWT_EXPIRE || "7d" } as any,
  );
};

export const verifyToken = (token: string): DecodedToken | null => {
  try {
    const jwtSecret = process.env.JWT_SECRET || "secret";
    return jwt.verify(token, jwtSecret as any) as DecodedToken;
  } catch {
    return null;
  }
};
