import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Station } from '../entities/Station';
import { Product } from '../entities/Product';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Delivery } from '../entities/Delivery';
import { Wallet } from '../entities/Wallet';
import { Transaction } from '../entities/Transaction';
import { Notification } from '../entities/Notification';
import { ProductCatalog } from '../entities/ProductCatalog';
import { StationActivity } from '../entities/StationActivity';
import { SupportTicket } from '../entities/SupportTicket';
import { SupportTicket } from '../entities/SupportTicket';

const databaseUrl = process.env.DATABASE_URL?.trim();

const AppDataSource = new DataSource({
  type: 'mysql',
  // Prefer the managed database URL supplied by Twelvinks.
  // Keep DB_* fallback for local Docker/Codespaces development.
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number.parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gas_mobil',
      }),
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Station, Product, Order, OrderItem, Delivery, Wallet, Transaction, Notification, ProductCatalog, StationActivity, SupportTicket],
  // Resolve compiled .js migrations in production and .ts migrations in development.
  migrations: [__dirname + '/../migrations/*{.js,.ts}'],
  migrationsRun: true,
  subscribers: [],
});

export const initializeDatabase = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};

export default AppDataSource;
