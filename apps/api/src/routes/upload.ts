import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth";
import { uploadProductImage } from "../controllers/uploadController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/product-image", authMiddleware, upload.single("image"), uploadProductImage);

export default router;