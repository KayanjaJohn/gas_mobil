# Build the admin dashboard
FROM node:20-alpine AS admin-build
WORKDIR /build
COPY apps/admin-dashboard/package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY apps/admin-dashboard/ ./
ARG VITE_API_URL=https://api.gas-mobil.com/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Build the station agent portal
FROM node:20-alpine AS agent-build
WORKDIR /build
COPY apps/agent-app/package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY apps/agent-app/ ./
ARG VITE_API_URL=https://api.gas-mobil.com/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Serve all three web experiences from the existing frontend app slot
FROM nginx:1.27-alpine AS production
COPY nginx-sites.conf /etc/nginx/conf.d/default.conf
COPY apps/website/index.html /usr/share/nginx/html/public/index.html
COPY --from=admin-build /build/dist /usr/share/nginx/html/admin
COPY --from=agent-build /build/dist /usr/share/nginx/html/agent

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
