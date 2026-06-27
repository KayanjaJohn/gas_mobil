# 🔧 Backend Migration Guide — Surgical Changes Only

## What Changed (and Why)

This update makes **minimal surgical changes** to your existing backend to support
the new mobile app with refresh tokens and improved security.

---

## Files to Replace

| File | Your Current | New Version | Changes |
|------|-------------|-------------|---------|
| `src/controllers/authController.ts` | ✅ Working | ✅ Updated | ADD refresh tokens, ADD `/refresh` endpoint, ADD validation |
| `src/middleware/auth.ts` | ⚠️ Has fallback secret | ✅ Fixed | REMOVE fallback, ADD proper error handling |
| `src/routes/auth.ts` | ✅ Working | ✅ Updated | ADD `/refresh` POST route |
| `src/server.ts` | ✅ Working | ✅ Updated | ADD rate limiting, ADD env validation |
| `src/config/database.ts` | ⚠️ synchronize: true | ✅ Fixed | DISABLE synchronize (always false) |
| `.env.example` | ✅ Working | ✅ Updated | ADD REFRESH_SECRET, JWT_EXPIRES_IN, REFRESH_EXPIRES_IN |
| `scripts/generate-secrets.js` | ❌ Missing | ✅ NEW | Helper to generate secure secrets |

---

## What Was PRESERVED (Your Working Code)

All these files remain **completely unchanged** — do NOT replace them:

| File | Status | Why |
|------|--------|-----|
| `src/controllers/orderController.ts` | ✅ PRESERVED | Complex logic intact |
| `src/controllers/driverController.ts` | ✅ PRESERVED | Socket.IO integration intact |
| `src/controllers/adminController.ts` | ✅ PRESERVED | All admin features intact |
| `src/controllers/productController.ts` | ✅ PRESERVED | Role-based filtering intact |
| `src/middleware/requireRole.ts` | ✅ PRESERVED | Clean implementation |
| `src/middleware/errorHandler.ts` | ✅ PRESERVED | Good error handling |
| `src/entities/User.ts` | ✅ PRESERVED | All fields intact |
| `src/entities/Order.ts` | ✅ PRESERVED | All relations intact |
| `src/entities/Station.ts` | ✅ PRESERVED | All fields intact |
| `src/entities/Product.ts` | ✅ PRESERVED | All fields intact |
| `src/routes/orders.ts` | ✅ PRESERVED | All routes intact |
| `src/routes/products.ts` | ✅ PRESERVED | All routes intact |
| `src/routes/stations.ts` | ✅ PRESERVED | All routes intact |
| `src/routes/drivers.ts` | ✅ PRESERVED | All routes intact |
| `src/routes/admin.ts` | ✅ PRESERVED | All routes intact |
| `src/routes/agent.ts` | ✅ PRESERVED | All routes intact |

---

## Step-by-Step Migration

### Step 1: Backup Your Current Files

```bash
cd apps/api
mkdir -p .backup
cp src/controllers/authController.ts .backup/
cp src/middleware/auth.ts .backup/
cp src/routes/auth.ts .backup/
cp src/server.ts .backup/
cp src/config/database.ts .backup/
```

### Step 2: Copy New Files

```bash
# From the generated files, copy these to your repo:
cp /path/to/generated/authController.ts src/controllers/
cp /path/to/generated/authMiddleware.ts src/middleware/auth.ts
cp /path/to/generated/authRoutes.ts src/routes/auth.ts
cp /path/to/generated/server.ts src/
cp /path/to/generated/database.ts src/config/
cp /path/to/generated/.env.example .env.example
mkdir -p scripts
cp /path/to/generated/generate-secrets.js scripts/
chmod +x scripts/generate-secrets.js
```

### Step 3: Generate Secrets

```bash
node scripts/generate-secrets.js
```

Copy the output into your `.env` file:

```bash
# Edit .env
nano .env

# Add these lines (replace with generated values):
JWT_SECRET=your-generated-jwt-secret
JWT_EXPIRES_IN=15m
REFRESH_SECRET=your-generated-refresh-secret
REFRESH_EXPIRES_IN=7d
```

### Step 4: Install New Dependencies

```bash
npm install express-rate-limit helmet
```

### Step 5: Create Migrations (if first time)

```bash
# If you don't have migrations yet, create initial migration:
npx typeorm migration:create src/migrations/InitialMigration

# Then write the migration SQL to create all tables
# Or use: npx typeorm migration:generate -d src/config/database.ts
```

### Step 6: Test

```bash
npm run dev

# In another terminal:
curl http://localhost:5000/health
# Should return: {"status":"ok","timestamp":"..."}

# Test register with refresh token:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","phone":"+256700000001","password":"password123"}'

# Should return: { success: true, data: { token, accessToken, refreshToken, user } }
```

---

## API Changes

### New Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/refresh` | Public | Exchange refresh token for new access token |

### Modified Endpoints

| Endpoint | Change |
|----------|--------|
| `POST /api/auth/register` | Now returns `refreshToken` in response |
| `POST /api/auth/login` | Now returns `refreshToken` in response |

### Response Format (unchanged)

```json
{
  "success": true,
  "data": {
    "token": "...",           // backward compat (keep using this)
    "accessToken": "...",      // explicit (new)
    "refreshToken": "...",     // NEW (required by mobile)
    "user": { ... }
  }
}
```

---

## Security Improvements

| Feature | Before | After |
|---------|--------|-------|
| JWT expiry | 7 days | 15 minutes |
| Refresh tokens | ❌ None | ✅ 7 days, separate secret |
| Fallback secret | `your-secret-key` | ❌ Removed — server refuses to start |
| Rate limiting | ❌ None | ✅ 5 attempts / 15 min on auth |
| Helmet headers | ❌ None | ✅ All security headers |
| Env validation | ❌ Silent fail | ✅ Server exits if secrets missing |
| Database sync | `true` in dev | ✅ Always false — migrations only |

---

## Troubleshooting

### "Server won't start — missing JWT_SECRET"

```bash
# Generate secrets
node scripts/generate-secrets.js

# Add to .env
```

### "Token expired" errors immediately

Check your `.env` — `JWT_EXPIRES_IN` should be `15m` not `15`:
```bash
JWT_EXPIRES_IN=15m  # ✅ Correct
JWT_EXPIRES_IN=15   # ❌ Wrong (treated as 15ms!)
```

### "Database not syncing"

You need to run migrations manually:
```bash
npx typeorm migration:run -d src/config/database.ts
```

---

## Rollback (If Something Breaks)

```bash
cd apps/api
cp .backup/authController.ts src/controllers/
cp .backup/auth.ts src/middleware/
cp .backup/auth.ts src/routes/
cp .backup/server.ts src/
cp .backup/database.ts src/config/
```
