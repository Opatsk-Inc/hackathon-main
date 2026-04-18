# ─── Stage 1: Build Vite app ─────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Skip `tsc -b` from package.json's build script — Vite compiles TS via esbuild.
# Keep `npm run typecheck` / `npm run build` for local dev & CI; don't block deploy on type errors.
RUN npx vite build

# ─── Stage 2: Serve via nginx with runtime env injection ─────────────────────
FROM nginx:1.27-alpine

# SPA routing + long-cache for hashed assets
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Built Vite app
COPY --from=builder /app/dist /usr/share/nginx/html

# Runtime env injector — writes /usr/share/nginx/html/env.js on every start so
# window.__ENV__.VITE_API_URL is available to the app without a rebuild.
COPY docker-entrypoint.sh /docker-entrypoint.d/40-write-env.sh
RUN chmod +x /docker-entrypoint.d/40-write-env.sh

EXPOSE 80
