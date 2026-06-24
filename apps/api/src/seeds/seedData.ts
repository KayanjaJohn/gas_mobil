import AppDataSource from '../config/database';
import { Station } from '../entities/Station';
import { User } from '../entities/User';
import { Product } from '../entities/Product';
import bcrypt from 'bcryptjs';

export const seedData = async () => {
  const stationRepo = AppDataSource.getRepository(Station);
  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);

  // Create Kampala station
  const station = stationRepo.create({
    name: 'Kampala Central Station',
    address: 'Plot 1, Kampala Road, Kampala',
    latitude: 0.3476,
    longitude: 32.5825,
    phone: '+256700000001',
    email: 'kampala@gasmobil.com',
  });
  await stationRepo.save(station);

  // Admin
  const admin = userRepo.create({
    name: 'System Admin',
    email: 'admin@gasmobil.com',
    phone: '+256700000000',
    password: await bcrypt.hash('Admin@123', 12),
    role: 'admin',
    isActive: true,
  });
  await userRepo.save(admin);

  // Agent
  const agent = userRepo.create({
    name: 'Station Agent',
    email: 'agent@gasmobil.com',
    phone: '+256700000002',
    password: await bcrypt.hash('Agent@123', 12),
    role: 'agent',
    stationId: station.id,
    isActive: true,
  });
  await userRepo.save(agent);

  // Driver
  const driver = userRepo.create({
    name: 'John Driver',
    email: 'driver@gasmobil.com',
    phone: '+256700000003',
    password: await bcrypt.hash('Driver@123', 12),
    role: 'driver',
    stationId: station.id,
    driverStatus: 'online',
    vehicleNumber: 'UAX 123B',
    vehicleType: 'Motorcycle',
    isActive: true,
  });
  await userRepo.save(driver);

  // Sample products
  const products = [
    { name: '6kg Gas Cylinder', description: 'Standard 6kg LPG cylinder', price: 85000, stock: 50, weight: 6, size: '6kg', type: 'cylinder' as const },
    { name: '12kg Gas Cylinder', description: 'Large 12kg LPG cylinder', price: 150000, stock: 30, weight: 12, size: '12kg', type: 'cylinder' as const },
    { name: 'Gas Regulator', description: 'High-quality gas regulator', price: 25000, stock: 100, type: 'accessory' as const },
    { name: 'Gas Hose (2m)', description: 'Reinforced gas hose', price: 15000, stock: 80, type: 'accessory' as const },
  ];

  for (const p of products) {
    const product = productRepo.create({ ...p, stationId: station.id });
    await productRepo.save(product);
  }

  console.log('✅ Seed data created successfully!');
  console.log('Admin: admin@gasmobil.com / Admin@123');
  console.log('Agent: agent@gasmobil.com / Agent@123');
  console.log('Driver: driver@gasmobil.com / Driver@123');
};

// Run if called directly
if (require.main === module) {
  AppDataSource.initialize()
    .then(() => seedData())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed error:', error);
      process.exit(1);
    });
}