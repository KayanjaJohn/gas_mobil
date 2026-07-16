# 📁 Folder Organization — Gas Mobil Mobile App

This document defines the proper folder structure for a production-ready Expo mobile app with no patches required.

---

## Root Structure

```
gas_mobil/
├── apps/
│   ├── mobile/                           # ← MAIN MOBILE APP (EXPO)
│   │   ├── app/
│   │   │   ├── _layout.tsx              # Root layout (AuthProvider wrapper)
│   │   │   ├── login.tsx                # Login screen
│   │   │   ├── register.tsx             # Register screen
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx          # Tab navigation layout
│   │   │   │   ├── index.tsx            # Home tab
│   │   │   │   ├── tracking.tsx         # Tracking tab
│   │   │   │   ├── profile.tsx          # Profile tab
│   │   │   │   └── ...
│   │   │   ├── order/
│   │   │   │   ├── [id].tsx             # Order detail (dynamic)
│   │   │   │   └── create.tsx           # Create order
│   │   │   └── _sitemap.ts              # (optional) Dynamic routes sitemap
│   │   │
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   ├── api.ts               # Axios instance + interceptors
│   │   │   │   ├── auth.ts              # Auth API calls
│   │   │   │   ├── orders.ts            # Order API calls
│   │   │   │   ├── tracking.ts          # Tracking API calls
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── context/
│   │   │   │   ├── AuthContext.tsx      # Auth state + provider
│   │   │   │   ├── ThemeContext.tsx     # (optional) Theme/Dark mode
│   │   │   │   └── index.ts             # Barrel export
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts           # Auth context hook
│   │   │   │   ├── useApi.ts            # API call wrapper
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   └── RegisterForm.tsx
│   │   │   │   ├── common/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── TextInput.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Loading.tsx
│   │   │   │   │   └── ErrorAlert.tsx
│   │   │   │   ├── orders/
│   │   │   │   │   ├── OrderCard.tsx
│   │   │   │   │   ├── OrderList.tsx
│   │   │   │   │   └── OrderForm.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── screens/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginScreen.tsx
│   │   │   │   │   └── RegisterScreen.tsx
│   │   │   │   ├── tabs/
│   │   │   │   │   ├── HomeScreen.tsx
│   │   │   │   │   ├── TrackingScreen.tsx
│   │   │   │   │   └── ProfileScreen.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── store/
│   │   │   │   ├── authStore.ts         # (optional) Zustand auth store
│   │   │   │   ├── orderStore.ts        # (optional) Order state
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   ├── index.ts             # Barrel export
│   │   │   │   ├── auth.ts              # Auth types (User, Token, etc.)
│   │   │   │   ├── order.ts             # Order types
│   │   │   │   ├── tracking.ts          # Tracking types
│   │   │   │   └── api.ts               # API response types
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── validators.ts        # Email, phone, password validation
│   │   │   │   ├── formatters.ts        # Currency, date formatting
│   │   │   │   ├── constants.ts         # APP_NAME, COLORS, etc.
│   │   │   │   ├── storage.ts           # AsyncStorage helpers
│   │   │   │   └── retry.ts             # Retry logic
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   ├── colors.ts
│   │   │   │   ├── typography.ts
│   │   │   │   └── spacing.ts
│   │   │   │
│   │   │   └── index.ts                 # (optional) Barrel export
│   │   │
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   │   ├── logo.png
│   │   │   │   ├── splash.png
│   │   │   │   └── ...
│   │   │   ├── icons/
│   │   │   │   ├── home.svg
│   │   │   │   ├── tracking.svg
│   │   │   │   └── ...
│   │   │   └── fonts/
│   │   │       ├── Inter-Regular.ttf
│   │   │       └── Inter-Bold.ttf
│   │   │
│   │   ├── app.config.js                # Expo config (replaces app.json)
│   │   ├── .env                         # Environment variables
│   │   ├── .env.example                 # Environment template
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── api/                             # Backend (Express + TypeORM)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── entities/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── package.json
│   │   ├── .env
│   │   └── .env.example
│   │
│   ├── admin-dashboard/                 # Admin panel (Vite + React)
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   │
│   └── agent-app/                       # Agent/Driver app (Vite + React)
│       ├── src/
│       ├── package.json
│       └── ...
│
├── packages/
│   └── shared/                          # Shared types/constants
│       ├── types/
│       ├── constants/
│       └── package.json
│
├── .gitignore
├── .nvmrc
├── package.json                         # Root workspace
├── tsconfig.json
├── README.md
├── QUICK_START.md                       # ← NEW (this guide)
└── FOLDER_ORGANIZATION.md               # ← NEW (structure guide)
```

