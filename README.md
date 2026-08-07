# GasMobil version1 Critical Fixes — Pre-Launch Patch

Apply these fixes before Thursday launch. Each file maps 1:1 to your repo.

---

## 🔴 CRITICAL FIXES (Apply First)

### 1. Backend: Notification IDs (Socket → Real DB IDs)
**File:** `apps/api/src/services/notificationService.ts`
**What it fixes:** Socket notifications now emit the REAL database UUID instead of a synthetic `Date.now()` ID. This makes "Mark as read" work on real-time notifications.
**Action:** Replace the entire file with `notificationService.ts`.

### 2. Mobile: Socket Cleanup in Tracking
**File:** `apps/mobile/src/hooks/useOrderTracking.ts`
**What it fixes:** Stops the tracking hook from killing the global socket (which also kills notifications).
**Action:** Replace the entire file with `useOrderTracking.ts`.

### 3. Mobile: Driver Location Circular Dependency
**File:** `apps/mobile/src/hooks/useDriverLocation.ts`
**What it fixes:** Removes `stopTracking` from its own `useEffect` dependency array, preventing infinite re-renders or stale closures.
**Action:** Replace the entire file with `useDriverLocation.ts`.

---

## 🟠 HIGH FIXES

### 4. Mobile: Real Tracking Screen
**File:** `apps/mobile/app/tracking.tsx`
**What it fixes:** Replaces the mock map with the actual `LiveTrackingMap` component + socket tracking. Removes wasteful 10-second HTTP polling.
**Action:** Replace the entire file with `tracking.tsx`.

### 5. Backend: Socket Rate Limiting
**File:** `apps/api/src/config/socket.ts`
**What it fixes:** Adds a 3-second rate limit per driver on `driver_location_update`. Prevents server overload and battery drain.
**Action:** Replace the entire file with `socket.ts`.

---

## 🟡 MEDIUM FIXES

### 6. Backend: Consolidate Delivery Status Logic
**New file:** `apps/api/src/services/deliveryService.ts`
**What it fixes:** Extracts the duplicated delivery-status-update logic into ONE service used by driverController, deliveryController, and the delivery route.
**Action:** Create this as a NEW file. Then replace the three files below.

### 7. Backend: driverController.ts
**File:** `apps/api/src/controllers/driverController.ts`
**Action:** Replace with the provided `driverController.ts`. It now calls `updateDeliveryStatusUnified()`.

### 8. Backend: deliveryController.ts
**File:** `apps/api/src/controllers/deliveryController.ts`
**Action:** Replace with the provided `deliveryController.ts`. It now calls `updateDeliveryStatusUnified()`.

### 9. Backend: delivery route
**File:** `apps/api/src/routes/delivery.ts`
**Action:** Replace with the provided `delivery.ts`. It now calls `updateDeliveryStatusUnified()`.

### 10. Mobile: Socket-Aware Notifications
**File:** `apps/mobile/src/hooks/useSocketNotifications.ts`
**What it fixes:** On socket events, either uses the real backend ID (if present) or refetches from API. No more synthetic IDs.
**Action:** Replace the entire file with `useSocketNotifications.ts`.

### 11. Mobile: Notifications Screen
**File:** `apps/mobile/app/(tabs)/notifications.tsx`
**What it fixes:** Stops HTTP polling when the socket is connected (socket gives real-time updates). Adds optimistic updates with rollback on error.
**Action:** Replace the entire file with `notifications.tsx`.

### 12. Mobile: TopBar
**File:** `apps/mobile/src/components/TopBar.tsx`
**What it fixes:** Reads unread count from the shared Zustand store instead of doing its own independent HTTP polling every 30 seconds.
**Action:** Replace the entire file with `TopBar.tsx`.

---

## 🧹 CLEANUP (One-liners)

```bash
# Delete the old duplicate socket file
cd apps/api/src && rm -f socket.ts

# Restart your backend after all changes
npm run dev
```

---

## ✅ Pre-Launch Checklist

- [ ] `notificationService.ts` replaced → socket notifications have real IDs
- [ ] `useOrderTracking.ts` replaced → socket stays alive when leaving tracking
- [ ] `useDriverLocation.ts` replaced → no circular dependency
- [ ] `tracking.tsx` replaced → real map + socket instead of mock
- [ ] `socket.ts` (backend config) replaced → driver location rate-limited
- [ ] `deliveryService.ts` created + 3 controller/route files replaced → no duplicate logic
- [ ] `useSocketNotifications.ts` replaced → handles real IDs correctly
- [ ] `notifications.tsx` replaced → socket-aware polling
- [ ] `TopBar.tsx` replaced → uses shared store
- [ ] `apps/api/src/socket.ts` deleted → old duplicate removed
- [ ] Backend restarted
- [ ] Mobile app tested: place order → receive notification → mark as read ✓
- [ ] Mobile app tested: tracking screen shows live driver movement ✓

---

## 🚀 Quick Test Commands

```bash
# Backend
cd apps/api
npm run dev

# Mobile (new terminal)
cd apps/mobile
npx expo start
```

Test flow:
1. Customer places order → should see "New Order" notification in app
2. Tap notification → goes to tracking
3. Driver picks up → customer sees status change in real-time
4. Driver moves → customer sees map marker move
5. Mark notification as read → badge disappears and stays gone on refresh
