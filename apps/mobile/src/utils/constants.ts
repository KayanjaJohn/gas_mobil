import { Product } from '../types';

export const COLORS = {
  bg: '#070b14',
  card: '#101827',
  card2: '#0e1521',
  border: '#1F2A3D',
  accent: '#1484FF',
  accent2: '#3DA5FF',
  accentGlow: 'rgba(20,132,255,.45)',
  text: '#E6EAF2',
  muted: '#8A93A6',
  muted2: '#C4C4CDA3',
  danger: '#ff4d4d',
  success: '#22c55e',
  warn: '#f59e0b',
  green: '#34d399',
} as const;

export const SIZES = {
  padding: 16,
  radius: 14,
  radiusLg: 18,
  radiusPill: 999,
} as const;

export const PRICES = {
  swap: { '6kg': 50000, '12kg': 100000, '45kg': 250000 },
  buy: { '6kg': 157000, '12kg': 270000, '45kg': 525000 },
} as const;

export const ACCESSORIES: Product[] = [
  { id: '1', name: 'Single Gas Burner', description: 'Stainless steel single burner stove for everyday cooking', price: 35000, stock: 50, type: 'burner', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Double Gas Burner', description: 'Heavy-duty double burner stove for large households', price: 65000, stock: 30, type: 'burner', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Commercial Gas Burner', description: 'Industrial-grade burner for restaurants and hotels', price: 180000, stock: 15, type: 'burner', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'Portable Gas Grill', description: 'Compact outdoor gas grill for barbecue and grilling', price: 120000, stock: 20, type: 'grill', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: 'Tabletop Gas Grill', description: 'Small tabletop grill perfect for balconies', price: 85000, stock: 25, type: 'grill', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '6', name: 'Standard Gas Regulator', description: 'Brass pressure regulator for setups', price: 25000, stock: 100, type: 'regulator', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '7', name: 'Low-Pressure Regulator', description: 'Precision low-pressure regulator', price: 35000, stock: 40, type: 'regulator', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '8', name: 'Commercial Regulator', description: 'Heavy-duty regulator for 45kg cylinders', price: 55000, stock: 20, type: 'regulator', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '9', name: 'Gas Hosepipe 1.5m', description: 'High-quality Cylinder rubber hose 1.5m length', price: 15000, stock: 200, type: 'hose', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '10', name: 'Gas Hosepipe 2m', description: 'Premium Cylinder rubber hose 2m length with clamps', price: 20000, stock: 150, type: 'hose', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
];

export const STATIONS = [
  { id: '1', name: 'Shell Kampala Road', address: 'Kampala Road', city: 'Kampala', region: 'Central', latitude: 0.3136, longitude: 32.5811, isActive: true, phone: '+256 785 796 333', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Shell Entebbe Road', address: 'Entebbe Road', city: 'Kampala', region: 'Central', latitude: 0.2922, longitude: 32.5533, isActive: true, phone: '+256 785 796 333', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Total Jinja Main', address: 'Main Street', city: 'Jinja', region: 'Eastern', latitude: 0.4244, longitude: 33.2042, isActive: true, phone: '+256 785 796 333', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'Shell Mbarara', address: 'Mbarara High Street', city: 'Mbarara', region: 'Western', latitude: -0.6072, longitude: 30.6547, isActive: false, phone: '+256 785 796 333', createdAt: new Date(), updatedAt: new Date() },
];