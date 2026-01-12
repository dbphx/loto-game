package handlers

import (
	"net/http"
	"strconv"

	"my-source/loto-full/backend/internal/core"
	"my-source/loto-full/backend/internal/services"
	"my-source/loto-full/backend/internal/utils"
)

func StartRoom(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	secret := r.URL.Query().Get("secret")

	core.Mu.Lock()
	rm := core.Rooms[id]
	if rm == nil || rm.Running || rm.Secret != secret {
		core.Mu.Unlock()
		w.WriteHeader(403)
		return
	}

	rm.Running = true
	rm.Paused = false
	rm.Numbers = utils.NewNumbers()
	rm.Called = nil
	rm.Current = 0
	rm.BingoQueue = nil
	rm.BingoOK = false
	rm.Winner = ""
	rm.WinnerNums = ""
	rm.ApprovedAt = 0
	core.Mu.Unlock()

	go services.GameLoop(rm)
	utils.JSON(w, map[string]bool{"ok": true})
}

func SetInterval(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	v, _ := strconv.Atoi(r.URL.Query().Get("v"))

	core.Mu.Lock()
	if rm := core.Rooms[id]; rm != nil {
		rm.Interval = v
	}
	core.Mu.Unlock()

	utils.JSON(w, map[string]bool{"ok": true})
}
