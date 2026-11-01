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
COPY apps/website/reset-password.html /usr/share/nginx/html/public/reset-password.html
COPY apps/website/favicon.svg /usr/share/nginx/html/public/favicon.svg
COPY apps/website/favicon.png /usr/share/nginx/html/public/favicon.png
COPY apps/website/gasmobil-mark.svg /usr/share/nginx/html/public/gasmobil-mark.svg
COPY apps/website/robots.txt /usr/share/nginx/html/public/robots.txt
COPY apps/website/sitemap.xml /usr/share/nginx/html/public/sitemap.xml
COPY apps/website/favicon.svg /usr/share/nginx/html/admin/favicon.svg
COPY apps/website/favicon.png /usr/share/nginx/html/admin/favicon.png
COPY apps/website/favicon.svg /usr/share/nginx/html/agent/favicon.svg
COPY apps/website/favicon.png /usr/share/nginx/html/agent/favicon.png
COPY --from=admin-build /build/dist /usr/share/nginx/html/admin
COPY --from=agent-build /build/dist /usr/share/nginx/html/agent

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
