import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(__dirname, "../../uploads/products");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadProductImage = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (!["admin", "agent"].includes(user.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image file provided" });
    }

    const file = req.file as Express.Multer.File;
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, file.buffer);

    const imageUrl = `/uploads/products/${filename}`;

    res.json({ success: true, data: { imageUrl, filename } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};