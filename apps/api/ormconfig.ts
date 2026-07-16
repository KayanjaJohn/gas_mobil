import { DataSource } from 'typeorm';
import { User } from './src/entities/User';
import { Station } from './src/entities/Station';
import { Product } from './src/entities/Product';
import { Order } from './src/entities/Order';
import { OrderItem } from './src/entities/OrderItem';
import { Delivery } from './src/entities/Delivery';
import { Wallet } from './src/entities/Wallet';
import { Transaction } from './src/entities/Transaction';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gas_mobil',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Station, Product, Order, OrderItem, Delivery, Wallet, Transaction],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});
