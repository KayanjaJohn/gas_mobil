# 📱 Mobile App — Installation & Migration Guide

## What Changed & Why

### Problems Fixed

| Issue | Before | After |
|-------|--------|-------|
| **Missing AuthContext** | Screens imported from non-existent file | Full AuthContext with login, register, logout, auto-login |
| **No token refresh** | 401 just cleared token | Automatic refresh with queue for concurrent requests |
| **Hardcoded API URL** | `localhost:5000` fallback | Enforced env var with clear error message |
| **No input validation** | Empty strings accepted | Email, phone (Uganda), password rules |
| **No confirm password** | Single password field | Confirm password with match check |
| **Ugly UI** | Plain dark screen | Matches HTML prototype design (flame logo, gradients, cards) |
| **No keyboard handling** | Keyboard covers inputs | KeyboardAvoidingView + dismiss on tap outside |
| **No auto-login after register** | Redirected to login screen | Auto-logs in after successful registration |
| **Console.log everywhere** | Clutters production logs | Removed (add __DEV__ wrapper if needed) |
| **No loading states** | Button stays clickable | ActivityIndicator during API calls |

---

## File Placement

Copy these files into your project in this exact structure:

```
apps/mobile/
├── app.config.js                    ← NEW (replaces app.json)
├── .env                             ← NEW (from .env.example)
├── .env.example                     ← NEW
├── app/
│   ├── _layout.tsx                  ← UPDATE (wrap with AuthProvider)
│   ├── login.tsx                    ← REPLACE with LoginScreen.tsx
│   ├── register.tsx                 ← REPLACE with RegisterScreen.tsx
│   └── (tabs)/                      ← Your tab screens
├── src/
│   ├── services/
│   │   └── api.ts                   ← REPLACE
│   ├── context/
│   │   ├── AuthContext.tsx          ← NEW (CRITICAL)
│   │   └── index.ts                 ← NEW (optional barrel export)
│   ├── screens/
│   │   └── ... (your other screens)
│   └── ...
```

---

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd apps/mobile

# Required packages
npm install zod
npm install expo-constants

# If not already installed:
npm install @react-native-async-storage/async-storage axios
```

### Step 2: Create `.env` file

```bash
cp .env.example .env
```

Edit `.env`:
```env
# For iOS Simulator / Android Emulator:
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# For physical device (use your machine's local IP):
# EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api

# For production:
# EXPO_PUBLIC_API_URL=https://api.gasmobil.ug/api
```

> Find your IP: macOS/Linux: `ifconfig | grep inet`, Windows: `ipconfig`

### Step 3: Replace `app.json` with `app.config.js`

```bash
mv app.json app.json.bak
cp app.config.js apps/mobile/
```

### Step 4: Wrap App with AuthProvider

In `apps/mobile/app/_layout.tsx`:

```tsx
import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
```

### Step 5: Update Backend for Refresh Tokens

Your backend needs a `/auth/refresh` endpoint. Add this to `apps/api/src/controllers/authController.ts`:

```typescript
// POST /api/auth/refresh
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

And add the route in `apps/api/src/routes/auth.ts`:

```typescript
router.post('/refresh', authController.refreshToken);
```

Add to your `.env`:
```env
REFRESH_SECRET=your-refresh-secret-min-32-chars
REFRESH_EXPIRES_IN=7d
JWT_EXPIRES_IN=15m
```

### Step 6: Update Backend Login/Register Response

Ensure your login and register endpoints return BOTH tokens:

```typescript
res.json({
  success: true,
  data: {
    token: accessToken,        // ← keep this key for backward compat
    refreshToken: refreshToken, // ← ADD THIS
    user: { ... }
  }
});
```

### Step 7: Run the App

```bash
npx expo start --clear
```

---

## Testing Checklist

| Test | Expected Result |
|------|----------------|
| Open app without `.env` | Clear error: "EXPO_PUBLIC_API_URL is not set" |
| Login with wrong password | Alert: "Invalid credentials" |
| Login with empty fields | Alert: "Missing fields" |
| Register with invalid phone | Alert: "Invalid phone" with Uganda format hint |
| Register with mismatched passwords | Alert: "Passwords don't match" |
| Register success | Auto-redirects to home tabs |
| Kill app and reopen | Still logged in (token persisted) |
| 401 from expired token | Silent refresh, request retries |
| Network error | Auto-retry 2x with exponential backoff |
| Tap outside input | Keyboard dismisses |

---

## Next Steps (Recommended)

1. **Add biometric login** — Expo LocalAuthentication
2. **Add push notifications** — Expo Notifications for order updates
3. **Add deep linking** — Open tracking screen from push notification
4. **Add analytics** — Track conversion funnel
5. **Add Sentry** — Error tracking in production
