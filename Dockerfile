FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=https://shisha-guid-api.api-api-api.com/api/v1
ARG VITE_SSR_API_URL=http://backend.shisha-guid.svc.cluster.local/api/v1
ARG VITE_UPLOAD_PUBLIC_URL
ARG VITE_GOOGLE_CLIENT_ID=838081828286-6hn0jphbj636tf7p3q83c37dg9ltnfms.apps.googleusercontent.com
ARG VITE_PUBLIC_SITE_URL=https://shisha-guid.api-api-api.com
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SSR_API_URL=$VITE_SSR_API_URL
ENV VITE_UPLOAD_PUBLIC_URL=$VITE_UPLOAD_PUBLIC_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.mjs ./server.mjs
ARG APP_VERSION
ARG BUILD_DATE
ARG VCS_REF
ARG PUBLIC_SITE_URL=https://shisha-guid.api-api-api.com
ENV APP_VERSION=$APP_VERSION
ENV BUILD_DATE=$BUILD_DATE
ENV VCS_REF=$VCS_REF
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
EXPOSE 80
CMD ["node", "server.mjs"]
