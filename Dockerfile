FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=https://shisha-guid-api.api-api-api.com/api/v1
ARG VITE_UPLOAD_PUBLIC_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_UPLOAD_PUBLIC_URL=$VITE_UPLOAD_PUBLIC_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.mjs ./server.mjs
EXPOSE 80
CMD ["node", "server.mjs"]
