package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"sync"
	"time"
)

/* ===================== MODELS ===================== */

type BingoItem struct {
	User string `json:"user"`
	Nums string `json:"nums"` // "1,12,25,34,90"
}

type Room struct {
	ID         string               `json:"id"`
	Admin      string               `json:"admin"`
	Users      map[string]time.Time `json:"users"`
	Numbers    []int                `json:"-"`
	Called     []int                `json:"called"`
	Current    int                  `json:"current"`
	Interval   int                  `json:"interval"`
	Running    bool                 `json:"running"`
	Paused     bool                 `json:"paused"`
	BingoQueue []BingoItem          `json:"bingoQueue"`
	BingoOK    bool                 `json:"bingoOK"` // có ít nhất 1 approve
	UpdatedAt  time.Time            `json:"-"`
}

var (
	rooms = map[string]*Room{}
	mu    sync.Mutex
)

/* ===================== HELPERS ===================== */

func jsonRes(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			return
		}
		h(w, r)
	}
}

func newNumbers() []int {
	nums := rand.Perm(90)
	for i := range nums {
		nums[i]++
	}
	return nums
}

/* ===================== ROOM APIs ===================== */

func listRooms(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	type Info struct {
		ID      string `json:"id"`
		Players int    `json:"players"`
		Running bool   `json:"running"`
	}

	var res []Info
	for _, rm := range rooms {
		res = append(res, Info{
			ID:      rm.ID,
			Players: len(rm.Users),
			Running: rm.Running,
		})
	}
	jsonRes(w, res)
}

func createRoom(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")

	mu.Lock()
	defer mu.Unlock()

	if rooms[id] != nil {
		w.WriteHeader(400)
		return
	}

	rooms[id] = &Room{
		ID:       id,
		Admin:    user,
		Users:    map[string]time.Time{user: time.Now()},
		Numbers:  newNumbers(),
		Called:   []int{},
		Interval: 5,
	}

	jsonRes(w, map[string]bool{"ok": true})
}

func joinRoom(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")

	mu.Lock()
	defer mu.Unlock()

	if rm := rooms[id]; rm != nil {
		rm.Users[user] = time.Now()
	}

	jsonRes(w, map[string]bool{"ok": true})
}

func leaveRoom(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")

	mu.Lock()
	defer mu.Unlock()

	rm := rooms[id]
	if rm == nil {
		return
	}

	delete(rm.Users, user)
	if user == rm.Admin {
		delete(rooms, id)
	}

	jsonRes(w, map[string]bool{"ok": true})
}

func roomState(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")

	mu.Lock()
	defer mu.Unlock()

	jsonRes(w, rooms[id])
}

func pingRoom(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")

	mu.Lock()
	defer mu.Unlock()

	if rm := rooms[id]; rm != nil {
		rm.Users[user] = time.Now()
	}

	jsonRes(w, map[string]bool{"ok": true})
}

/* ===================== GAME ===================== */

func startRoom(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")

	mu.Lock()
	rm := rooms[id]
	if rm == nil || rm.Running {
		mu.Unlock()
		return
	}

	rm.Running = true
	rm.Paused = false
	rm.Numbers = newNumbers()
	rm.Called = []int{}
	rm.Current = 0
	rm.BingoQueue = []BingoItem{}
	rm.BingoOK = false
	mu.Unlock()

	go func(rm *Room) {
		for {
			time.Sleep(time.Duration(rm.Interval) * time.Second)

			mu.Lock()

			// 🔥 FIX QUAN TRỌNG: dừng goroutine thật sự
			if !rm.Running {
				mu.Unlock()
				return
			}

			if rm.Paused || len(rm.Numbers) == 0 {
				mu.Unlock()
				continue
			}

			rm.Current = rm.Numbers[0]
			rm.Numbers = rm.Numbers[1:]
			rm.Called = append(rm.Called, rm.Current)
			mu.Unlock()
		}
	}(rm)

	jsonRes(w, map[string]bool{"ok": true})
}

func setInterval(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	v, _ := strconv.Atoi(r.URL.Query().Get("v"))

	mu.Lock()
	if rm := rooms[id]; rm != nil {
		rm.Interval = v
	}
	mu.Unlock()

	jsonRes(w, map[string]bool{"ok": true})
}

/* ===================== BINGO ===================== */

func bingo(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")
	numsStr := r.URL.Query().Get("nums")

	mu.Lock()
	defer mu.Unlock()

	rm := rooms[id]
	if rm == nil {
		jsonRes(w, map[string]bool{"ok": false})
		return
	}

	found := false
	for i, q := range rm.BingoQueue {
		if q.User == user {
			rm.BingoQueue[i].Nums = numsStr
			found = true
			break
		}
	}
	if !found {
		rm.BingoQueue = append(rm.BingoQueue, BingoItem{
			User: user,
			Nums: numsStr,
		})
	}

	rm.Paused = len(rm.BingoQueue) > 0
	jsonRes(w, map[string]bool{"ok": true})
}

func bingoResult(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	ok := r.URL.Query().Get("ok") == "1"

	mu.Lock()
	defer mu.Unlock()

	rm := rooms[id]
	if rm == nil || len(rm.BingoQueue) == 0 {
		return
	}

	rm.BingoQueue = rm.BingoQueue[1:]

	if ok {
		rm.BingoOK = true
	}

	rm.Paused = len(rm.BingoQueue) > 0
	jsonRes(w, map[string]bool{"ok": true})
}

func restartGame(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")

	mu.Lock()
	defer mu.Unlock()

	rm := rooms[id]
	if rm == nil || !rm.BingoOK {
		return
	}

	rm.Running = false
	rm.Paused = false
	rm.Numbers = nil
	rm.Called = nil
	rm.Current = 0
	rm.BingoQueue = nil
	rm.BingoOK = false

	jsonRes(w, map[string]bool{"ok": true})
}

func resumeGame(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")

	mu.Lock()
	defer mu.Unlock()

	rm := rooms[id]
	if rm == nil || rm.BingoOK || len(rm.BingoQueue) != 0 {
		return
	}

	rm.Paused = false
	jsonRes(w, map[string]bool{"ok": true})
}

/* ===================== CLEANER ===================== */

func cleaner() {
	for {
		time.Sleep(5 * time.Second)

		mu.Lock()
		for id, rm := range rooms {
			for u, t := range rm.Users {
				if time.Since(t) > 15*time.Second {
					delete(rm.Users, u)
					if u == rm.Admin {
						delete(rooms, id)
						break
					}
				}
			}
		}
		mu.Unlock()
	}
}

/* ===================== MAIN ===================== */

func main() {
	rand.Seed(time.Now().UnixNano())
	go cleaner()

	http.HandleFunc("/rooms", withCORS(listRooms))
	http.HandleFunc("/rooms/create", withCORS(createRoom))
	http.HandleFunc("/rooms/join", withCORS(joinRoom))
	http.HandleFunc("/rooms/leave", withCORS(leaveRoom))
	http.HandleFunc("/rooms/state", withCORS(roomState))
	http.HandleFunc("/rooms/ping", withCORS(pingRoom))

	http.HandleFunc("/rooms/start", withCORS(startRoom))
	http.HandleFunc("/rooms/interval", withCORS(setInterval))

	http.HandleFunc("/rooms/bingo", withCORS(bingo))
	http.HandleFunc("/rooms/bingo/result", withCORS(bingoResult))
	http.HandleFunc("/rooms/restart", withCORS(restartGame))
	http.HandleFunc("/rooms/resume", withCORS(resumeGame))

	log.Println("✅ Backend running at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
