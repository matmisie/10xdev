FROM node:22-bullseye-slim AS builder
WORKDIR /app
ENV SUPABASE_URL="TEMP"
ENV SUPABASE_KEY="TEMP"
ENV OPENROUTER_API_KEY="TEMP"
ENV DEPLOY_TO_CF="false"
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
RUN addgroup --system astro && adduser --system --ingroup astro astro
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=astro:astro /app/dist ./dist
USER astro
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD [ "wget", "-q", "-O", "/dev/null", "http://localhost:8080" ]
CMD [ "node", "./dist/server/entry.mjs" ]
