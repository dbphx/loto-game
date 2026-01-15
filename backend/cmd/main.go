package main

import (
	"log"
	"math/rand"
	"net/http"
	"time"

	"my-source/loto-full/backend/internal/app"
	"my-source/loto-full/backend/internal/services"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	log.Println("Service run main new")
	rand.Seed(time.Now().UnixNano())
	go services.Cleaner()

	app.RegisterRoutes()

	log.Println("✅ Backend running at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
