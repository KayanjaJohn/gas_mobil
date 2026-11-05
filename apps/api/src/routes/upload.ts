import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'));
    }
  },
});

// Auth is already applied by server.ts (authMiddleware)
// We only need multer here
router.post('/', upload.single('image'), uploadImage);

// Multer error handler
router.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'This image is larger than 5 MB. Choose a smaller image.' });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ success: false, error: "Select one image file and try again." });
    }
    return res.status(400).json({ success: false, error: "We couldn't process that image. Use a JPG, PNG or WebP file." });
  }
  if (err && /Only JPG, PNG, and WebP/i.test(String(err.message || ""))) {
    return res.status(400).json({
      success: false,
      error: "Choose a JPG, PNG or WebP image.",
    });
  }
  if (err) {
    console.error("[Upload] File processing failed:", err?.message || err);
    return res.status(500).json({ success: false, error: "The image upload service is temporarily unavailable. Please try again." });
  }
  next();
});

export default router;
