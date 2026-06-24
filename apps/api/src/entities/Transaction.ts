import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Wallet } from './Wallet';

@Entity('transactions')
@Index(['walletId'])
@Index(['createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walletId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['credit', 'debit'] })
  type: string;

  @Column({ type: 'enum', enum: [
    'top_up', 'order_payment', 'refund', 'withdrawal',
    'bonus', 'adjustment'
  ]})
  purpose: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'completed', type: 'enum', enum: ['pending', 'completed', 'failed', 'reversed'] })
  status: string;

  @Column({ nullable: true })
  externalReference: string; // For MTN/Airtel/Stripe transaction IDs

  @CreateDateColumn()
  createdAt: Date;
}