# 🚀 GasMobil Setup Guide - Monday Launch Ready!

## Quick Start Checklist

✅ **Backend Setup**
```bash
cd apps/api
cp .env.example .env
# Edit .env with your actual values (see below)
npm install
npm run dev
```

✅ **Mobile App Setup**
```bash
cd apps/mobile
cp .env.example .env
# IMPORTANT: Change EXPO_PUBLIC_API_URL to your machine IP
# Find your IP: ipconfig getifaddr en0 (Mac) or ipconfig (Windows)
npm install
npm start
```

✅ **Admin Dashboard Setup**
```bash
cd apps/admin-dashboard
cp .env.example .env.local
npm install
npm run dev  # Runs on http://localhost:3000
```

✅ **Agent App Setup**
```bash
cd apps/agent-app
cp .env.example .env.local
npm install
npm run dev  # Runs on http://localhost:3001
```

---

## 🔧 Environment Variables Guide

### CRITICAL: Your Machine IP Address

**Why?** The mobile app needs to reach your backend API from a physical device or emulator.

#### Find Your IP:
- **Mac**: `ifconfig getifaddr en0`
- **Windows**: `ipconfig` → Look for IPv4 Address
- **Linux**: `hostname -I`

#### Example:
```bash
# If your machine IP is 192.168.1.50
# Update EXPO_PUBLIC_API_URL in apps/mobile/.env to:
EXPO_PUBLIC_API_URL=http://192.168.1.50:5000/api
```

---

### Backend (.env)

```env
# ✅ MUST CHANGE
DB_PASSWORD=your_mysql_password
JWT_SECRET=generate-strong-random-key-min-32-chars
REFRESH_SECRET=generate-another-random-key-min-32-chars

# Generate secrets with:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Optional (for payments)
STRIPE_SECRET_KEY=sk_test_...
MTN_MOMO_API_KEY=...
AIRTEL_MONEY_CLIENT_SECRET=...
```

### Mobile (.env)

```env
# ✅ CRITICAL: Change to your machine IP
EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:5000/api

# Optional (for maps & payments)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Admin & Agent (.env.local)

```env
# Development
VITE_API_URL=http://localhost:5000/api

# Production (after launch)
# VITE_API_URL=https://api.gasmobil.ug/api
```

---

## 🧪 Testing Login

### Backend (API)
```bash
cd apps/api
npm run dev
# Runs on http://localhost:5000
# Check health: curl http://localhost:5000/health
```

### Mobile App
1. Change IP in `.env`
2. Run: `npm start`
3. Scan QR with Expo Go
4. Test login with any email/password
5. Check logs for Network Error messages

### Admin Dashboard
1. Run: `npm run dev`
2. Visit: http://localhost:3000
3. Login with admin account
4. Check Console for "invalid token" messages

---

## 🐛 Common Issues & Fixes

### ❌ "Login failed Network Error"
**Cause**: Mobile app can't reach API
**Fix**:
1. Verify your machine IP is correct: `ping 192.168.1.x`
2. Check API is running: `curl http://192.168.1.x:5000/health`
3. Update `.env` EXPO_PUBLIC_API_URL
4. Clear Expo cache: `npm start --clear`

### ❌ "Invalid token" on Admin Dashboard
**Cause**: Token verification endpoint failing
**Fix**:
1. Check backend logs for auth errors
2. Verify JWT_SECRET is set in `.env`
3. Clear browser localStorage: DevTools → Application → Clear
4. Login again

### ❌ CORS Errors
**Cause**: Frontend origin not allowed
**Fix**: In `apps/api/.env`, add your frontend URLs to CORS
```env
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000
AGENT_URL=http://localhost:3001
```

### ❌ Database Connection Failed
**Cause**: MySQL not running or wrong credentials
**Fix**:
```bash
# Start MySQL
mysql -u root -p
# Create database
CREATE DATABASE gas_mobil_dev;
# Update .env with correct password
```

---

## 🎨 Icons Setup (Premium)

We've added **react-icons** (4,000+ free premium icons):

```tsx
import { FaGasCylinder, MdDeliveryDining, AiOutlineTeam } from 'react-icons/all';

// Use in components
<FaGasCylinder /> // Gas cylinder icon
<MdDeliveryDining /> // Delivery icon
<AiOutlineTeam /> // Team/users icon
```

Alternatives:
- **Heroicons**: `@heroicons/react` (premium-looking)
- **Tabler Icons**: `tabler-icons-react` (clean, modern)

---

## ✅ Monday Launch Checklist

- [ ] Backend running on port 5000
- [ ] Mobile app `.env` has correct machine IP
- [ ] Admin dashboard can login & verify token
- [ ] Agent app can login
- [ ] All database tables migrated
- [ ] Test order creation flow
- [ ] Test payment endpoints
- [ ] Check all console logs clear
- [ ] Icons displaying correctly
- [ ] API responses consistent (always wrapped in `{ data, success }`)

---

## 📞 Quick Debug

```bash
# Test API is running
curl http://localhost:5000/health

# Check mobile can reach API
curl http://192.168.1.x:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"test@test.com","password":"test1234"}'

# View admin dashboard logs
open http://localhost:3000
Press F12 → Console tab
```

---

## 🚀 Go Live!

Once everything works locally:

1. Deploy API to production server
2. Update `.env.local` in admin/agent apps to production URL
3. Build mobile app: `expo prebuild && eas build`
4. Launch on Monday! 🎉
