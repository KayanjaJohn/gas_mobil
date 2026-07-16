# ✅ Deployment Checklist — Gas Mobil

Use this checklist before deploying to production. All items must pass **without patches**.

---

## Pre-Deployment Verification

### Environment & Dependencies

- [ ] Node.js version is 18+: `node --version`
- [ ] npm version is 9+: `npm --version`
- [ ] All dependencies install cleanly: `cd apps/mobile && npm install`
- [ ] No peer dependency warnings in npm output
- [ ] No `patches/` folder exists
- [ ] No `postinstall` script in `package.json`
- [ ] `.env` file is set correctly (not committed to git)
- [ ] `.env.example` is up-to-date

### Backend Setup

- [ ] Backend API is running: `cd apps/api && npm run dev`
- [ ] Database migrations executed: `npm run migration:run`
- [ ] Backend `.env` has valid `JWT_SECRET` (min 32 chars)
- [ ] Backend `.env` has valid `REFRESH_SECRET` (min 32 chars)
- [ ] Refresh token endpoint exists: `POST /api/auth/refresh`
- [ ] Login endpoint returns both `token` and `refreshToken`
- [ ] Register endpoint returns both `token` and `refreshToken`

### Mobile App Configuration

- [ ] Mobile `.env` has `EXPO_PUBLIC_API_URL` set
- [ ] For development: `http://localhost:5000/api` (simulator/emulator)
- [ ] For development (device): `http://192.168.X.X:5000/api` (local IP)
- [ ] For production: `https://api.gasmobil.ug/api` (or your domain)
- [ ] Expo Router is configured correctly in `app/_layout.tsx`
- [ ] AuthContext provider wraps root layout
- [ ] No hardcoded localhost URLs in code

### API Client Configuration

- [ ] `src/services/api.ts` uses `EXPO_PUBLIC_API_URL`
- [ ] Request interceptor adds `Authorization: Bearer <token>`
- [ ] Response interceptor handles 401 errors → token refresh
- [ ] Refresh token request is queued (no concurrent requests)
- [ ] Retry logic has exponential backoff (max 2 retries)
- [ ] Error messages are user-friendly (not console errors)

### Authentication Flow

- [ ] Login form validates email and password
- [ ] Register form validates email, phone (Uganda format), password
- [ ] Register form has "confirm password" check
- [ ] Register auto-logs in user after success
- [ ] Token is stored in AsyncStorage (secure)
- [ ] Token persists on app restart
- [ ] Logout clears token from AsyncStorage
- [ ] 401 errors trigger silent token refresh (no UI disruption)
- [ ] Invalid refresh token logs user out

### UI/UX

- [ ] Keyboard dismisses when tapping outside input
- [ ] KeyboardAvoidingView prevents input obscuring on Android
- [ ] Loading indicators show during API calls
- [ ] Error messages display in alerts (not console)
- [ ] Buttons are disabled during API calls
- [ ] Form validation shows before API submission
- [ ] Navigation redirects to login if not authenticated
- [ ] Deep linking works (if implemented)

### Testing

- [ ] [Dev] Test login with valid credentials → redirects to home
- [ ] [Dev] Test login with invalid credentials → alert shown
- [ ] [Dev] Test login with empty fields → alert shown
- [ ] [Dev] Test register with invalid email → validation shown
- [ ] [Dev] Test register with non-Uganda phone → error message
- [ ] [Dev] Test register with mismatched passwords → error message
- [ ] [Dev] Test register success → auto-login + home redirect
- [ ] [Dev] Close app → reopen → still logged in
- [ ] [Dev] Server downtime → app shows network error
- [ ] [Dev] Expired token → silent refresh → request succeeds
- [ ] [Prod] Test on iOS device
- [ ] [Prod] Test on Android device
- [ ] [Prod] Test on real network (not localhost)

### Code Quality

- [ ] No `console.log()` statements (or wrapped in `__DEV__`)
- [ ] No hardcoded URLs or secrets
- [ ] No unused imports or variables
- [ ] TypeScript compilation succeeds: `tsc --noEmit`
- [ ] All API calls are typed (no `any`)
- [ ] All props have TypeScript interfaces

### Dependencies

- [ ] All packages are in `dependencies` (not `devDependencies`)
- [ ] No conflicting versions: `npm ls`
- [ ] Production packages only (no test frameworks in deps):
  - ✅ `expo`, `react`, `react-native`, `axios`
  - ❌ `jest`, `@testing-library/react`
