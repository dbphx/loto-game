package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"my-source/loto-full/backend/internal/core"
)

var AdminSecret = os.Getenv("ADMIN_SECRET")

type ForceNumberRequest struct {
	ID     string `json:"id"`
	Num    int    `json:"num"`
	Secret string `json:"secret"`
}

func ForceNumberHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if AdminSecret == "" {
		http.Error(w, "admin secret not configured", http.StatusInternalServerError)
		return
	}

	var req ForceNumberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if req.ID == "" || req.Num <= 0 || req.Secret == "" {
		http.Error(w, "missing or invalid params", http.StatusBadRequest)
		return
	}

	if req.Secret != AdminSecret {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	core.Mu.Lock()
	defer core.Mu.Unlock()

	room, ok := core.Rooms[req.ID]
	if !ok {
		http.Error(w, "room not found", http.StatusNotFound)
		return
	}

	room.NextForce = req.Num
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("ok"))
}
