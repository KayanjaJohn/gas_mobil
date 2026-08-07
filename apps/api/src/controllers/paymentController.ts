import { Request, Response } from 'express';
import Stripe from 'stripe';
import AppDataSource from '../config/database';
import { Order } from '../entities/Order';
import { Wallet } from '../entities/Wallet';
import { Transaction } from '../entities/Transaction';
import * as momoService from '../services/momoService';
import * as airtelService from '../services/airtelMoneyService';
import { createSystemNotification } from '../services/notificationService';

const orderRepository = AppDataSource.getRepository(Order);
const walletRepository = AppDataSource.getRepository(Wallet);
const transactionRepository = AppDataSource.getRepository(Transaction);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ── 1. Initiate Mobile Money (MTN / Airtel) ──────────────────────
export const initiateMobilePayment = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { orderId, phoneNumber, provider } = req.body;
    const user = (req as any).user;

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
      return res.status(400).json({ success: false, error: 'Invalid provider. Use mtn or airtel.' });
    }

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

// ── 2. Check Payment Status (Polling) ────────────────────────────
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

    if (status === 'SUCCESSFUL' || status === 'TS') {
      const order = await orderRepository.findOne({ where: { id: orderId as string } });
      if (order && order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
        await orderRepository.save(order);

        const transaction = await transactionRepository.findOne({
          where: { externalReference: referenceId as string },
        });
        if (transaction) {
          transaction.status = 'completed';
          await transactionRepository.save(transaction);
        }

        await createSystemNotification({
          type: 'payment_received',
          orderId: order.id,
          stationId: order.stationId,
          title: 'Payment Received',
          message: `Mobile money payment confirmed for order #${order.id.slice(0, 8).toUpperCase()}.`,
          data: { provider, amount: order.totalAmount, referenceId },
          notifyAdmin: true,
          notifyAgent: true,
          notifyCustomer: true,
          userId: order.userId,
        });
      }
    }

    res.json({ success: true, data: { status, provider, referenceId, details: paymentData } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── 3. Wallet Payment (Actually Debits Wallet) ─────────────────
export const payWithWallet = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { orderId } = req.body;
    const user = (req as any).user;

    const order = await queryRunner.manager.findOne(Order, {
      where: { id: orderId, userId: user.id },
    });
    if (!order) throw new Error('Order not found');

    const wallet = await queryRunner.manager.findOne(Wallet, {
      where: { userId: user.id },
    });
    if (!wallet) throw new Error('Wallet not found');
    if (Number(wallet.balance) < Number(order.totalAmount)) {
      return res.status(400).json({ success: false, error: 'Insufficient wallet balance' });
    }

    // CRITICAL FIX: Actually debit the wallet
    wallet.balance = Number(wallet.balance) - Number(order.totalAmount);
    await queryRunner.manager.save(wallet);

    const transaction = new Transaction();
    transaction.walletId = wallet.id;
    transaction.orderId = order.id;
    transaction.amount = Number(order.totalAmount);
    transaction.type = 'debit';
    transaction.status = 'completed';
    transaction.description = `Wallet payment for order ${orderId}`;
    await queryRunner.manager.save(transaction);

    order.paymentMethod = 'wallet';
    order.paymentStatus = 'paid';
    await queryRunner.manager.save(order);

    await queryRunner.commitTransaction();

    await createSystemNotification({
      type: 'wallet_debited',
      userId: user.id,
      title: 'Wallet Payment Successful',
      message: `UGX ${Number(order.totalAmount).toLocaleString()} paid from wallet for order #${orderId.slice(0, 8).toUpperCase()}.`,
      data: { orderId, amount: order.totalAmount, balance: wallet.balance },
      notifyCustomer: true,
    });

    await createSystemNotification({
      type: 'payment_received',
      orderId: order.id,
      stationId: order.stationId,
      title: 'Payment Received (Wallet)',
      message: `Wallet payment confirmed for order #${orderId.slice(0, 8).toUpperCase()}.`,
      data: { orderId, amount: order.totalAmount },
      notifyAdmin: true,
      notifyAgent: true,
    });

    res.json({ success: true, data: { order, walletBalance: wallet.balance } });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await queryRunner.release();
  }
};

