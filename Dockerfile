# --- Build stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Build args for Vite (baked into client at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Install root deps
COPY package.json ./
RUN npm install

# Build client
COPY client/package.json client/
RUN cd client && npm install

COPY client/ client/
RUN cd client && npm run build

# Install server deps
COPY server/package.json server/
RUN cd server && npm install --omit=dev

# --- Production stage ---
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy server
COPY --from=builder /app/server /app/server

# Copy built client into server/public for static serving
COPY --from=builder /app/client/dist /app/server/public

# Copy migrations
COPY migrations/ /app/migrations/
COPY scripts/ /app/scripts/

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["node", "server/src/index.js"]
