# Gas Mobil — Full Stack Gas Cylinder Delivery Platform

> **Smart gas cylinder delivery in Uganda. Order, track, and refill in 2 hours.**

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Gas Mobil is a complete full-stack solution for gas cylinder delivery services. It connects customers, partner stations (agents), and drivers through a unified platform with real-time order tracking, mobile money payments, and a green impact tracker.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Auth** | JWT-based auth with refresh tokens, role-based access (customer, driver, agent, admin) |
| 📦 **Orders** | Swap refill or buy new cylinder kits with size selection (6kg, 12kg, 45kg) |
| 🗺️ **Tracking** | Real-time GPS delivery tracking with driver location updates |
| 💳 **Payments** | Gasmobil Wallet, Mobile Money (M-Pesa / Airtel), Cash on Delivery |
| 🏪 **Stations** | Partner station locator with nearest-station auto-assignment |
| 🔧 **Accessories** | Burners, grills, regulators, hosepipes marketplace |
| 🌱 **Green Impact** | CO₂ savings tracker, cylinder recycling stats |
| 📱 **PWA** | Installable web app with offline support and service worker |

---

## Architecture

```
gas-mobil/
├── apps/
│   ├── mobile/           # React Native (Expo) app — customer & driver
│   │   ├── app/          # Expo Router file-based routing
│   │   ├── src/
│   │   │   ├── screens/      # Screen components
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── services/     # API layer (axios + interceptors)
│   │   │   ├── store/        # Zustand state management
│   │   │   ├── context/      # React Context (Auth, etc.)
│   │   │   ├── types/        # TypeScript types
│   │   │   └── utils/        # Helpers, validators
│   │   └── assets/
│   ├── api/              # Node.js + Express + TypeORM backend
│   │   ├── src/
│   │   │   ├── config/       # Database, env config
│   │   │   ├── controllers/  # Route handlers
│   │   │   ├── entities/     # TypeORM entities (MySQL)
│   │   │   ├── middleware/   # Auth, roles, error handling
│   │   │   ├── routes/       # API route definitions
│   │   │   ├── services/     # Business logic
│   │   │   └── types/        # Shared TypeScript types
│   │   └── migrations/
│   └── web/              # (Optional) Next.js marketing site
├── packages/
│   └── shared/           # Shared types, utilities, constants
└── package.json          # Root workspace config
```

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime |
| Express | 4.18 | HTTP server |
| TypeORM | 0.3.x | ORM for MySQL |
| MySQL | 8.0 | Primary database |
| JWT | 9.x | Authentication |
| bcryptjs | 2.4 | Password hashing |
| Socket.IO | 4.8 | Real-time driver tracking |
| Stripe | 14.x | Card payments |
| Winston | 3.x | Logging |
| Zod | 4.x | Input validation |

