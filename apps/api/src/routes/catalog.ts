import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getCatalog,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  addCatalogToStation,
} from "../controllers/catalogController";

const router = Router();

router.get("/", getCatalog);
router.post("/", authMiddleware, createCatalogItem);
router.put("/:id", authMiddleware, updateCatalogItem);
router.delete("/:id", authMiddleware, deleteCatalogItem);
router.post("/:id/add-to-station", authMiddleware, addCatalogToStation);

export default router;