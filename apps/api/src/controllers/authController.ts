import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import  AppDataSource  from "../config/database";
import { User } from "../entities/User";
import { generateToken } from "../middleware/auth";

const userRepository = AppDataSource.getRepository(User);

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, address, city, state, zipCode } = req.body;

    // Check if user exists
    const existingUser = await userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(409).json({ success: false, error: "User with this email or phone already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = userRepository.create({
      name,
      email,
      phone,
      password: hashedPassword,
      address,
      city,
      state,
      zipCode,
      role: 'customer',
    });

    await userRepository.save(user);

    // Generate token
    const token = generateToken(user.id, user.email, user.name, user.role);

    res.status(201).json({
      success: true,
      data: {
        token,
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
    res.status(500).json({ success: false, error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;

    // Determine if email or phone
    const isEmail = emailOrPhone.includes("@");
    const where = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };

    const user = await userRepository.findOne({
      where,
      select: ["id", "name", "email", "phone", "password", "role", "isActive"],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: "Invalid credentials or account inactive" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.email, user.name, user.role);

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
        },
      },
    });
  } catch (error: any) {
    console.error("[LOGIN] ERROR:", error);
    res.status(500).json({ success: false, error: "Login failed" });
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
          address: user.address,
          city: user.city,
          isActive: user.isActive,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Verification failed" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, address, city, state, zipCode } = req.body;

    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    user.name = name || user.name;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.zipCode = zipCode || user.zipCode;

    await userRepository.save(user);

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
    res.status(500).json({ success: false, error: "Update failed" });
  }
};