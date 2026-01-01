FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o loto-backend

FROM alpine:latest
WORKDIR /app

COPY --from=builder /app/loto-backend .

EXPOSE 8080
CMD ["./loto-backend"]
