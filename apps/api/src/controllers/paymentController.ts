import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Order } from '../entities/Order';
import { Wallet } from '../entities/Wallet';
import { Transaction } from '../entities/Transaction';
import * as momoService from '../services/momoService';
import * as airtelService from '../services/airtelMoneyService';
import { broadcastToUser } from '../config/socket';

const orderRepository = AppDataSource.getRepository(Order);
const walletRepository = AppDataSource.getRepository(Wallet);
const transactionRepository = AppDataSource.getRepository(Transaction);

// Initiate mobile money payment
export const initiateMobilePayment = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { orderId, phoneNumber, provider } = req.body;
    const user = (req as any).user;  // FIXED: was req.userId

    const order = await queryRunner.manager.findOne(Order, {
      where: { id: orderId, userId: user.id },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ success: false, error: 'Payment already processed' });
    }

    let paymentResult: any;

    if (provider === 'mtn') {
      paymentResult = await momoService.requestPayment(
        phoneNumber,
        Number(order.totalAmount),
        'UGX',
        orderId,
        `Payment for Gas Mobil order ${orderId}`,
        'Gas cylinder delivery'
      );
    } else if (provider === 'airtel') {
      paymentResult = await airtelService.requestPayment(
        phoneNumber,
        Number(order.totalAmount),
        'UGX',
        orderId
      );
    } else {
      return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    // Create pending transaction record
    const wallet = await queryRunner.manager.findOne(Wallet, { where: { userId: user.id } });
    if (wallet) {
      const transaction = new Transaction();
      transaction.walletId = wallet.id;
      transaction.amount = Number(order.totalAmount);
      transaction.type = 'debit';
      transaction.orderId = order.id;
      transaction.description = `Mobile money payment (${provider}) for order ${orderId}`;
      transaction.status = 'pending';
      transaction.externalReference = paymentResult.referenceId || paymentResult.transactionId || '';
      await queryRunner.manager.save(transaction);
    }

    await queryRunner.commitTransaction();

    res.json({
      success: true,
      data: {
        orderId,
        provider,
        referenceId: paymentResult.referenceId || paymentResult.transactionId || '',
        status: 'pending',
        message: `Payment request sent to ${phoneNumber}. Please approve on your phone.`,
      },
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await queryRunner.release();
  }
};

// Check payment status (called by mobile app polling)
export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId, provider, referenceId } = req.query;

    let status: string | undefined;
    let paymentData: any;

    if (provider === 'mtn') {
      paymentData = await momoService.getPaymentStatus(referenceId as string);
      status = paymentData.status;
    } else if (provider === 'airtel') {
      paymentData = await airtelService.getTransactionStatus(referenceId as string);
      status = paymentData.transaction?.status;
    }

    // Update order if payment successful
    if (status === 'SUCCESSFUL' || status === 'TS') {
      const order = await orderRepository.findOne({ where: { id: orderId as string } });
      if (order && order.paymentStatus === 'pending') {
        (order as any).paymentStatus = 'paid';  // FIXED: was 'completed'
        await orderRepository.save(order);

        // Update transaction status
        const transaction = await transactionRepository.findOne({
          where: { externalReference: referenceId as string },
        });
        if (transaction) {
          transaction.status = 'completed';
          await transactionRepository.save(transaction);
        }

        broadcastToUser(order.userId, 'payment_completed', {
          orderId: order.id,
          message: 'Payment received! Your order is being processed.',
        });
      }
    }

    res.json({
      success: true,
      data: {
        status,
        provider,
        referenceId,
        details: paymentData,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// MTN MoMo callback webhook
export const momoCallback = async (req: Request, res: Response) => {
  try {
    const { referenceId, status, financialTransactionId } = req.body;

    console.log('MTN MoMo Callback:', { referenceId, status, financialTransactionId });

    const transaction = await transactionRepository.findOne({
      where: { externalReference: referenceId },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // FIXED: Handle null orderId
    let order: Order | null = null;
    if (transaction.orderId) {
      order = await orderRepository.findOne({
        where: { id: transaction.orderId },
      });
    }

    if (status === 'SUCCESSFUL') {
      transaction.status = 'completed';
      if (order) {
        (order as any).paymentStatus = 'paid';  // FIXED: was 'completed'
        await orderRepository.save(order);

        broadcastToUser(order.userId, 'payment_completed', {
          orderId: order.id,
          message: 'Payment confirmed! Your order is being processed.',
        });
      }
    } else if (status === 'FAILED') {
      transaction.status = 'failed';
      if (order) {
        (order as any).paymentStatus = 'failed';
        await orderRepository.save(order);
      }
    }

    transaction.externalReference = financialTransactionId || transaction.externalReference;
    await transactionRepository.save(transaction);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('MoMo callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Airtel Money callback webhook
export const airtelCallback = async (req: Request, res: Response) => {
  try {
    const { transaction, status } = req.body;
    const transactionId = transaction?.id;

    console.log('Airtel Money Callback:', { transactionId, status });

    const transactionRecord = await transactionRepository.findOne({
      where: { externalReference: transactionId },
    });

    if (!transactionRecord) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // FIXED: Handle null orderId
    let order: Order | null = null;
    if (transactionRecord.orderId) {
      order = await orderRepository.findOne({
        where: { id: transactionRecord.orderId },
      });
    }

    if (status?.success === true || status?.code === 'TS') {
      transactionRecord.status = 'completed';
      if (order) {
        (order as any).paymentStatus = 'paid';  // FIXED: was 'completed'
        await orderRepository.save(order);

        broadcastToUser(order.userId, 'payment_completed', {
          orderId: order.id,
          message: 'Payment confirmed! Your order is being processed.',
        });
      }
    } else {
      transactionRecord.status = 'failed';
      if (order) {
        (order as any).paymentStatus = 'failed';
        await orderRepository.save(order);
      }
    }

    await transactionRepository.save(transactionRecord);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Airtel callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cash on delivery - mark as pending (paid on delivery)
export const markCashOnDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const user = (req as any).user;  // FIXED: was req.userId

    const order = await orderRepository.findOne({
      where: { id: orderId, userId: user.id },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    (order as any).paymentMethod = 'cash';
    (order as any).paymentStatus = 'pending';
    await orderRepository.save(order);

    res.json({
      success: true,
      data: order,
      message: 'Cash on delivery selected. Pay when your order arrives.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
