#!/usr/bin/env bash
set -euo pipefail

for app in apps/api apps/admin-dashboard apps/agent-app apps/mobile apps/driver-app; do
  if [[ -f "$app/package.json" ]]; then
    echo "Installing dependencies for $app"
    (cd "$app" && npm install --legacy-peer-deps)
  else
    echo "Skipping $app: package.json not found"
  fi
done
