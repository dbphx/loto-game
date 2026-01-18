package handlers

import (
	"net/http"
	"time"

	"my-source/loto-full/backend/internal/core"
	"my-source/loto-full/backend/internal/db"
	"my-source/loto-full/backend/internal/utils"
)

func ListRooms(w http.ResponseWriter, r *http.Request) {
	core.Mu.Lock()
	defer core.Mu.Unlock()

	type Info struct {
		ID      string `json:"id"`
		Players int    `json:"players"`
		Running bool   `json:"running"`
	}

	res := []Info{}
	for _, rm := range core.Rooms {
		res = append(res, Info{
			ID:      rm.ID,
			Players: len(rm.Users),
			Running: rm.Running,
		})
	}

	utils.JSON(w, res)
}

func CreateRoom(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")
	secret := r.URL.Query().Get("secret")

	if id == "" || user == "" || secret == "" {
		http.Error(w, "missing params", http.StatusBadRequest)
		return
	}

	core.Mu.Lock()
	if core.Rooms[id] != nil {
		core.Mu.Unlock()
		http.Error(w, "room exists", http.StatusBadRequest)
		return
	}

	core.Rooms[id] = &core.Room{
		ID:       id,
		Admin:    user,
		Secret:   secret,
		Users:    map[string]time.Time{user: time.Now()},
		Numbers:  utils.NewNumbers(),
		Called:   []int{},
		Interval: 5,
		Lotos:    map[int]string{},
	}
	core.Mu.Unlock()
	_ = db.CreateRoom(
		r.Context(),
		id,
		user,
		secret,
	)

	_ = db.InsertRoomJoin(
		r.Context(),
		id,
		user,
		utils.GetClientIP(r),
		r.UserAgent(),
	)

	utils.JSON(w, map[string]bool{"ok": true})
}

func JoinRoom(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")
	secret := r.URL.Query().Get("secret")

	if id == "" || user == "" || secret == "" {
		http.Error(w, "missing params", http.StatusBadRequest)
		return
	}

	core.Mu.Lock()
	rm := core.Rooms[id]
	if rm == nil || rm.Secret != secret {
		core.Mu.Unlock()
		http.Error(w, "unauthorized", http.StatusForbidden)
		return
	}

	rm.Users[user] = time.Now()
	core.Mu.Unlock()

	_ = db.InsertRoomJoin(
		r.Context(),
		id,
		user,
		utils.GetClientIP(r),
		r.UserAgent(),
	)

	utils.JSON(w, map[string]bool{"ok": true})
}

func LeaveRoom(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")

	core.Mu.Lock()
	defer core.Mu.Unlock()

	rm := core.Rooms[id]
	if rm == nil {
		return
	}

	delete(rm.Users, user)

	for k, v := range rm.Lotos {
		if v == user {
			delete(rm.Lotos, k)
		}
	}

	if user == rm.Admin {
		delete(core.Rooms, id)
	}

	utils.JSON(w, map[string]bool{"ok": true})
}

func RoomState(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")

	core.Mu.Lock()
	defer core.Mu.Unlock()

	utils.JSON(w, core.Rooms[id])
}

func PingRoom(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")

	core.Mu.Lock()
	defer core.Mu.Unlock()

	if rm := core.Rooms[id]; rm != nil {
		rm.Users[user] = time.Now()
	}

	utils.JSON(w, map[string]bool{"ok": true})
}
