import 'reflect-metadata';
import { DataSource } from 'typeorm';
import mysql from 'mysql2/promise';
import { User } from '../entities/User';
import { Product } from '../entities/Product';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Delivery } from '../entities/Delivery';
import { Cylinder } from '../entities/Cylinder';
import { Accessory } from '../entities/Accessory';
import { Wallet } from '../entities/Wallet';

async function ensureDatabaseExists() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USERNAME || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_DATABASE || 'gas_mobil';

  try {
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${database}' ensured`);
    await connection.end();
  } catch (error) {
    console.error('Failed to create database:', error);
    throw error;
  }
}

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'gas_mobil',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Product, Order, OrderItem, Delivery, Cylinder, Accessory, Wallet],
});

export async function initializeDatabase() {
  await ensureDatabaseExists();
  return AppDataSource.initialize();
}

export default AppDataSource;