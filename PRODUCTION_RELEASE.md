# GasMobil production release runbook

## Current release artifacts

- Public website: `apps/website/`
- API container: `apps/api/Dockerfile`
- Website container: `apps/website/Dockerfile`
- Production Compose: `docker-compose.production.yml`
- GHCR publishing: `.github/workflows/publish-images.yml`
- EAS customer/driver profiles: `apps/mobile/eas.json`, `apps/driver-app/eas.json`
- EAS build workflow: `.github/workflows/mobile-builds.yml`

## Docker images

The GitHub Actions workflow publishes these images to GitHub Container Registry when relevant files are pushed to `main`:

- `ghcr.io/kayanjajohn/gas-mobil-api:latest`
- `ghcr.io/kayanjajohn/gas-mobil-website:latest`

The workflow can also be run manually from GitHub Actions. Select the release branch when manually dispatching it. The GHCR packages may need to be made public or the production host must authenticate with a read-only GitHub token.

## Production host

1. Provision a Linux host with Docker Engine and the Compose plugin.
2. Configure HTTPS and DNS for `gas-mobil.com` at the reverse proxy / hosting layer.
3. Copy `.env.production.example` to `.env` on the host and replace all CHANGE_ME values with strong unique secrets. Do not commit or share this file.
4. Ensure the API, admin and agent public URLs are known and configure CORS origins before exposing the API.
5. Authenticate the host to GHCR if images are private.
6. Run `docker compose --env-file .env -f docker-compose.production.yml pull`.
7. Run `docker compose --env-file .env -f docker-compose.production.yml up -d`.
8. Verify `https://<API_HOST>/health`, customer ordering, COD status, driver location tracking, notifications, admin and station-agent workflows.
9. Back up the MySQL volume and test restore before production traffic.

The Compose file binds API and website ports to localhost. Put a TLS reverse proxy in front of them; do not expose MySQL publicly.

## Important database gate

The API TypeORM configuration currently has `migrationsRun: true`. Before first production startup, review all pending migrations against a backup and confirm they are safe for the existing schema. Do not point the release at live data until that review and a restore test are complete.

## Android and iOS builds

The GitHub Actions workflow `Build mobile release binaries` dispatches EAS builds for the customer app, driver app, or both.

Required setup:
- Add a repository Actions secret named `EAS_TOKEN`.
- Initialize/link both Expo projects to the intended Expo account and EAS project IDs.
- Set the production `EXPO_PUBLIC_API_URL` and any required map/provider keys in the EAS production environment.
- Configure Android app signing credentials in EAS.
- Configure Apple Developer account, bundle identifiers, distribution certificate, provisioning profile and App Store Connect access for iOS.

Build profiles:
- `preview`: internal Android APK; iOS internal device build.
- `production`: Android AAB for Play Console and iOS IPA for App Store Connect.

A successful cloud build produces downloadable artifacts in the EAS build dashboard. The workflow cannot manufacture Apple signing credentials or publish to stores without the account owner's authorization and credentials.

## Public website final content gate

Before publishing, confirm the official support phone/WhatsApp/email, actual station/service coverage, and approved Play Store/App Store links. The website intentionally avoids publishing unverified contacts or download URLs.
