FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy source code first
COPY . .

# Install dependencies and tidy
RUN go mod tidy

# Build the application
RUN go build -o main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"] 