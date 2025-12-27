package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

type ChatMessage struct {
	Room string `json:"room"`
	User string `json:"user"`
	Text string `json:"text"`
	Ts   int64  `json:"ts"`
}

var (
	mu    sync.Mutex
	rooms = make(map[string][]ChatMessage)
)

func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			return
		}
		h(w, r)
	}
}

func sendChat(w http.ResponseWriter, r *http.Request) {
	var msg ChatMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		w.WriteHeader(400)
		return
	}

	msg.Ts = time.Now().Unix()

	mu.Lock()
	list := rooms[msg.Room]
	list = append(list, msg)

	// giữ tối đa 50 tin
	if len(list) > 50 {
		list = list[len(list)-50:]
	}

	rooms[msg.Room] = list
	mu.Unlock()

	log.Printf("CHAT [%s] %s: %s\n", msg.Room, msg.User, msg.Text)
	json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

func listChat(w http.ResponseWriter, r *http.Request) {
	room := r.URL.Query().Get("room")
	if room == "" {
		json.NewEncoder(w).Encode([]ChatMessage{})
		return
	}

	mu.Lock()
	list := rooms[room]
	mu.Unlock()

	json.NewEncoder(w).Encode(list)
}

func main() {
	http.HandleFunc("/chat/send", withCORS(sendChat))
	http.HandleFunc("/chat/list", withCORS(listChat))

	log.Println("💬 Chat server (MEM) running at :8081")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
