# Gas Mobil - Full Stack Delivery App

**Transform your gas cylinder delivery service with a modern, production-ready mobile and web platform.**

## 🎯 Project Overview

Gas Mobil is a complete solution for gas cylinder delivery services featuring:

### 📱 Mobile App (React Native + Expo)
- User authentication (phone & email)
- Browse and order gas cylinders
- Real-time delivery tracking with GPS
- Order history and status updates
- In-app wallet & payments (Stripe integration)
- Accessories marketplace
- Partner station locator with maps
- Green impact tracking (CO2 savings)
- Push notifications for order updates

### 🔌 Backend API (Node.js + Express + MongoDB)
- RESTful API with full authentication
- User management (customers, drivers, admins)
- Order management system
- Real-time delivery tracking
- Payment processing (Stripe)
- Admin dashboard API
- Database with MYSQL
- JWT-based security

## 📊 Architecture

```
gas-mobil/
├── apps/
│   ├── mobile/           # React Native (Expo) app
│   │   ├── src/
│   │   │   ├── screens/  # App screens
│   │   │   ├── components/
│   │   │   ├── services/ # API services
│   │   │   ├── store/    # State management (Zustand)
│   │   │   ├── types/    # TypeScript types
│   │   │   └── utils/
│   │   └── app/          # Expo Router navigation
│   └── api/              # Node.js/Express API
│       ├── src/
│       │   ├── models/   # MongoDB schemas
│       │   ├── controllers/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── services/
│       │   └── types/
│       └── dist/         # Compiled JavaScript
├── packages/             # Shared utilities
└── package.json          # Monorepo setup
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gas-mobil.git
   cd gas-mobil
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Backend API
   cp apps/api/.env.example apps/api/.env
   
   # Mobile app
   cp apps/mobile/.env.example apps/mobile/.env
   ```

4. **Update .env files with your credentials**
   - MongoDB URI
   - JWT Secret
   - Stripe keys
   - Email SMTP settings

### Development

**Start both frontend and backend:**
```bash
npm run dev
```

**Or run separately:**

**Backend (Terminal 1):**
```bash
cd apps/api
npm run dev
# Runs on http://localhost:5000
```

**Mobile (Terminal 2):**
```bash
cd apps/mobile
npm start
# Press 'a' for Android, 'i' for iOS, or 'w' for web
```

### Building

**Mobile:**
```bash
# Build for iOS
npm run build:ios

# Build for Android
npm run build:android

# Submit to stores
npm run submit:ios
npm run submit:android
```

**Backend:**
```bash
cd apps/api
npm run build
npm start
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token (requires auth)

### Cylinders
- `GET /api/cylinders` - Get all available cylinders
- `GET /api/cylinders/:id` - Get cylinder details

### Orders
- `POST /api/orders` - Create new order (requires auth)
- `GET /api/orders` - Get user orders (requires auth)
- `GET /api/orders/:id` - Get order details (requires auth)
- `POST /api/orders/:id/cancel` - Cancel order (requires auth)

### Delivery Tracking
- `GET /api/delivery/:orderId` - Get delivery tracking info
- `PUT /api/delivery/:id/location` - Update delivery location

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Password hashing with bcryptjs
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation with express-validator
- ✅ MongoDB injection prevention
- ✅ Secure environment variables

## 💳 Payment Integration

- Stripe for card payments
- In-app wallet system
- Cash on delivery option
- Transaction history

## 📍 Real-time Features

- Live delivery tracking with GPS
- Order status updates
- Push notifications
- Driver location updates
- Route optimization

## 🧪 Testing

```bash
# Run tests
npm test

# Run specific test suite
cd apps/api && npm test
cd apps/mobile && npm test
```

## 📦 Technologies Used

### Frontend
- React Native 0.74
- Expo 51
- TypeScript
- Zustand (state management)
- Axios (HTTP client)
- Formik & Yup (forms & validation)
- React Navigation
- Expo Router

### Backend
- Node.js
- Express 4.18
- MongoDB 8.0
- Mongoose ODM
- JWT authentication
- TypeScript
- Stripe SDK

## 📄 Project Structure

```
gas-mobil/
├── README.md
├── package.json
├── tsconfig.json
├── apps/
│   ├── mobile/
│   │   ├── app.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── app/
│   └── api/
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── controllers/
│       │   ├── models/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── services/
│       │   └── types/
│       └── dist/
└── packages/
    └── shared/
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- Developed with ❤️ by Gas Mobil Team

## 📞 Support

For support, email support@gasmobil.com or open an issue on GitHub.

## 🎉 Features Roadmap

- [x] User authentication
- [x] Order management
- [x] Real-time tracking
- [ ] AI-powered delivery optimization
- [ ] Subscription plans
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Machine learning for demand prediction
- [ ] Voice ordering
- [ ] IoT integration for cylinder monitoring

---

**Built with ❤️ for seamless gas delivery**
