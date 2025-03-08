# Use official Node.js 20 Alpine image for a lightweight build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install 

# Copy all application files
COPY . .

# Build the Next.js application
RUN npm run build

# Use minimal Node.js 20 runtime for production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy only required files from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose Next.js default port
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "run", "start"]
