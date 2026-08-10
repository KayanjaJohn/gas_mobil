import { Request, Response } from "express";
import AppDataSource from "../config/database";
import { Wallet } from "../entities/Wallet";
import { Transaction } from "../entities/Transaction";

const walletRepository = AppDataSource.getRepository(Wallet);
const transactionRepository = AppDataSource.getRepository(Transaction);

export const getWallet = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const wallet = await walletRepository.findOne({
      where: { userId: user.id },
    });

    if (!wallet) {
      return res.status(404).json({ success: false, error: "Wallet not found" });
    }

    const transactions = await transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: "DESC" },
      take: 20,
    });

    res.json({
      success: true,
      data: { wallet, transactions },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * CRITICAL SECURITY FIX:
 * Old code directly added balance without payment verification.
 * Now this initiates a real mobile-money payment and creates a PENDING
 * credit transaction. The wallet is only credited when the provider
 * callback confirms payment (see momoCallback / airtelCallback).
 */
export const topUpWallet = async (req: Request, res: Response) => {
  try {
    const { amount, paymentMethod, phoneNumber } = req.body;
    const user = (req as any).user;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Valid amount required" });
    }
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: "Phone number required for mobile money top-up" });
    }
    if (!["mtn", "airtel"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, error: "Payment method must be mtn or airtel" });
    }

    const wallet = await walletRepository.findOne({ where: { userId: user.id } });
    if (!wallet) {
      return res.status(404).json({ success: false, error: "Wallet not found" });
    }

    // Initiate actual mobile-money payment
    let referenceId: string;
    const externalId = `wallet-topup-${user.id}-${Date.now()}`;

    if (paymentMethod === "mtn") {
      const { requestPayment } = await import("../services/momoService");
      const result = await requestPayment(
        phoneNumber,
        Number(amount),
        "UGX",
        externalId,
        "GasMobil Wallet Top-up",
        "Wallet top-up"
      );
      referenceId = result.referenceId;
    } else {
      const { requestPayment: airtelRequest } = await import("../services/airtelMoneyService");
      const result = await airtelRequest(phoneNumber, Number(amount), "UGX", externalId);
      referenceId = result.transactionId || result.referenceId || "";
    }

    // Create pending credit transaction
    const transaction = new Transaction();
    transaction.walletId = wallet.id;
    transaction.amount = Number(amount);
    transaction.type = "credit";
    transaction.orderId = null;
    transaction.description = `Wallet top-up via ${paymentMethod} — pending`;
    transaction.status = "pending";
    transaction.externalReference = referenceId;
    await transactionRepository.save(transaction);

    res.json({
      success: true,
      data: {
        wallet,
        transaction,
        referenceId,
        message: `Payment request sent to ${phoneNumber}. Please approve on your phone.`,
      },
    });
  } catch (error: any) {
    console.error("[topUpWallet] error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Internal helper: called by payment callbacks to actually credit wallet.
 * This is the ONLY place wallet balance should increase for top-ups.
 */
export async function creditWalletFromCallback(
  transactionId: string,
  referenceId: string
): Promise<boolean> {
  const transaction = await transactionRepository.findOne({
    where: { id: transactionId, externalReference: referenceId },
  });
  if (!transaction) return false;
  if (transaction.status !== "pending") return false;
  if (!transaction.description?.includes("Wallet top-up")) return false;
  if (transaction.description?.includes("credited")) return false;

  const wallet = await walletRepository.findOne({
    where: { id: transaction.walletId },
  });
  if (!wallet) return false;

  // Use integer math to avoid float precision issues
  const currentBalance = Math.round(Number(wallet.balance) * 100);
  const addAmount = Math.round(Number(transaction.amount) * 100);
  wallet.balance = (currentBalance + addAmount) / 100;

  await walletRepository.save(wallet);

  transaction.status = "completed";
  transaction.description += " — credited";
  await transactionRepository.save(transaction);

  return true;
}