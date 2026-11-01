# One-time production administrator bootstrap

The managed production database may have its schema but no administrator account yet. This command provisions exactly one initial administrator and never overwrites an existing user or administrator.

## 1. Temporarily add runtime-only variables to the API service

Set all four variables as **Runtime only** in Twelvinks:

- `BOOTSTRAP_ADMIN_NAME`: administrator's display name
- `BOOTSTRAP_ADMIN_EMAIL`: administrator's sign-in email
- `BOOTSTRAP_ADMIN_PHONE`: administrator's phone number
- `BOOTSTRAP_ADMIN_PASSWORD`: a unique password of at least 12 characters

Do not put these values in GitHub, the Dockerfile, build arguments, or chat.

## 2. Run the one-time command in the API container

From the API container's working directory (`/app`), run:

```bash
npm run bootstrap:admin
```

Expected success message:

```
Initial administrator created successfully for <email>.
```

The command fails closed if an administrator already exists or the email/phone is already assigned. It does not drop, reset, or modify any existing users.

## 3. Remove the temporary variables

After successful execution, remove all four `BOOTSTRAP_ADMIN_*` variables from Twelvinks and restart the API service.

Then sign in at `https://admin.gas-mobil.com/login`.

The administrator can create stations and station agents, then create drivers from the Drivers page. Each account must receive a unique password and credentials should be shared securely.