---

## Key Principles

### 1. **No Nested App Folders**
❌ **Wrong:**
```
apps/mobile/app/screens/login.tsx
```

✅ **Right:**
```
apps/mobile/app/login.tsx
apps/mobile/src/screens/LoginScreen.tsx
```

**Why:** Expo Router uses `app/` as the route definition. Screen components live in `src/screens/`.

---

### 2. **Separation of Concerns**

| Folder | Purpose |
|--------|---------|
| `app/` | **Route definitions only** — file names = routes |
| `src/screens/` | **Full screen components** — complex logic, state |
| `src/components/` | **Reusable UI components** — buttons, inputs, cards |
| `src/services/` | **API layer** — all backend calls |
| `src/context/` | **Global state** — Auth, theme, user |
| `src/types/` | **TypeScript interfaces** — shared types |

---

### 3. **No Patches Required**

All dependencies should work out of the box. If you're using `patch-package`:

1. Remove `postinstall` script from `package.json`
2. Delete `patches/` folder
3. Use corrected versions or forks instead

**Example:** If `react-native-screens` has an issue, upgrade to latest or use a compatible fork.

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Screens | PascalCase + Screen suffix | `LoginScreen.tsx` |
| Components | PascalCase | `Button.tsx` |
| Hooks | camelCase + use prefix | `useAuth.ts` |
| Services | camelCase | `api.ts`, `auth.ts` |
| Types | PascalCase | `User.ts`, `Order.ts` |
| Utils | camelCase | `validators.ts` |
| Routes (app/) | lowercase + kebab-case | `login.tsx`, `(tabs).tsx` |

---

## Import Paths

Configure `tsconfig.json` for clean imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@screens/*": ["src/screens/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@context/*": ["src/context/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@hooks/*": ["src/hooks/*"]
    }
  }
}
```

Then import cleanly:
```tsx
import LoginScreen from '@screens/auth/LoginScreen';
import { Button } from '@components/common/Button';
import { useAuth } from '@hooks/useAuth';
```

---

## Example File Structure for Login Flow

```
src/
├── screens/auth/
│   └── LoginScreen.tsx              # Connects form → context → navigation
│
├── components/auth/
│   └── LoginForm.tsx                # Pure form component
│
├── context/
│   └── AuthContext.tsx              # login() method
│
├── services/
│   └── auth.ts                      # POST /auth/login
│
├── hooks/
│   └── useAuth.ts                   # const { login } = useAuth()
│
└── types/
    └── auth.ts                      # User, LoginRequest, etc.
```

**Data Flow:**
```
LoginScreen
  ↓ (form input)
LoginForm
  ↓ (onSubmit)
useAuth hook
  ↓ (context.login)
AuthContext.login()
  ↓ (API call)
services/auth.ts
  ↓ (response)
Update context + AsyncStorage
  ↓ (navigation)
Redirect to home
```

---

## Checklist: Folder Organization

- [ ] All routes defined in `app/` (file-based routing)
- [ ] Screen logic in `src/screens/`
- [ ] Reusable UI in `src/components/`
- [ ] API calls in `src/services/`
- [ ] Global state in `src/context/`
- [ ] All TypeScript types in `src/types/`
- [ ] Utility functions in `src/utils/`
- [ ] `.env` file created from `.env.example`
- [ ] No `patches/` folder needed
- [ ] No `postinstall` patch script
- [ ] All dependencies install cleanly: `npm install`

---

## Result

✅ **Zero patches**  
✅ **Clean, scalable structure**  
✅ **Easy onboarding for new developers**  
✅ **Fast `npm install` with no post-install fixes**  
✅ **Ready for production deployment**
