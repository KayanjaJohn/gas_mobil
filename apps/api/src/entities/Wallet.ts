import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Transaction } from './Transaction';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', nullable: false })
  declare userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  declare user: User;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  declare balance: number;

  @OneToMany(() => Transaction, transaction => transaction.wallet)
  declare transactions: Transaction[];

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
