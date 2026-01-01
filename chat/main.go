package main

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

/* ===================== MODELS ===================== */

type ChatMessage struct {
	Room string `json:"room"`
	User string `json:"user"`
	Type string `json:"type"` // text | image
	Text string `json:"text"` // text OR image url
	Ts   int64  `json:"ts"`
}

type ChatImage struct {
	Data []byte
	Mime string
	Time int64
}

/* ===================== STORAGE (MEM) ===================== */

var (
	mu    sync.Mutex
	rooms = make(map[string][]ChatMessage)

	imgMu      sync.Mutex
	chatImages = make(map[string]ChatImage)
)

/* ===================== CORS ===================== */

func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			return
		}
		h(w, r)
	}
}

/* ===================== CHAT TEXT ===================== */

func sendChat(w http.ResponseWriter, r *http.Request) {
	var msg ChatMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	msg.Type = "text"
	msg.Ts = time.Now().Unix()

	mu.Lock()
	list := rooms[msg.Room]
	list = append(list, msg)

	if len(list) > 50 {
		list = list[len(list)-50:]
	}
	rooms[msg.Room] = list
	mu.Unlock()

	log.Printf("💬 TEXT [%s] %s: %s\n", msg.Room, msg.User, msg.Text)
	json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

/* ===================== CHAT IMAGE ===================== */

type ImagePayload struct {
	Room   string `json:"room"`
	User   string `json:"user"`
	Base64 string `json:"base64"` // data:image/png;base64,...
}

func sendImage(w http.ResponseWriter, r *http.Request) {
	var p ImagePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if !strings.Contains(p.Base64, ",") {
		http.Error(w, "invalid image", 400)
		return
	}

	parts := strings.SplitN(p.Base64, ",", 2)
	meta := parts[0]
	data := parts[1]

	mime := "image/png"
	if strings.Contains(meta, "image/jpeg") {
		mime = "image/jpeg"
	}

	bytes, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		http.Error(w, "decode error", 400)
		return
	}

	// 🔥 LIMIT SIZE 2MB
	if len(bytes) > 5*1024*1024 {
		http.Error(w, "image too large", 400)
		return
	}

	id := time.Now().Format("20060102150405") + "_" + p.User

	imgMu.Lock()
	chatImages[id] = ChatImage{
		Data: bytes,
		Mime: mime,
		Time: time.Now().Unix(),
	}
	imgMu.Unlock()

	msg := ChatMessage{
		Room: p.Room,
		User: p.User,
		Type: "image",
		Text: "/chat/image/" + id,
		Ts:   time.Now().Unix(),
	}

	mu.Lock()
	rooms[p.Room] = append(rooms[p.Room], msg)
	mu.Unlock()

	log.Printf("🖼️ IMAGE [%s] %s\n", p.Room, p.User)
	json.NewEncoder(w).Encode(map[string]string{"url": msg.Text})
}

/* ===================== SERVE IMAGE ===================== */

func serveImage(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/chat/image/")

	imgMu.Lock()
	img, ok := chatImages[id]
	imgMu.Unlock()

	if !ok {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", img.Mime)
	w.Write(img.Data)
}

/* ===================== LIST CHAT ===================== */

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

/* ===================== DELETE ROOM ===================== */

func deleteRoom(w http.ResponseWriter, r *http.Request) {
	room := r.URL.Query().Get("room")
	if room == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	mu.Lock()
	delete(rooms, room)
	mu.Unlock()

	log.Printf("🗑️ CHAT ROOM DESTROYED: %s\n", room)
	json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

/* ===================== CLEANUP ===================== */

func startCleanup() {
	go func() {
		for {
			time.Sleep(1 * time.Minute)
			now := time.Now().Unix()

			imgMu.Lock()
			for id, img := range chatImages {
				if now-img.Time > 600 {
					delete(chatImages, id)
				}
			}
			imgMu.Unlock()
		}
	}()
}

/* ===================== MAIN ===================== */

func main() {
	startCleanup()

	http.HandleFunc("/chat/send", withCORS(sendChat))
	http.HandleFunc("/chat/image/send", withCORS(sendImage))
	http.HandleFunc("/chat/image/", withCORS(serveImage))
	http.HandleFunc("/chat/list", withCORS(listChat))
	http.HandleFunc("/chat/room", withCORS(deleteRoom))

	log.Println("💬 Chat server (TEXT + IMAGE | MEM) :8081")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
