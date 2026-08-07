# 🔥 GasMobil Uganda

> **On-demand gas cylinder delivery platform** — connecting customers, stations, drivers, agents, and admins in real-time.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.73+-purple.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.0+-black.svg)](https://socket.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1.svg)](https://www.mysql.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Apps](#running-the-apps)
- [API Documentation](#api-documentation)
- [Real-Time Features](#real-time-features)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

GasMobil is a full-stack gas delivery platform with **5 integrated applications**:

| App | Role | Platform |
|-----|------|----------|
| **API** | Backend server, database, real-time engine | Node.js + Express |
| **Mobile** | Customer app — order gas, track delivery, manage wallet | React Native (Expo) |
| **Driver App** | Driver app — accept orders, update location, mark deliveries | React Native (Expo) |
| **Admin Dashboard** | Admin panel — manage stations, drivers, products, reports | React + Vite |
| **Agent App** | Station agent — manage station inventory, orders, drivers | React + Vite |

### Key Features

- 🛒 **Order Management** — Swap refill or buy new cylinders with GPS-enforced delivery
- 📍 **Real-Time Tracking** — Live driver location via Socket.IO with map integration
- 🔔 **Multi-Role Notifications** — Push + socket notifications for customers, drivers, agents, and admins
- 💰 **Wallet & Payments** — Mobile Money, Airtel Money, card, cash on delivery
- 🏪 **Station Network** — Multi-station inventory with nearest-station auto-assignment
- 📊 **Admin Analytics** — Orders, earnings, driver performance, station reports
- 🔐 **JWT Authentication** — Secure role-based access (customer, driver, agent, admin)

---

## 🏗️ System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Mobile App     │     │  Driver App     │     │  Admin Dashboard│
│  (Customer)     │     │  (Driver)       │     │  (Web)          │
│  React Native   │     │  React Native   │     │  React + Vite   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  HTTP / WebSocket     │  HTTP / WebSocket     │  HTTP / WebSocket
         └───────────┬───────────┴───────────┬───────────┘
                     │                       │
         ┌───────────▼───────────────────────▼───────────┐
         │           API Server (Node.js)                │
         │  ┌───────────────────────────────────────┐   │
         │  │  Express + TypeORM + Socket.IO        │   │
         │  │  JWT Auth + Rate Limiting + Helmet    │   │
         │  └───────────────────────────────────────┘   │
         └───────────┬───────────────────────┬───────────┘
                     │                       │
         ┌───────────▼──────────┐  ┌────────▼────────┐
         │   MySQL Database     │  │  File Uploads   │
         │   (TypeORM Entities) │  │  /uploads/products│
         └──────────────────────┘  └─────────────────┘
```

---

## 🛠️ Tech Stack

### Backend (`apps/api`)
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Language | TypeScript |
| ORM | TypeORM |
| Database | MySQL 8.0+ |
| Real-Time | Socket.IO |
| Auth | JWT (access + refresh tokens) |
| Uploads | Multer (disk storage) |
| Security | Helmet, CORS, express-rate-limit |
| Validation | Manual + TypeORM decorators |

### Mobile (`apps/mobile`)
| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 50+) |
| Navigation | Expo Router |
| State | Zustand |
| HTTP | Custom fetch wrapper |
| Maps | react-native-maps |
| Location | expo-location |
| Storage | AsyncStorage |
| UI | Custom components (no external UI lib) |

### Driver App (`apps/driver-app`)
| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 50+) |
| Navigation | React Navigation (Stack) |
| State | Context API + AsyncStorage |
| HTTP | Axios |
| Location | expo-location (background + foreground) |
| Maps | react-native-maps |

### Admin Dashboard (`apps/admin-dashboard`)
| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Bundler | Vite |
| UI | Material-UI (MUI) v5 |
| Charts | Recharts |
| HTTP | Axios |
| Router | React Router v6 |
| Theme | Light/Dark mode toggle |

### Agent App (`apps/agent-app`)
| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Bundler | Vite |
| UI | Material-UI (MUI) v5 |
| HTTP | Axios |
| Router | React Router v6 |
| Theme | Light/Dark mode toggle |

---

## 📁 Project Structure

```
gas_mobil/
├── apps/
│   ├── api/                          # Backend API
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.ts       # TypeORM data source
│   │   │   │   └── socket.ts         # Socket.IO initialization
│   │   │   ├── controllers/          # Route handlers
│   │   │   │   ├── authController.ts
│   │   │   │   ├── orderController.ts
│   │   │   │   ├── productController.ts
│   │   │   │   ├── deliveryController.ts
│   │   │   │   ├── driverController.ts
│   │   │   │   ├── notificationController.ts
│   │   │   │   ├── uploadController.ts
│   │   │   │   └── ...
│   │   │   ├── entities/             # TypeORM entities
│   │   │   │   ├── User.ts
│   │   │   │   ├── Order.ts
│   │   │   │   ├── Product.ts
│   │   │   │   ├── Delivery.ts
│   │   │   │   ├── Station.ts
│   │   │   │   ├── Notification.ts
│   │   │   │   └── ...
│   │   │   ├── middleware/           # Auth, error handling, role guards
│   │   │   ├── routes/               # Express routers
│   │   │   ├── services/             # Business logic (notifications, delivery)
│   │   │   ├── utils/                # Helpers (geoLocation, formatters)
│   │   │   └── server.ts             # Entry point
│   │   ├── uploads/products/         # Uploaded product images
│   │   └── .env                      # Backend env vars
│   │
│   ├── mobile/                       # Customer mobile app
│   │   ├── app/                      # Expo Router pages
│   │   │   ├── (tabs)/               # Tab screens
│   │   │   │   ├── index.tsx         # Home
│   │   │   │   ├── notifications.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── order.tsx
│   │   │   ├── tracking.tsx
│   │   │   ├── accessories.tsx
│   │   │   └── stations.tsx
│   │   ├── src/
│   │   │   ├── components/           # Reusable UI
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── services/             # API + socket
│   │   │   ├── store/                # Zustand stores
│   │   │   └── utils/                # Constants, formatters
│   │   └── App.tsx
│   │
│   ├── driver-app/                   # Driver mobile app
│   │   ├── src/
│   │   │   ├── screens/              # Screen components
│   │   │   ├── components/           # NotificationBanner, etc.
│   │   │   ├── hooks/                # useDriverLocation, etc.
│   │   │   ├── services/             # API + socket
│   │   │   └── context/              # AuthContext
│   │   └── App.tsx
│   │
│   ├── admin-dashboard/              # Admin web dashboard
│   │   ├── src/
│   │   │   ├── pages/                # Page components
│   │   │   ├── components/           # Layout, NotificationBell, etc.
│   │   │   ├── hooks/                # useAdminNotifications, etc.
│   │   │   ├── context/              # AuthContext
│   │   │   └── theme.ts              # Light/Dark theme
│   │   └── App.tsx
│   │
│   └── agent-app/                    # Agent web dashboard
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── context/
│       └── App.tsx
│
├── package.json                      # Root workspace config
└── README.md                         # This file
```

---

## ⚙️ Prerequisites

- **Node.js** `>= 20.0.0`
- **npm** `>= 10.0.0` (or pnpm/yarn)
- **MySQL** `>= 8.0`
- **Expo CLI** (for mobile apps): `npm install -g @expo/cli`
- **Expo Go** app on your phone (for testing)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/KayanjaJohn/gas_mobil.git
cd gas_mobil

# Install all dependencies
npm install

# Or install per app
cd apps/api && npm install
cd apps/mobile && npm install
cd apps/driver-app && npm install
cd apps/admin-dashboard && npm install
cd apps/agent-app && npm install
```

### 2. Environment Setup

Copy and configure environment variables for each app:

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Mobile
cp apps/mobile/.env.example apps/mobile/.env

# Driver
cp apps/driver-app/.env.example apps/driver-app/.env

# Admin
cp apps/admin-dashboard/.env.example apps/admin-dashboard/.env

# Agent
cp apps/agent-app/.env.example apps/agent-app/.env
```

See [Environment Variables](#environment-variables) for required values.

### 3. Database Setup

```bash
cd apps/api

# 1. Create MySQL database
mysql -u root -p -e "CREATE DATABASE gasmobil CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Generate JWT secrets
node scripts/generate-secrets.js

# 3. Run migrations (TypeORM auto-syncs in dev)
npm run dev
```

### 4. Seed Data (Optional)

```bash
# Run from apps/api directory
node scripts/seed-catalog.js    # Seed product catalog templates
node scripts/seed-stations.js   # Seed stations
node scripts/seed-admin.js      # Create default admin user
```

### 5. Start All Apps

**Terminal 1 — Backend:**
```bash
cd apps/api
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Mobile (Customer):**
```bash
cd apps/mobile
npx expo start
# Scan QR code with Expo Go app
```

**Terminal 3 — Driver App:**
```bash
cd apps/driver-app
npx expo start --port 19001
# Scan QR code with Expo Go app
```

**Terminal 4 — Admin Dashboard:**
```bash
cd apps/admin-dashboard
npm run dev
# Opens on http://localhost:5173
```

**Terminal 5 — Agent App:**
```bash
cd apps/agent-app
npm run dev
# Opens on http://localhost:5174
```

---

## 🔐 Environment Variables

### Backend (`apps/api/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_NAME=gasmobil

# JWT (generate with scripts/generate-secrets.js)
JWT_SECRET=your_jwt_secret_here
REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d

# Public API URL (for image uploads, must be publicly accessible)
API_PUBLIC_URL=http://localhost:5000

# CORS (production)
ALLOWED_ORIGINS=https://gasmobil.ug,https://app.gasmobil.ug

# Payment (integrate with your provider)
MOMO_API_KEY=your_momo_key
AIRTEL_API_KEY=your_airtel_key
```

### Mobile (`apps/mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

### Driver App (`apps/driver-app/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

### Admin Dashboard (`apps/admin-dashboard/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

### Agent App (`apps/agent-app/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🗄️ Database Setup

### Entities Overview

| Entity | Description |
|--------|-------------|
| `User` | Customers, drivers, agents, admins |
| `Station` | Gas stations with GPS coordinates |
| `Product` | Station inventory (cylinders, accessories) |
| `CatalogItem` | Product templates for quick station setup |
| `Order` | Customer orders with delivery location |
| `OrderItem` | Individual items within an order |
| `Delivery` | Driver assignment + tracking |
| `Notification` | Read/unread notifications per user |
| `Wallet` | Customer wallet balance & transactions |
| `Payment` | Payment records |

### Auto-Sync (Development)

TypeORM `synchronize: true` is enabled in development. **Disable in production** and use migrations:

```bash
cd apps/api
npx typeorm-ts-node-commonjs migration:generate -d src/config/database.ts src/migrations/InitialMigration
npx typeorm-ts-node-commonjs migration:run -d src/config/database.ts
```

---

## ▶️ Running the Apps

### Backend API

```bash
cd apps/api
npm run dev          # Development with hot reload
npm run build        # Compile TypeScript
npm start            # Production mode
npm run test         # Run tests
```

### Mobile (Customer)

```bash
cd apps/mobile
npx expo start       # Start Expo dev server
npx expo start --android   # Android emulator
npx expo start --ios       # iOS simulator (macOS only)
```

**Build for production:**
```bash
npx expo prebuild
npx expo run:android --variant release
# or
npx expo run:ios --configuration Release
```

### Driver App

```bash
cd apps/driver-app
npx expo start --port 19001
```

### Admin Dashboard

```bash
cd apps/admin-dashboard
npm run dev          # Development
npm run build        # Production build (dist/)
npm run preview      # Preview production build
```

### Agent App

```bash
cd apps/agent-app
npm run dev          # Development
npm run build        # Production build (dist/)
```

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns access + refresh tokens) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (invalidate refresh token) |
| GET | `/api/auth/me` | Get current user profile |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders` | ✅ | List user's orders |
| POST | `/api/orders` | ✅ | Create new order |
| GET | `/api/orders/:id` | ✅ | Get order details |
| PATCH | `/api/orders/:id/cancel` | ✅ | Cancel order |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | ✅ | List products (role-filtered) |
| POST | `/api/products` | ✅ Admin/Agent | Create product |
| PUT | `/api/products/:id` | ✅ Admin/Agent | Update product |
| PATCH | `/api/products/:id/availability` | ✅ Admin/Agent | Toggle availability |
| DELETE | `/api/products/:id` | ✅ Admin/Agent | Delete product |

### Driver

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/driver/orders` | ✅ Driver | Get assigned orders |
| PUT | `/api/driver/:orderId/status` | ✅ Driver | Update delivery status |
| PATCH | `/api/driver/status` | ✅ Driver | Update driver status |
| GET | `/api/driver/stats` | ✅ Driver | Get earnings stats |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | ✅ | List notifications |
| PATCH | `/api/notifications/:id/read` | ✅ | Mark as read |
| PATCH | `/api/notifications/read-all` | ✅ | Mark all as read |
| DELETE | `/api/notifications/:id` | ✅ | Delete notification |

### Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload` | ✅ | Upload product image (multipart/form-data, field: `image`) |

---

## ⚡ Real-Time Features

Socket.IO powers all real-time functionality:

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `driver_location_update` | Driver → Server | Broadcast driver GPS position |
| `location_update` | Server → Customer | Send driver location to order room |
| `order_status_changed` | Server → All | Notify on order status changes |
| `product_created` | Server → Station | New product in station |
| `product_updated` | Server → Station | Product updated |
| `notification` | Server → User | Personal notification |
| `admin_notification` | Server → Admins | Admin-scoped notification |
| `new_order` | Server → Admins/Agents | New order placed |
| `driver_status_changed` | Server → Admins | Driver online/offline/busy |

### Rooms

| Room | Members |
|------|---------|
| `user_${userId}` | Individual user |
| `station_${stationId}` | Agents at a station |
| `order_${orderId}` | Customer + driver tracking an order |
| `admins` | All admin/agent users |
| `drivers` | All drivers |
| `driver_${driverId}` | Individual driver |

---

## 🚢 Deployment

### Backend (Production)

```bash
cd apps/api
npm run build
NODE_ENV=production npm start
```

**Using PM2:**
```bash
npm install -g pm2
pm2 start dist/server.js --name gasmobil-api
pm2 save
pm2 startup
```

**Using Docker:**
```bash
docker build -t gasmobil-api ./apps/api
docker run -p 5000:5000 --env-file apps/api/.env gasmobil-api
```

### Web Apps (Admin + Agent)

Build static files and serve with Nginx:

```bash
cd apps/admin-dashboard
npm run build
# Output: dist/

# Nginx config
server {
    listen 80;
    server_name admin.gasmobil.ug;
    root /var/www/admin-dashboard/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Mobile Apps

Use **EAS Build** for production app binaries:

```bash
cd apps/mobile
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
```

---

## 🐛 Troubleshooting

### Images not showing after upload
- Check `API_PUBLIC_URL` is set correctly in backend `.env`
- Ensure `/uploads` directory is served as static: `app.use("/uploads", express.static(...))`
- Verify the uploaded file exists in `apps/api/uploads/products/`

### Socket.IO connection fails
- Ensure backend `CORS` origin includes your frontend URL
- Check JWT token is passed in `auth: { token }` or `query.token`
- Verify `transports: ['websocket']` is configured on client

### Database connection errors
- Verify MySQL is running: `mysql -u root -p`
- Check `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` in `.env`
- Ensure database `gasmobil` exists

### Mobile app can't connect to API
- Use your machine's **local IP** instead of `localhost`:
  ```env
  EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
  ```
- Ensure both phone and computer are on the same Wi-Fi network
- Disable firewall temporarily for testing

### Location services not working
- Grant location permissions in Expo Go app settings
- Enable GPS/Location on the device
- On iOS simulator: Features → Location → Custom Location

### "Module not found" errors
- Run `npm install` in the specific app directory
- Clear Metro bundler cache: `npx expo start --clear`
- Delete `node_modules` and reinstall

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `version1` | Current development branch |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

---

## 📄 License

This project is proprietary software owned by **Lambula Creative Agency** and **GasMobil Uganda**. All rights reserved.

---

## 👥 Team

- **John Kayanja** — Lead Developer
- **Lambula Creative Agency** — Design & Development

---

## 📞 Support

- 📧 Email: info@gasmobil.ug
- 📞 Phone: +256 785 796 333 / 0776 800 386
- 🌐 Website: [www.gasmobil.ug](https://www.gasmobil.ug)
- 📍 Address: Plot 12, Kampala Road, Kampala, Uganda

---

<p align="center">
  <strong>🔥 GasMobil Uganda — Gas Delivered to Your Doorstep</strong>
</p>
