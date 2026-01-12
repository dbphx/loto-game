package handlers

import (
	"net/http"
	"strconv"

	"my-source/loto-full/backend/internal/core"
	"my-source/loto-full/backend/internal/utils"
)

func getLotoID(r *http.Request) int {
	if v := r.URL.Query().Get("n"); v != "" {
		id, _ := strconv.Atoi(v)
		return id
	}
	id, _ := strconv.Atoi(r.URL.Query().Get("loto"))
	return id
}

func SelectLoto(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")
	lotoID := getLotoID(r)

	core.Mu.Lock()
	defer core.Mu.Unlock()

	rm := core.Rooms[id]
	if rm == nil {
		w.WriteHeader(404)
		return
	}

	if owner, ok := rm.Lotos[lotoID]; ok && owner != user {
		w.WriteHeader(403)
		return
	}

	rm.Lotos[lotoID] = user
	utils.JSON(w, map[string]bool{"ok": true})
}

func UnselectLoto(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")
	lotoID := getLotoID(r)

	core.Mu.Lock()
	defer core.Mu.Unlock()

	if rm := core.Rooms[id]; rm != nil {
		if rm.Lotos[lotoID] == user {
			delete(rm.Lotos, lotoID)
		}
	}

	utils.JSON(w, map[string]bool{"ok": true})
}
