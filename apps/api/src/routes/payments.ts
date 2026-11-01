import express from "express";
import { markCashOnDelivery } from "../controllers/paymentController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

const onlinePaymentsDisabled: express.RequestHandler = (_req, res) => {
  res.status(503).json({
    success: false,
    error: "Online payments are disabled. Please select cash on delivery.",
  });
};

// Cash on delivery remains available.
router.post("/cash-on-delivery", authMiddleware, markCashOnDelivery);

// Explicitly reject all online payment initiation, status checks, and provider callbacks.
router.post("/mobile/initiate", authMiddleware, onlinePaymentsDisabled);
router.get("/mobile/status", authMiddleware, onlinePaymentsDisabled);
router.post("/wallet/pay", authMiddleware, onlinePaymentsDisabled);
router.post("/card/initiate", authMiddleware, onlinePaymentsDisabled);
router.post("/webhook/momo", onlinePaymentsDisabled);
router.post("/webhook/airtel", onlinePaymentsDisabled);
router.post("/webhook/stripe", onlinePaymentsDisabled);

export default router;