import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface DecodedToken {
	userId: string;
	email: string;
	name?: string;
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
		const jwtSecret = process.env.JWT_SECRET || "secret";
		const decoded = jwt.verify(token, jwtSecret as any) as DecodedToken;
		(req as any).userId = decoded.userId;
		(req as any).userName = decoded.name || "Unknown User";
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