- [ ] No unused packages (check `package.json`)

### Deployment Platforms

#### Android (Google Play)

- [ ] `eas.json` is configured
- [ ] Production build created: `eas build --platform android --auto-submit`
- [ ] APK signed with keystore
- [ ] Version code incremented in `app.config.js`
- [ ] App icon is 512x512 PNG
- [ ] Splash screen is optimized for all densities
- [ ] App tested on Android 8+ devices

#### iOS (App Store)

- [ ] `eas.json` is configured
- [ ] Production build created: `eas build --platform ios`
- [ ] App signing certificates uploaded to EAS
- [ ] App icons provided (1024x1024 PNG)
- [ ] Splash screens provided
- [ ] App tested on iOS 14+ devices
- [ ] Privacy policy URL configured
- [ ] Contact email provided

#### Web (Optional PWA)

- [ ] Web build succeeds: `expo export:web`
- [ ] Service worker is registered
- [ ] Manifest.json is correct
- [ ] Deploy to hosting (Vercel, Netlify, etc.)
- [ ] Test offline functionality

### Production Readiness

- [ ] Error tracking set up (Sentry, LogRocket, etc.)
- [ ] Analytics configured (Mixpanel, Amplitude, etc.)
- [ ] Push notifications ready (Expo Notifications)
- [ ] Deep linking configured (for push notification clicks)
- [ ] Biometric login tested (if implemented)
- [ ] Rate limiting configured on backend
- [ ] Database backups scheduled
- [ ] Monitoring alerts set up (Datadog, New Relic, etc.)

### Documentation

- [ ] `README.md` is complete and current
- [ ] `QUICK_START.md` is accurate
- [ ] `FOLDER_ORGANIZATION.md` matches actual structure
- [ ] `.env.example` documents all required variables
- [ ] Backend `.env.example` documented
- [ ] API documentation up-to-date
- [ ] Deployment runbook created (for CI/CD)

### Security

- [ ] No credentials in code or git history
- [ ] `JWT_SECRET` is unique and strong (min 32 chars)
- [ ] `REFRESH_SECRET` is unique and strong (min 32 chars)
- [ ] SSL/TLS enabled on production API
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled on login/register
- [ ] Password hashing uses bcryptjs (salt rounds ≥ 10)
- [ ] Tokens have reasonable expiration (access: 15m, refresh: 7d)
- [ ] Sensitive data not logged (passwords, tokens, etc.)
- [ ] No sensitive data in error messages (user feedback)

### Git & CI/CD

- [ ] All changes committed to `fix/launch-monday-critical-fixes`
- [ ] Pull request reviewed and approved
- [ ] CI/CD pipeline runs successfully
- [ ] All tests pass (if any)
- [ ] Linting passes (no warnings)
- [ ] Type checking passes (`tsc --noEmit`)
- [ ] Build succeeds for all platforms
- [ ] Staging environment passes smoke tests

---

## Final Sign-Off

| Item | Status | Notes |
|------|--------|-------|
| Dev environment working | ✅ | |
| Staging environment working | ✅ | |
| All tests passing | ✅ | |
| Security review complete | ✅ | |
| Performance review complete | ✅ | |
| Load testing done | ✅ | |
| Rollback plan ready | ✅ | |
| Team trained on deployment | ✅ | |

---

## Deployment Commands

### Android
```bash
cd apps/mobile
eas build --platform android --auto-submit
```

### iOS
```bash
cd apps/mobile
eas build --platform ios
```

### Backend (if using Docker)
```bash
docker-compose up -d
```

### Rollback
```bash
# Revert to previous commit
git revert <commit-hash>
git push origin production
```

---

## Post-Deployment

- [ ] Monitor error tracking for exceptions
- [ ] Check analytics for user activity
- [ ] Verify API response times
- [ ] Test key user flows (login → order → tracking)
- [ ] Check database performance
- [ ] Review server logs for errors
- [ ] Send announcement to users (if major update)

---

## 🎉 Ready to Deploy!

When all checkboxes are complete, you're ready for production. No patches needed.

**Questions?** Check the guides:
- [QUICK_START.md](./QUICK_START.md) — Setup in 3 steps
- [FOLDER_ORGANIZATION.md](./FOLDER_ORGANIZATION.md) — Code structure
- [README.md](./README.md) — Full documentation
