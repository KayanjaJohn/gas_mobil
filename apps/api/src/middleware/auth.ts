import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface DecodedToken {
  userId: string;
  email: string;
  name?: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, error: "Authorization token required" });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    (req as any).userId = decoded.userId;
    (req as any).userEmail = decoded.email;
    (req as any).userName = decoded.name || "Unknown User";
    (req as any).userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

// Role-based middleware
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }
    next();
  };
};

export const generateToken = (userId: string, email: string, name: string, role: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  
  return jwt.sign(
    { userId, email, name, role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRE || "7d" } as jwt.SignOptions
  );
};