// ── 4. Card Payment (Stripe) ───────────────────────────────────────
export const initiateCardPayment = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { orderId } = req.body;
    const user = (req as any).user;

    const order = await queryRunner.manager.findOne(Order, {
      where: { id: orderId, userId: user.id },
      relations: ['user'],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalAmount) * 100),
      currency: 'ugx',
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        userId: user.id,
        userPhone: order.user?.phone || '',
      },
      description: `GasMobil Order #${order.id.slice(0, 8).toUpperCase()}`,
    });

    order.paymentMethod = 'card';
    order.paymentStatus = 'pending';
    await queryRunner.manager.save(order);

    await queryRunner.commitTransaction();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId: order.id,
      },
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('Card payment initiation error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await queryRunner.release();
  }
};

// ── 5. Stripe Webhook ────────────────────────────────────────────
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;

      if (orderId) {
        const order = await orderRepository.findOne({ where: { id: orderId } });
        if (order) {
          order.paymentStatus = 'paid';
          await orderRepository.save(order);

          await createSystemNotification({
            type: 'payment_received',
            orderId: order.id,
            stationId: order.stationId,
            title: 'Payment Received (Card)',
            message: `Card payment of UGX ${Number(order.totalAmount).toLocaleString()} confirmed for order #${order.id.slice(0, 8).toUpperCase()}.`,
            data: { method: 'card', amount: order.totalAmount, stripeId: intent.id },
            notifyAdmin: true,
            notifyAgent: true,
            notifyCustomer: true,
            userId: order.userId,
          });
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const order = await orderRepository.findOne({ where: { id: intent.metadata?.orderId } });
      if (order) {
        order.paymentStatus = 'failed';
        await orderRepository.save(order);
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── 6. MTN MoMo Callback ─────────────────────────────────────────
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

    let order: Order | null = null;
    if (transaction.orderId) {
      order = await orderRepository.findOne({ where: { id: transaction.orderId } });
    }

    if (status === 'SUCCESSFUL') {
      transaction.status = 'completed';
      if (order) {
        order.paymentStatus = 'paid';
        await orderRepository.save(order);

        await createSystemNotification({
          type: 'payment_received',
          orderId: order.id,
          stationId: order.stationId,
          title: 'Payment Received (MTN MoMo)',
          message: `MoMo payment confirmed for order #${order.id.slice(0, 8).toUpperCase()}.`,
          data: { provider: 'mtn', amount: order.totalAmount },
          notifyAdmin: true,
          notifyAgent: true,
          notifyCustomer: true,
          userId: order.userId,
        });
      }
    } else if (status === 'FAILED') {
      transaction.status = 'failed';
      if (order) {
        order.paymentStatus = 'failed';
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

// ── 7. Airtel Money Callback ─────────────────────────────────────
export const airtelCallback = async (req: Request, res: Response) => {
  try {
    const { transaction: txBody, status } = req.body;
    const transactionId = txBody?.id;
    console.log('Airtel Money Callback:', { transactionId, status });

    const transactionRecord = await transactionRepository.findOne({
      where: { externalReference: transactionId },
    });

    if (!transactionRecord) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    let order: Order | null = null;
    if (transactionRecord.orderId) {
      order = await orderRepository.findOne({ where: { id: transactionRecord.orderId } });
    }

    if (status?.success === true || status?.code === 'TS') {
      transactionRecord.status = 'completed';
      if (order) {
        order.paymentStatus = 'paid';
        await orderRepository.save(order);

        await createSystemNotification({
          type: 'payment_received',
          orderId: order.id,
          stationId: order.stationId,
          title: 'Payment Received (Airtel Money)',
          message: `Airtel Money payment confirmed for order #${order.id.slice(0, 8).toUpperCase()}.`,
          data: { provider: 'airtel', amount: order.totalAmount },
          notifyAdmin: true,
          notifyAgent: true,
          notifyCustomer: true,
          userId: order.userId,
        });
      }
    } else {
      transactionRecord.status = 'failed';
      if (order) {
        order.paymentStatus = 'failed';
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

// ── 8. Cash on Delivery ──────────────────────────────────────────
export const markCashOnDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const user = (req as any).user;

    const order = await orderRepository.findOne({
      where: { id: orderId, userId: user.id },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.paymentMethod = 'cash';
    order.paymentStatus = 'pending';
    await orderRepository.save(order);

    await createSystemNotification({
      type: 'order_placed',
      orderId: order.id,
      stationId: order.stationId,
      title: 'Cash on Delivery',
      message: `Cash on delivery selected for order #${order.id.slice(0, 8).toUpperCase()}. Pay when your order arrives.`,
      data: { orderId, method: 'cash' },
      notifyAdmin: true,
      notifyAgent: true,
    });

    res.json({
      success: true,
      data: order,
      message: 'Cash on delivery selected. Pay when your order arrives.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};