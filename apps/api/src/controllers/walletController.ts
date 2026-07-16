import { Request, Response } from 'express';
import AppDataSource from '../config/database';  // Add this
import { Wallet } from '../entities/Wallet';
import { Transaction } from '../entities/Transaction';

export const getWallet = async (req: Request, res: Response) => {
  try {
    const walletRepository = getRepository(Wallet);
    const transactionRepository = getRepository(Transaction);

    const wallet = await walletRepository.findOne({
      where: { userId: req.user.id }
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

export const topUp = async (req: Request, res: Response) => {
  try {
    const { amount, paymentMethod } = req.body;
    const walletRepository = getRepository(Wallet);
    const transactionRepository = getRepository(Transaction);

    const wallet = await walletRepository.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    wallet.balance = Number(wallet.balance) + Number(amount);
    await walletRepository.save(wallet);

    const transaction = transactionRepository.create({
      walletId: wallet.id,
      amount,
      type: 'credit',
      purpose: 'wallet_topup',
      status: 'completed'
    });
    await transactionRepository.save(transaction);

    res.json({ success: true, data: { wallet, transaction } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
