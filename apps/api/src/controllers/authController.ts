import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { generateToken } from "../middleware/auth";

const userRepository = AppDataSource.getRepository(User);

export const register = async (req: Request, res: Response) => {
  console.log("[REGISTER] Request received:", JSON.stringify(req.body, null, 2));

  try {
    const { name, email, phone, password, address, city, state, zipCode } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      console.log("[REGISTER] Validation failed - missing fields");
      return res.status(400).json({ 
        success: false, 
        error: "Name, email, phone, and password are required" 
      });
    }

    if (password.length < 6) {
      console.log("[REGISTER] Validation failed - password too short");
      return res.status(400).json({ 
        success: false, 
        error: "Password must be at least 6 characters" 
      });
    }

    // Check if user exists
    console.log("[REGISTER] Checking for existing user...");
    const existingUser = await userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingUser) {
      console.log("[REGISTER] User already exists:", existingUser.email);
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    // Hash password
    console.log("[REGISTER] Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("[REGISTER] Password hashed successfully");

    // Create user
    console.log("[REGISTER] Creating user object...");
    const user = userRepository.create({
      name,
      email,
      phone,
      password: hashedPassword,
      address,
      city,
      state,
      zipCode,
    });

    console.log("[REGISTER] Saving user to database...");
    await userRepository.save(user);
    console.log("[REGISTER] User saved successfully, ID:", user.id);

    // Generate token
    const token = generateToken(user.id, user.email, user.name);
    console.log("[REGISTER] Token generated");

    const response = {
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
    };

    console.log("[REGISTER] Sending response:", JSON.stringify(response, null, 2));
    res.status(201).json(response);

  } catch (error: any) {
    console.error("[REGISTER] ERROR:", error);
    console.error("[REGISTER] Stack:", error.stack);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  console.log("[LOGIN] Request received:", JSON.stringify(req.body, null, 2));

  try {
    const { emailOrPhone, password } = req.body;

    if (!password || !emailOrPhone) {
      console.log("[LOGIN] Validation failed - missing fields");
      return res.status(400).json({ 
        success: false, 
        error: "Email/phone and password are required" 
      });
    }

    // Determine if email or phone
    const isEmail = emailOrPhone.includes("@");
    const where = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };

    console.log("[LOGIN] Looking up user by:", isEmail ? "email" : "phone", "=", emailOrPhone);

    const user = await userRepository.findOne({
      where,
      select: ["id", "name", "email", "phone", "password"],
    });

    if (!user) {
      console.log("[LOGIN] User not found");
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    console.log("[LOGIN] User found:", user.email);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("[LOGIN] Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.email, user.name);
    console.log("[LOGIN] Login successful for:", user.email);

    res.json({
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
    console.error("[LOGIN] ERROR:", error);
    console.error("[LOGIN] Stack:", error.stack);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

export const verify = async (req: Request, res: Response) => {
  console.log("[VERIFY] Request received, userId:", (req as any).userId);

  try {
    const userId = (req as any).userId;
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      console.log("[VERIFY] User not found:", userId);
      return res.status(404).json({ success: false, error: "User not found" });
    }

    console.log("[VERIFY] User verified:", user.email);
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