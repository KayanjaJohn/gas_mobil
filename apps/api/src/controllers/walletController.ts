import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Wallet } from '../entities/Wallet';
import { Transaction } from '../entities/Transaction';

const walletRepository = AppDataSource.getRepository(Wallet);
const transactionRepository = AppDataSource.getRepository(Transaction);

export const getWallet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const wallet = await walletRepository.findOne({
      where: { userId },
      relations: ['transactions'],
    });

    if (!wallet) {
      const newWallet = walletRepository.create({
        userId,
        balance: 0,
        totalCredited: 0,
        totalDebited: 0,
      });
      await walletRepository.save(newWallet);

      return res.json({
        success: true,
        data: {
          ...newWallet,
          transactions: [],
        },
      });
    }

    const transactions = await transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    res.json({
      success: true,
      data: {
        ...wallet,
        transactions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const topUpWallet = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userId = (req as any).userId;
    const { amount, paymentMethod, externalReference } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    let wallet = await queryRunner.manager.findOne(Wallet, { where: { userId } });
    if (!wallet) {
      wallet = queryRunner.manager.create(Wallet, {
        userId,
        balance: 0,
        totalCredited: 0,
        totalDebited: 0,
      });
    }

    wallet.balance = Number(wallet.balance) + Number(amount);
    wallet.totalCredited = Number(wallet.totalCredited) + Number(amount);
    await queryRunner.manager.save(wallet);

    const transaction = queryRunner.manager.create(Transaction, {
      walletId: wallet.id,
      amount,
      type: 'credit',
      purpose: 'top_up',
      description: `Wallet top-up via ${paymentMethod}`,
      status: 'completed',
      externalReference,
    });
    await queryRunner.manager.save(transaction);

    await queryRunner.commitTransaction();

    res.json({
      success: true,
      data: { wallet, transaction },
      message: 'Wallet topped up successfully',
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await queryRunner.release();
  }
};