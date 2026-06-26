# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

# The Gemini API key is inlined at build time (AI Studio / Vite convention).
# Provide it via Cloud Build substitution or `--build-arg GEMINI_API_KEY=...`.
ARG GEMINI_API_KEY=""
ENV GEMINI_API_KEY=$GEMINI_API_KEY

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY server.js ./
EXPOSE 8080
CMD ["node", "server.js"]
