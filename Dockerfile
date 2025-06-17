#
# ------------------ Stage 1: Build Environment ------------------
#
# Use a specific Node.js version based on your .nvmrc file.
# The 'bullseye-slim' version contains the necessary build tools without being too large.
FROM node:22-bullseye-slim AS builder

# Set build-time metadata for the image.
LABEL maintainer="devops@example.com"
LABEL version="1.0"
LABEL description="Build stage for the 10xdev Astro application."

# Set the working directory within the container.
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker layer caching.
# This step will only be re-run if these files change.
COPY package.json package-lock.json ./

# Install all dependencies, including devDependencies needed for the build.
RUN npm install

# Copy the rest of the application source code into the container.
COPY . .

# Build the application for production using the script from package.json.
# This creates a 'dist' directory with the compiled, standalone server.
RUN npm run build

# After the build, remove development dependencies to reduce the size of node_modules.
RUN npm prune --production

#
# ------------------ Stage 2: Production Environment ------------------
#
# Use a lightweight, secure Alpine-based Node.js image for the final image.
# This significantly reduces the image size and potential attack surface.
FROM node:22-alpine AS production

# Set the working directory for the application.
WORKDIR /app

# Set environment variables for the production application.
# The PORT is set to 8080 as requested and can be overridden by the hosting platform.
ENV NODE_ENV=production
ENV PORT=8080

# Create a non-root user and group for running the application to enhance security.
RUN addgroup --system astro && adduser --system --ingroup astro astro

# Copy production dependencies from the builder stage.
COPY --from=builder /app/node_modules ./node_modules

# Copy only the built application from the 'builder' stage.
# The Astro Node adapter in 'standalone' mode bundles all necessary code,
# so we don't need to copy node_modules or package.json.
COPY --from=builder --chown=astro:astro /app/dist ./dist

# Switch to the non-root user for executing the application.
USER astro

# Expose the port the application will run on.
EXPOSE 8080

# Add a health check to ensure the container is running correctly.
# DigitalOcean App Platform can use this to verify application health.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD [ "wget", "-q", "-O", "/dev/null", "http://localhost:8080" ]

# Define the default command to run when the container starts.
# This executes the standalone server entrypoint.
CMD [ "node", "./dist/server/entry.mjs" ] 