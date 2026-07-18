import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Wallet } from '../entities/Wallet';
import { Transaction } from '../entities/Transaction';

const walletRepository = AppDataSource.getRepository(Wallet);
const transactionRepository = AppDataSource.getRepository(Transaction);

export const getWallet = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const wallet = await walletRepository.findOne({
      where: { userId: user.id }
    });

    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    const transactions = await transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: 20
    });

    res.json({
      success: true,
      data: { wallet, transactions }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Renamed from 'topUp' to 'topUpWallet' to match route import
export const topUpWallet = async (req: Request, res: Response) => {
  try {
    const { amount, paymentMethod } = req.body;
    const user = (req as any).user;

    const wallet = await walletRepository.findOne({ where: { userId: user.id } });
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    wallet.balance = Number(wallet.balance) + Number(amount);
    await walletRepository.save(wallet);

    const transaction = new Transaction();
    transaction.walletId = wallet.id;
    transaction.amount = Number(amount);
    transaction.type = 'credit';
    transaction.orderId = null;
    transaction.description = 'Wallet top-up via ' + (paymentMethod || 'unknown');
    transaction.status = 'completed';
    transaction.externalReference = null;
    await transactionRepository.save(transaction);

    res.json({ success: true, data: { wallet, transaction } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
