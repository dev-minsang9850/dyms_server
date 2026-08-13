FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install native build tools for dependencies like bcrypt
RUN apk add --no-cache python3 make g++

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install native build tools for dependencies like bcrypt
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built files from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
