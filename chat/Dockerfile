FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o chat-backend

FROM alpine:latest
WORKDIR /app

COPY --from=builder /app/chat-backend .

EXPOSE 8081
CMD ["./chat-backend"]
