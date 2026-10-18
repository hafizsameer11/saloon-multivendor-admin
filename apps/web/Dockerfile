# Dokploy / production — public website (React + Vite → nginx)
# Build context: repository root (must contain apps/web + packages/shared)
# Dokploy → Build path: .  |  Dockerfile: apps/web/Dockerfile

FROM node:20-alpine AS build
WORKDIR /app

COPY packages/shared ./packages/shared
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/

WORKDIR /app/apps/web
RUN npm ci

COPY apps/web ./

ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build -- --base=/

FROM nginx:1.27-alpine AS runtime
COPY apps/web/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
