# 📱 Gas Mobil Mobile App — Migration Guide

## What Was Generated

This is a **complete rewrite** of the mobile app following proper React Native / Expo Router conventions.

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Expo Router** | File-based routing, no manual route config |
| **Zustand** | Lightweight state management, persists to AsyncStorage |
| **Barrel exports** | Clean imports: `import { X } from '../components'` |
| **Shared components** | DRY: TopBar, Card, BottomNav reused across screens |
| **TypeScript types** | Single source of truth in `src/types/` |
| **Constants file** | Colors, prices, demo data centralized |
| **AuthContext** | JWT + refresh token with auto-hydration |
| **API interceptors** | Silent refresh, retry logic, env validation |

---

## File Structure (Final)

```
apps/mobile/
├── app.config.js                    ← Expo config (replaces app.json)
├── .env                             ← Your API URL
├── .env.example                     ← Template
│
├── app/                              ← Expo Router screens
│   ├── _layout.tsx                   ← Root layout (AuthProvider)
│   ├── +not-found.tsx                ← 404 page
│   ├── login.tsx                     ← Sign In
│   ├── register.tsx                  ← Sign Up
│   ├── order.tsx                     ← Step 1: Type + Size
│   ├── order-loc.tsx                 ← Step 2: Location
│   ├── order-summary.tsx             ← Step 3: Summary + Payment
│   ├── accessories.tsx               ← Accessories marketplace
│   ├── cart.tsx                      ← Shopping cart
│   ├── stations.tsx                  ← Partner stations
│   ├── tracking.tsx                  ← Live delivery tracking
│   ├── green.tsx                     ← Green impact
│   ├── profile.tsx                   ← User profile
│   └── (tabs)/
│       └── index.tsx                 ← Home dashboard
│
├── src/
│   ├── components/
│   │   ├── index.ts                  ← Barrel export
│   │   ├── BottomNav.tsx             ← Tab navigation bar
│   │   ├── Card.tsx                  ← Reusable card container
│   │   ├── FlameLogo.tsx             🔥 Brand logo
│   │   ├── ScreenWrapper.tsx         ← Safe area wrapper
│   │   ├── SectionLabel.tsx          ← Section header
│   │   ├── Toast.tsx                 ← Toast notification
│   │   └── TopBar.tsx                ← App bar with brand/back
│   │
│   ├── context/
│   │   ├── index.ts                  ← Barrel export
│   │   └── AuthContext.tsx           ← Auth state (login/register/logout)
│   │
│   ├── services/
│   │   └── api.ts                    ← Axios + interceptors + retry
│   │
│   ├── store/
│   │   ├── index.ts                  ← Barrel export
│   │   ├── useCartStore.ts           ← Zustand cart (persisted)
│   │   └── useOrderStore.ts          ← Zustand order flow
│   │
│   ├── types/
│   │   └── index.ts                  ← All TypeScript types
│   │
│   └── utils/
│       ├── index.ts                  ← Barrel export
│       ├── constants.ts              ← Colors, prices, demo data
│       ├── formatters.ts             ← UGX, dates, distances
│       └── validators.ts             ← Email, phone, password checks
```

---

## Step-by-Step Migration

### Step 1: Backup & Clean

```bash
cd apps/mobile

# Backup old files
mv app app-old
mv src src-old

# Create new structure
mkdir -p app/(tabs) src/{components,context,services,store,types,utils}
```

### Step 2: Install Dependencies

```bash
# Required new packages
npm install zod expo-constants

# If missing from your project:
npm install zustand axios @react-native-async-storage/async-storage
```

### Step 3: Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:
```bash
# For iOS Simulator / Android Emulator
c

# For physical device (find your IP: ifconfig | grep inet)
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api

# Production
EXPO_PUBLIC_API_URL=https://api.gasmobil.ug/api
```

### Step 4: Replace app.json with app.config.js

```bash
mv app.json app.json.bak
# Copy the generated app.config.js to root of apps/mobile/
```

### Step 5: Copy All Generated Files

Copy every file from the generated output into your project maintaining the exact folder structure shown above.

### Step 6: Update Backend

Your backend MUST implement these changes for the mobile app to work:

#### 6a. Add refresh token endpoint (`apps/api/src/controllers/authController.ts`)

```typescript
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET!) as any;
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_SECRET!,
      { expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken }
    });
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
};
```

#### 6b. Add route (`apps/api/src/routes/auth.ts`)

```typescript
router.post('/refresh', authController.refreshToken);
```

#### 6c. Update login/register to return refreshToken

```typescript
// In both login and register controllers:
res.json({
  success: true,
  data: {
    token: accessToken,        // keep for backward compat
    refreshToken: refreshToken,  // ADD THIS
    user: { ... }
  }
});
```

#### 6d. Add to `.env`

```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_SECRET=your-refresh-secret-key-min-32-chars
REFRESH_EXPIRES_IN=7d
```

> ⚠️ **CRITICAL:** Remove the fallback `|| 'your-secret-key'` from JWT_SECRET!

### Step 7: Run

```bash
npx expo start --clear
```

---

## Screen Navigation Map

| Screen | Route | From | To |
|--------|-------|------|-----|
| Login | `/login` | Auth tab | `/(tabs)` after login |
| Register | `/register` | Auth tab | `/(tabs)` after register |
| Home | `/(tabs)` | BottomNav | All screens |
| Order Step 1 | `/order` | Home → Order Now | `/order-loc` |
| Order Step 2 | `/order-loc` | Back: `/order` | `/order-summary` |
| Order Step 3 | `/order-summary` | Back: `/order-loc` | `/tracking` or `/(tabs)` |
| Accessories | `/accessories` | Home or Order Summary | `/cart` |
| Cart | `/cart` | Accessories or BottomNav | `/order-summary` |
| Stations | `/stations` | Home or BottomNav | — |
| Tracking | `/tracking` | Order Summary or BottomNav | — |
| Green | `/green` | BottomNav | — |
| Profile | `/profile` | BottomNav | `/login` on logout |

---

## Testing Checklist

| # | Test | Expected |
|---|------|----------|
| 1 | Open without `.env` | Clear error: "EXPO_PUBLIC_API_URL is not set" |
| 2 | Login with wrong password | Alert: "Invalid credentials" |
| 3 | Login with empty fields | Alert: "Missing fields" |
| 4 | Register with invalid phone | Alert: "Invalid phone" with format hint |
| 5 | Register with mismatched passwords | Alert: "Passwords don't match" |
| 6 | Register success | Auto-redirects to home tabs |
| 7 | Kill app and reopen | Still logged in (token persisted) |
| 8 | 401 from expired token | Silent refresh, request retries |
| 9 | Network error | Auto-retry 2x with exponential backoff |
| 10 | Add accessory to cart | Cart badge updates, persists |
| 11 | Complete order flow | All 3 steps work, order placed |
| 12 | Navigate via bottom nav | All 5 tabs switch correctly |
| 13 | Logout | Clears auth, redirects to login |

---

## What's Next (Recommended)

1. **Add real maps** — Replace map placeholders with `react-native-maps`
2. **Add push notifications** — `expo-notifications` for order updates
3. **Add biometric auth** — `expo-local-authentication` for quick login
4. **Add deep linking** — Open tracking from push notification
5. **Add Sentry** — Error tracking in production
6. **Add analytics** — Track conversion funnel
7. **Image uploads** — For delivery photo confirmation
8. **Real-time tracking** — Socket.IO integration for driver GPS
