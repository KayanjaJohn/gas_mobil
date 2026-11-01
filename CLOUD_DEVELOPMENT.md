# GasMobil cloud development and preview workflow

This workflow keeps development and builds in GitHub's cloud. It does not require installing Node, Android Studio, or project dependencies on your personal computer. It does not use Vercel.

## Open the cloud workspace

1. Open the repository: https://github.com/KayanjaJohn/gas_mobil
2. Select branch `feature/mysql-cloud-setup-20261023` (or another active fix branch).
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

Open the forwarded 3000 and 3001 links. These previews are hosted in the Codespace and can be opened from your phone's browser. Any dashboard feature that calls the API also needs a reachable API URL and test data.

## MySQL: development database in the cloud workspace

The repository already includes a MySQL 8 service in the root `docker-compose.yml`, plus a named Docker volume (`mysql_data`) for database files. We can use this for development and testing without installing MySQL on your phone or computer.

1. Open a Codespaces terminal at the repository root.
2. Check that Docker Compose is available by running `docker compose version`.
3. Start the database service: `docker compose up -d mysql`.
4. Check startup: `docker compose ps` and `docker compose logs --tail=50 mysql`.
5. The API's TypeORM configuration reads `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME` from environment variables. When the API is running as the `api` Compose service, its database host should be `mysql` (the Compose service name). When running the API directly in the Codespace, the host is normally `127.0.0.1` and the database port is `3306`, provided the MySQL container's port is published.
6. Start the API using the intended environment configuration, then verify its startup logs and the `/health` endpoint. A successful health response alone confirms the HTTP server is alive; also check the API logs for the explicit database-connected message.

The current Compose credentials are development-only examples. Replace them with unique test credentials before sharing a workspace, and never reuse them in production. Do not commit `.env` files, database passwords, JWT secrets, or customer data. A Codespace and its Docker volume are for development—not a reliable production database or backup strategy. Deleting/rebuilding a workspace or its containers can put data at risk, so use disposable test records.

### Shared test database and production

If the CEO/team need the same test data across multiple Codespaces or devices, use a managed MySQL instance with TLS and store its connection settings as GitHub Codespaces secrets or deployment-environment secrets. Restrict database network access to the API, use a dedicated least-privilege database account, and keep production and test databases separate. Do not expose MySQL port 3306 publicly.

For production, use a managed MySQL service with automated backups, restore testing, monitoring, TLS, restricted network access, and a documented migration/release process. We should select the provider and region before creating it; this guide does not provision a hosted database or contain real connection credentials.

### Schema and migrations

The API uses TypeORM and currently has `synchronize: false` and `migrationsRun: true` in its data-source configuration. Database schema changes should be represented by reviewed migrations, not manual production table edits. Before running migrations against a shared database, review the migration files and make a backup/snapshot. We must verify that the current migration set is complete and safe before using this as a production setup.

## API

The API is in `apps/api` and requires a reachable MySQL database plus environment settings. The sample environment file is `apps/api/env.example`; use it as a reference to create a private `apps/api/.env` for local-in-Codespaces execution, but fill only test values. Never commit the private file.

```bash
cd apps/api
npm install --legacy-peer-deps
npm run dev
```

When running the API directly inside Codespaces, set `DB_HOST=127.0.0.1` for the published MySQL port. When running it through Compose, use `DB_HOST=mysql`. Keep the API port private unless a test device needs access, and do not expose real customer data.

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
