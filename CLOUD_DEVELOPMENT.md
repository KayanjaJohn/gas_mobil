# GasMobil cloud development and preview workflow

This workflow keeps development and builds in GitHub's cloud. It does not require installing Node, Android Studio, or project dependencies on your personal computer. It does not use Vercel.

## Open the cloud workspace

1. Open https://github.com/KayanjaJohn/gas_mobil
2. Select branch `chore/codespaces-preview-workflow-20261021` (or a follow-up fix branch).
3. Select **Code → Codespaces → Create codespace on this branch**.
4. Wait for the cloud VS Code workspace to start.

The workspace forwards ports 3000 (admin), 3001 (agent), 5000 (API), and 8081 (Expo Metro).

## Run the web dashboards

Open separate Codespaces terminal tabs and run:

```bash
cd apps/admin-dashboard
npm install --legacy-peer-deps
npm run dev -- --host 0.0.0.0
```

```bash
cd apps/agent-app
npm install --legacy-peer-deps
npm run dev -- --host 0.0.0.0
```

Open the forwarded 3000 and 3001 links. These previews are hosted in the Codespace and can be opened from your phone's browser. Any dashboard feature that calls the API still needs a reachable API URL and test data.

## API and database

The API listens on port 5000 and requires a reachable MySQL database plus environment settings. Use a non-production test database and never commit `.env` files or real payment/JWT secrets. Inspect `apps/api/env.example`, then configure `apps/api/.env` with test database credentials and test-only secrets.

```bash
cd apps/api
npm install --legacy-peer-deps
npm run dev
```

A port forward does not create a database. Configure MySQL separately and keep the API port private unless a test device needs access. Do not expose real customer data or use placeholder credentials for deployment.

## Android app previews

The **GasMobil Cloud Checks** workflow exports Android JavaScript bundles for both mobile apps. This verifies Metro bundling but does not create installable APK files.

To create APKs on cloud infrastructure:
1. Ensure both Expo apps are linked/configured for EAS Build.
2. Add repository secret `EXPO_TOKEN` under **Settings → Secrets and variables → Actions**.
3. Open **Actions → GasMobil Android Cloud Builds → Run workflow**.
4. Choose customer, driver, or both. Download the APK from the EAS build page after it finishes.

The Android build is performed by EAS, not your computer. The workflow is manual to avoid consuming build minutes on every push. Confirm Expo project linking and app identifiers before the first run.

## Verification and branch policy

- Pushes and pull requests trigger **GasMobil Cloud Checks**.
- Checks build the API, both web dashboards, the shared package, and both Android JavaScript bundles.
- Review the Actions result and fix failures before merging.
- Keep changes on a dedicated fix/feature branch and use a pull request; do not push unfinished changes directly to `main`.
- CI success verifies compilation/bundling. End-to-end tests still need a reachable API, test database, and test accounts.

No deployment provider is configured here, and Vercel is not used.
