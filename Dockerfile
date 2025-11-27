# Build Stage
FROM golang:1.24-alpine AS builder

# Install git for fetching dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
WORKDIR /root/

# Copy the Pre-built binary from the previous stage
COPY --from=builder /app/campus-lost-found .
# COPY --from=builder /app/.env . 
# Note: In production, it's better to inject env vars via Docker/Jenkins, but copying .env for simplicity if it exists.
# Ideally, we should NOT copy .env and rely on environment variables passed at runtime.

# Expose port 3000 to the outside world
# Expose port 3000 to the outside world
EXPOSE 3000

# Create storage directory
RUN mkdir -p /root/storage

# Command to run the executable
# Ensure PORT env var is set to 3000

CMD ["./campus-lost-found"]
