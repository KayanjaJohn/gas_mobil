# GasMobil cloud development and preview workflow

This workflow lets you review changes without installing Node, Android Studio, MySQL, or project dependencies on your computer. Services run in a remote GitHub Codespace; your browser displays forwarded ports. **This is not a Vercel workflow.**

## What GitHub Actions checks

The cloud workflow attempts to build the Admin dashboard (`apps/admin-dashboard`), build the Agent dashboard (`apps/agent-app`), compile API TypeScript (`apps/api`), and validate/export Android JavaScript bundles for `apps/mobile` and `apps/driver-app`.

A green Android bundle job is not the same as a signed APK or a full Android device test. Installable Android builds require Expo Application Services (EAS) configuration and credentials.

## Open a Codespace

1. Open https://github.com/KayanjaJohn/gas_mobil.
2. Switch to `chore/codespaces-cloud-preview`.
3. Select **Code → Codespaces → Create codespace on chore/codespaces-cloud-preview**. If Codespaces is unavailable, enable it for the account/repository or use GitHub Actions for build checks.
4. Wait for setup to finish; dependencies are installed in the remote workspace.
5. Open the **Ports** tab to use forwarded preview URLs.

## Start the web dashboards

Run each command in a separate Codespaces terminal:

```bash
cd apps/admin-dashboard && npm run dev -- --host 0.0.0.0
```

Admin dashboard: port **3000**.

```bash
cd apps/agent-app && npm run dev -- --host 0.0.0.0
```

Agent dashboard: port **3001**. Open the forwarded URLs from the Codespaces Ports tab. Do not use `localhost` on your own computer; it points to your own computer, not the Codespace.

## Start API and database

The API uses MySQL. Review `docker-compose.yml` and the API environment example before starting services. Never commit `.env` files, real passwords, API keys, JWT secrets, Stripe secrets, or payment-provider credentials.

If Compose configuration and required environment files are ready, start the stack from the repository root:

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 api
```

The API is expected on port **5000**. If Compose requires an environment file that is absent, copy the documented example into the required location inside the Codespace and use development-only values. Do not use production credentials.

If the API cannot start because of environment, database, migration, or compile errors, dashboard pages may load but live data and actions will not work. A UI preview is not proof of end-to-end functionality.

## Preview Android apps

Customer app, in one terminal:

```bash
cd apps/mobile && npx expo start --tunnel
```

Driver app, in another terminal:

```bash
cd apps/driver-app && npx expo start --tunnel
```

Use Expo Go on an Android phone where the app's native modules are compatible. Native-only features such as maps, background location, and notifications may require a development build.

Configure each mobile app to use a reachable Codespaces API URL, not `localhost` or a private LAN IP. Do not put API secrets in public Expo variables; bundled values are visible to app users.

## Create installable Android builds

After each app has valid Expo project configuration and an `eas.json` build profile:

1. Configure the Expo/EAS project for that app.
2. Add the Expo access token as a GitHub Actions secret named `EXPO_TOKEN`.
3. Run EAS Build from the Codespace or add a dedicated workflow that uses that secret.
4. Download the Android build from the Expo build page.

This branch's Android job only checks Expo configuration and bundles JavaScript; it does not produce an APK, manage signing keys, or claim device testing.

## Safe review cycle

1. Make changes on a feature branch, not directly on `main`.
2. Push changes and open a pull request.
3. Wait for GitHub Actions checks and fix failed jobs.
4. Manually inspect Admin and Agent through forwarded ports; use Expo/Android builds to inspect mobile apps.
5. Test sign-in, orders, payments, inventory, maps, notifications, and delivery flows against a development database before merging.

## Important limits

- Codespaces removes the need to run services on your own computer, but interactive full-stack testing still requires a remote API and database.
- Build checks do not replace end-to-end workflow testing.
- Do not use real payment credentials or production customer data in previews.
- If an app has no package lock yet, npm resolves from `package.json`; committing lockfiles later will make installs more reproducible.
