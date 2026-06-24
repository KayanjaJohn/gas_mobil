import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Wallet } from './Wallet';

export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', nullable: false })
  declare walletId: string;

  @ManyToOne(() => Wallet, wallet => wallet.transactions)
  @JoinColumn({ name: 'walletId' })
  declare wallet: Wallet;

  @Column({ type: 'varchar', nullable: true })
  declare orderId: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  declare amount: number;

  @Column({ type: 'enum', enum: ['credit', 'debit'] })
  declare type: TransactionType;

  @Column({ type: 'enum', enum: ['pending', 'completed', 'failed'], default: 'pending' })
  declare status: TransactionStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  declare externalReference: string | null;

  @Column({ type: 'text', nullable: true })
  declare description: string | null;

  @CreateDateColumn()
  declare createdAt: Date;
}
