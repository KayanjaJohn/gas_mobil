import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Wallet } from '../entities/Wallet';

const walletRepository = AppDataSource.getRepository(Wallet);

export const getWallet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    let wallet = await walletRepository.findOneBy({ userId });

    if (!wallet) {
      wallet = walletRepository.create({ userId, balance: 0, transactions: [] });
      await walletRepository.save(wallet);
    }

    res.json({ success: true, data: wallet });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addMoneyToWallet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { amount } = req.body;

    let wallet = await walletRepository.findOneBy({ userId });
    if (!wallet) {
      wallet = walletRepository.create({ userId, balance: 0, transactions: [] });
    }

    wallet.balance = Number(wallet.balance) + Number(amount);
    if (!wallet.transactions) {
      wallet.transactions = [];
    }
    wallet.transactions.push({
      id: `TXN-${Date.now()}`,
      amount,
      type: 'credit',
      description: 'Money added to wallet',
      date: new Date(),
    });

    await walletRepository.save(wallet);
    res.json({ success: true, data: wallet });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};