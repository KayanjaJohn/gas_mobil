# Gas Mobil - Full Stack Gas Cylinder Delivery App

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue)](https://reactnative.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-brightgreen)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 🎯 Project Overview

A production-ready, full-stack gas cylinder delivery platform built with **React Native (Expo)**, **Node.js/Express**, and **MongoDB**. This comprehensive solution includes a mobile app for customers, backend API for server operations, and admin dashboard capabilities.

### ✨ Key Features

#### 📱 Mobile App (React Native + Expo)
- User authentication and profile management
- Browse and order gas cylinders
- Real-time delivery tracking with GPS
- In-app wallet and payment integration (Stripe)
- Order history and status tracking
- Accessories marketplace
- Partner station locator with maps
- Green impact tracking
- Push notifications
- Multi-language support ready

#### 🔙 Backend API (Node.js + Express)
- RESTful API with JWT authentication
- Complete user management system
- Order and delivery management
- Real-time tracking updates
- Payment processing with Stripe
- Wallet system
- Admin dashboard API
- MongoDB data persistence
- Production-grade error handling

#### 🏢 Database (MongoDB)
- User schemas with authentication
- Cylinder and accessory catalogs
- Order management
- Delivery tracking
- Wallet and transaction history
- Indexes for performance optimization

## 🏗️ Architecture

```
gas-mobil/
├── apps/
│   ├── mobile/                 # React Native/Expo app
│   │   ├── app/               # Expo Router navigation
│   │   └── src/
│   │       ├── components/    # Reusable components
│   │       ├── screens/       # App screens
│   │       ├── services/      # API services
│   │       ├── store/         # State management (Zustand)
│   │       ├── types/         # TypeScript definitions
│   │       └── utils/         # Utilities
│   └── api/                    # Node.js/Express backend
│       └── src/
│           ├── controllers/   # Request handlers
│           ├── models/        # MongoDB schemas
│           ├── routes/        # API endpoints
│           ├── middleware/    # Custom middleware
│           ├── services/      # Business logic
│           └── utils/         # Utilities
├── packages/
│   └── shared/                 # Shared types and utilities
├── docker-compose.yml          # Docker orchestration
├── package.json                # Monorepo setup
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- MongoDB 5.0 or higher
- Docker & Docker Compose (optional)
- Expo CLI: `npm install -g expo-cli`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kadgtgt/gas-mobil.git
   cd gas-mobil
   ```

2. **Run setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure environment variables**
   ```bash
   # Backend configuration
   nano apps/api/.env
   
   # Mobile configuration
   nano apps/mobile/.env
   ```

4. **Update required variables**
   - MongoDB connection string
   - JWT secret key
   - Stripe API keys
   - Email SMTP settings
   - Cloudinary credentials (optional)

### Development

**Start all services:**
```bash
npm run dev
```

**Start services separately:**

**Backend (Terminal 1):**
```bash
cd apps/api
npm run dev
# API runs on http://localhost:5000
```

**Mobile (Terminal 2):**
```bash
cd apps/mobile
npm start
# Press 'a' for Android, 'i' for iOS, or 'w' for web
```

### Using Docker

```bash
chmod +x docker-start.sh
./docker-start.sh
```

This starts:
- MongoDB on port 27017
- API on port 5000
- Redis on port 6379

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
GET    /api/auth/verify        - Verify token (requires auth)
```

### Cylinder Endpoints
```
GET    /api/cylinders          - Get all cylinders
GET    /api/cylinders/:id      - Get cylinder details
```

### Order Endpoints
```
POST   /api/orders             - Create order (requires auth)
GET    /api/orders             - Get user orders (requires auth)
GET    /api/orders/:id         - Get order details (requires auth)
POST   /api/orders/:id/cancel  - Cancel order (requires auth)
```

### Delivery Tracking
```
GET    /api/delivery/:orderId        - Get delivery info
PUT    /api/delivery/:id/location    - Update delivery location
```

### Wallet Endpoints
```
GET    /api/wallet              - Get wallet (requires auth)
POST   /api/wallet/add-money    - Add money to wallet (requires auth)
```

### Accessories Endpoints
```
GET    /api/accessories         - Get all accessories
GET    /api/accessories/:id     - Get accessory details
```

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ MongoDB injection prevention
- ✅ Secure environment variables
- ✅ Rate limiting ready
- ✅ HTTPS support

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
cd apps/api && npm test
cd apps/mobile && npm test

# Run with coverage
npm test -- --coverage
```

## 📦 Build & Deploy

### Mobile Build

**iOS:**
```bash
cd apps/mobile
npm run build:ios
npm run submit:ios
```

**Android:**
```bash
cd apps/mobile
npm run build:android
npm run submit:android
```

### Backend Build

```bash
cd apps/api
npm run build
npm start
```

### Docker Build

```bash
docker build -t gas-mobil-api ./apps/api
docker run -p 5000:5000 --env-file .env gas-mobil-api
```

## 🛠️ Technologies

### Frontend
- React Native 0.74
- Expo 51
- TypeScript
- Zustand (state management)
- Axios (HTTP client)
- Formik & Yup (forms & validation)
- React Navigation
- Expo Router
- Linear Gradient
- React Native Maps

### Backend
- Node.js 20
- Express 4.18
- TypeScript
- MongoDB 8.0
- Mongoose ODM
- JWT (jsonwebtoken)
- bcryptjs (password hashing)
- Stripe SDK
- Helmet (security)
- CORS
- Multer (file uploads)

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI/CD ready)
- npm workspaces

## 📖 Documentation

- [API Documentation](./docs/API.md)
- [Mobile App Guide](./apps/mobile/README.md)
- [Backend Setup Guide](./apps/api/README.md)
- [Database Schema](./docs/SCHEMA.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🔄 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gas-mobil
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📊 Project Statistics

- **Lines of Code**: 3000+
- **Components**: 15+
- **API Endpoints**: 20+
- **Database Models**: 6
- **TypeScript Coverage**: 100%

## 🎯 Roadmap

- [x] User authentication
- [x] Order management
- [x] Real-time tracking
- [x] Wallet system
- [x] Stripe integration
- [ ] Admin dashboard
- [ ] Analytics
- [ ] AI-powered optimization
- [ ] Machine learning for demand prediction
- [ ] IoT integration
- [ ] Voice ordering
- [ ] Multi-language support
- [ ] Subscription plans

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙋 Support

- 📧 Email: support@gasmobil.com
- 🐛 Issues: [GitHub Issues](https://github.com/Kadgtgt/gas-mobil/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Kadgtgt/gas-mobil/discussions)

## 👨‍💻 Authors

- **Kintu Devis** - [@Kadgtgt](https://github.com/Kadgtgt)

## 🙏 Acknowledgments

- React Native and Expo communities
- MongoDB documentation
- Express.js team
- Stripe for payment processing

---

**Built with ❤️ for seamless gas delivery services**

⭐ If you find this project helpful, please give it a star!
