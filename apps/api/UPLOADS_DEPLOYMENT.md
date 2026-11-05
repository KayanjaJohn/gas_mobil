# GasMobil API product image storage

Product images are uploaded to `UPLOAD_DIR/products` and served from both:

- `/api/uploads/products/<filename>`
- `/uploads/products/<filename>`

The API container defaults to `UPLOAD_DIR=/app/uploads`.

## Required production deployment setting

The API container must have a **persistent volume** mounted at exactly:

`/app/uploads`

Do not mount this volume on the frontend, admin, or agent containers. It belongs on the API service because that service receives uploads and serves image files.

For a Docker Compose deployment, the repository's `docker-compose.yml` now declares the named volume `gas_mobil_uploads` at `/app/uploads`.

For a platform-managed Docker deployment, open the **gas-mobil-api** service's persistent storage / volumes settings and add:

| Setting | Value |
| --- | --- |
| Volume name | `gasmobil-api-uploads` |
| Mount path / destination | `/app/uploads` |
| Storage | Persistent volume (not container ephemeral storage) |

Keep the API environment variable:

`UPLOAD_DIR=/app/uploads`

Also set:

`API_PUBLIC_URL=https://api.gas-mobil.com`

Use the API's public hostname, without an extra `/api` suffix. The upload controller adds the `/api/uploads/products` path itself.

## Verification after deployment

1. Upload a new JPG, PNG or WebP product image in the admin portal.
2. Confirm the returned `imageUrl` begins with `https://api.gas-mobil.com/api/uploads/products/`.
3. Open that exact URL in a private browser window. It must return the image without requiring a login.
4. Confirm the same image appears in admin and agent product lists.
5. Restart or redeploy the API container.
6. Open the same URL again. It must still return the image.

If step 5 fails, the persistent volume is not mounted to the API container at `/app/uploads`.

Existing images that were stored only in an old container's writable layer may already have been lost when that container was replaced. Re-upload those images after the persistent volume is mounted.
