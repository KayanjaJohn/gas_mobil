# 🚀 Quick Start Guide — Gas Mobil Mobile App

**Get up and running in 3 minutes. No patches. No manual fixes.**

---

## Prerequisites

- **Node.js** 18+ (check with `node --version`)
- **npm** 9+ (check with `npm --version`)
- **Expo CLI** globally installed: `npm install -g @expo/cli`

---

## Installation (3 Steps)

### Step 1: Install Dependencies

```bash
cd apps/mobile
npm install
```

**Expected output:** No errors, no warnings about unmet peer dependencies.

### Step 2: Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` based on your setup:

```env
# For iOS Simulator or Android Emulator:
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# For physical device (replace with your machine's local IP):
# Find IP: macOS/Linux: ifconfig | grep inet | grep -v 127.0.0.1
#          Windows: ipconfig | findstr IPv4
# EXPO_PUBLIC_API_URL=http://192.168.X.X:5000/api

# For production:
# EXPO_PUBLIC_API_URL=https://api.gasmobil.ug/api
```

### Step 3: Run the App

```bash
npx expo start --clear
```

**Next:**
- **iOS Simulator:** Press `i`
- **Android Emulator:** Press `a`
- **Physical Device:** Scan QR code with Expo Go app

---

## Backend Setup (Parallel)

Before running the mobile app, the backend **MUST** be running:

```bash
# Terminal 1: Backend
cd apps/api
npm install
npm run dev          # Starts on http://localhost:5000

# Terminal 2: Mobile (after backend is running)
cd apps/mobile
npx expo start
```

---

## Troubleshooting

### ❌ Error: "EXPO_PUBLIC_API_URL is not set"
**Fix:** Create `.env` file with `EXPO_PUBLIC_API_URL` set.

### ❌ Error: "Cannot connect to localhost:5000"
**Fix:** 
1. Backend not running? Start it: `cd apps/api && npm run dev`
2. Using physical device? Use your machine's local IP instead of `localhost`

### ❌ Metro bundler cache issues
**Fix:**
```bash
npx expo start --clear
```

### ❌ Module not found errors
**Fix:**
```bash
rm -rf node_modules
npm install
```

---

## What's Already Fixed (No Patches Needed)

✅ **AuthContext** — Full login/register/logout logic  
✅ **Token Refresh** — Automatic token rotation on 401  
✅ **Input Validation** — Email, phone, password checks  
✅ **Keyboard Handling** — Auto-dismiss and KeyboardAvoidingView  
✅ **UI/Design** — Matches Flame logo and gradient theme  
✅ **Auto-Login** — Auto-redirects after successful registration  
✅ **Loading States** — Activity indicators during API calls  
✅ **Error Handling** — User-friendly error messages  
✅ **Env Vars** — Enforced with clear error messages  

---

## Next: Start Development

```bash
# Terminal 1: Backend
cd apps/api
npm run dev

# Terminal 2: Mobile
cd apps/mobile
npx expo start
```

**Scan the QR code with Expo Go and you're good to go!**

---

## Need to Run Admin or Agent Dashboard?

```bash
# Terminal 3: Admin Dashboard (port 3000)
cd apps/admin-dashboard
npm install
npm run dev

# Terminal 4: Agent App (port 3001)
cd apps/agent-app
npm install
npm run dev
```

---

## Important: Environment Checklist

Before pushing to production, verify:

- [ ] Backend `.env` has real `JWT_SECRET` (min 32 chars)
- [ ] Backend `.env` has real `REFRESH_SECRET` (min 32 chars)
- [ ] Mobile `.env` has production API URL (not localhost)
- [ ] Database migrations have run: `cd apps/api && npm run migration:run`
- [ ] Test login/register flow end-to-end
- [ ] Test token refresh (server token expiration)

---

## For Customers: What Works Now

✅ **Register** with email, phone, password  
✅ **Login** with credentials  
✅ **Auto-reconnect** on app restart  
✅ **Protected routes** — redirect to login if not authenticated  
✅ **API calls** with automatic token refresh  
✅ **Error messages** — clear, user-friendly  

**Ready to deploy!**
