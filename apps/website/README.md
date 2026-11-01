# GasMobil public website

Static, responsive official landing page for GasMobil Uganda.

## Local preview
```bash
docker build -t gasmobil-website:local .
docker run --rm -p 8080:80 gasmobil-website:local
```
Open http://localhost:8080.

## Production
Build and publish this image through the repository GitHub Actions workflow. Put it behind HTTPS at `gas-mobil.com` using your hosting provider's domain/DNS configuration.

Before launch, confirm the support email, official phone/WhatsApp, actual service coverage, and approved Play Store/App Store links. The page intentionally does not publish unapproved app links or unverified claims.