### Mobile

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81 | UI framework |
| Expo | 54 | Development platform |
| Expo Router | 6.x | File-based routing |
| Zustand | 4.x | State management |
| Axios | 1.6 | HTTP client |
| Socket.IO Client | 4.8 | Real-time updates |
| React Native Maps | 1.18 | Map integration |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (use [nvm](https://github.com/nvm-sh/nvm))
- **MySQL** 8.0+ running locally or via Docker
- **npm** 9+ or **yarn**
- **Expo CLI** (for mobile): `npm install -g @expo/cli`

### 1. Clone & Install

```bash
git clone https://github.com/KayanjaJohn/gas_mobil.git
cd gas_mobil
npm install
```

### 2. Environment Setup

#### Backend (`apps/api/.env`)

```bash
cp apps/api/.env.example apps/api/.env
```

```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_NAME=gas_mobil

# Security (generate strong secrets)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_SECRET=your-refresh-secret-key-min-32-chars
REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Mobile (`apps/mobile/.env`)

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

```env
# Use your machine's local IP for physical device testing
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

> ⚠️ **Never commit `.env` files.** They are already in `.gitignore`.

### 3. Database Setup

```bash
cd apps/api
npm run migration:run    # Run existing migrations
npm run seed             # Seed demo data (optional)
```

> **Production:** Always use migrations. Never use `synchronize: true`.

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd apps/api
npm run dev              # http://localhost:5000

# Terminal 2 — Mobile
cd apps/mobile
npx expo start           # Scan QR with Expo Go app
```

---

## Project Structure

### Backend Routes

| Route | Auth | Description |
|-------|------|-------------|
| `POST /api/auth/register` | Public | Register new user |
| `POST /api/auth/login` | Public | User login |
| `POST /api/auth/refresh` | Public | Refresh access token |
| `GET /api/auth/verify` | Bearer | Verify token & get user |
| `GET /api/auth/me` | Bearer | Get current user profile |
| `PUT /api/auth/profile` | Bearer | Update profile |
| `PUT /api/auth/change-password` | Bearer | Change password |
| `GET /api/products` | Bearer | List products |
| `POST /api/orders` | Customer | Create order |
| `GET /api/orders` | Any role | List orders (role-filtered) |
| `GET /api/orders/:id` | Any role | Get single order |
| `POST /api/orders/:id/cancel` | Customer | Cancel order |
| `PUT /api/orders/:id/status` | Agent/Admin | Update order status |
| `GET /api/driver/orders` | Driver | Get assigned deliveries |
| `PUT /api/driver/status` | Driver | Update status & GPS |
| `GET /api/stations` | Public | List partner stations |

### Mobile Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Landing | `/` | Splash / onboarding |
| Login | `/login` | Sign in |
| Register | `/register` | Create account |
| Home | `/(tabs)` | Dashboard, cylinder status, quick actions |
| Order | `/order` | Multi-step order flow |
| Tracking | `/tracking` | Live delivery tracking |
| Cart | `/cart` | Accessories cart |
| Stations | `/stations` | Partner station finder |
| Green | `/green` | Eco impact dashboard |
| Profile | `/profile` | Account, wallet, settings |

---

## API Documentation

### Authentication

All protected endpoints require:

```http
Authorization: Bearer <access_token>
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error response:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

## Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Server port |
| `DB_HOST` | Yes | MySQL host |
| `DB_PORT` | Yes | MySQL port |
| `DB_USERNAME` | Yes | MySQL user |
| `DB_PASSWORD` | Yes | MySQL password |
| `DB_NAME` | Yes | Database name |
| `JWT_SECRET` | Yes | Min 32 chars, no fallback |
| `JWT_EXPIRES_IN` | No | Default: `15m` |
| `REFRESH_SECRET` | Yes | Min 32 chars |
| `REFRESH_EXPIRES_IN` | No | Default: `7d` |
| `STRIPE_SECRET_KEY` | Yes (prod) | Stripe secret key |
| `SMTP_HOST` | No | Email server |

### Mobile

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API base URL |

---

## Deployment

### Backend (Production Checklist)

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique `JWT_SECRET` and `REFRESH_SECRET`
- [ ] Disable `synchronize` — use migrations only
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure CORS for your domain only
- [ ] Set up PM2 or Docker for process management
- [ ] Configure Winston logging to file/cloud
- [ ] Set up database backups

### Mobile (App Stores)

```bash
cd apps/mobile

# iOS
npx expo prebuild --platform ios
cd ios && pod install && cd ..
npx expo run:ios --configuration Release

# Android
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

### PWA (Web)

The HTML prototype in `apps/web/` is a fully functional PWA with:
- Service worker for offline caching
- Install prompt for iOS/Android
- Web app manifest

Deploy to Vercel, Netlify, or any static host.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit with clear messages: `git commit -m "feat: add driver ETA calculation"`
4. Push and open a Pull Request

### Commit Convention

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `refactor:` | Code restructuring |
| `security:` | Security improvements |

---

## Security

- ✅ JWT authentication with refresh token rotation
- ✅ Password hashing with bcryptjs (salt rounds: 12)
- ✅ Role-based access control (RBAC)
- ✅ Input validation with Zod
- ✅ Rate limiting on auth endpoints
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ SQL injection prevention (TypeORM parameterized queries)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ in Kampala, Uganda<br>
  <strong>Gasmobil</strong> — powered by <em>Lambula Creative Agency</em>
</p>
