import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', nullable: false })
  declare orderId: string;

  @ManyToOne(() => Order, order => order.items)
  @JoinColumn({ name: 'orderId' })
  declare order: Order;

  @Column({ type: 'varchar', nullable: false })
  declare productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  declare product: Product;

  @Column({ type: 'int', default: 1 })
  declare quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  declare price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  declare subtotal: number;
}
