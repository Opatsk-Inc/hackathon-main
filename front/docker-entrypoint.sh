#!/bin/sh
# Runtime env injection for the Vite SPA.
# Writes /usr/share/nginx/html/env.js on every container start so the frontend
# picks up Coolify-provided values (e.g. VITE_API_URL) without a rebuild.
# Read in the app via `window.__ENV__.VITE_API_URL`.

set -eu

TARGET=/usr/share/nginx/html/env.js

cat > "$TARGET" <<EOF
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-}"
};
EOF

echo "[frontend] env.js written: VITE_API_URL=${VITE_API_URL:-<unset>}"
