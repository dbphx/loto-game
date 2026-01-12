package handlers

import (
	"net/http"
	"time"

	"my-source/loto-full/backend/internal/core"
	"my-source/loto-full/backend/internal/utils"
)

func Bingo(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user := r.URL.Query().Get("user")
	nums := r.URL.Query().Get("nums")

	core.Mu.Lock()
	defer core.Mu.Unlock()

	rm := core.Rooms[id]
	if rm == nil || rm.BingoOK {
		utils.JSON(w, map[string]bool{"ok": false})
		return
	}

	for i, q := range rm.BingoQueue {
		if q.User == user {
			rm.BingoQueue[i].Nums = nums
			rm.Paused = true
			utils.JSON(w, map[string]bool{"ok": true})
			return
		}
	}

	rm.BingoQueue = append(rm.BingoQueue, core.BingoItem{
		User: user,
		Nums: nums,
	})
	rm.Paused = true
	utils.JSON(w, map[string]bool{"ok": true})
}

func BingoResult(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	ok := r.URL.Query().Get("ok") == "1"

	core.Mu.Lock()
	defer core.Mu.Unlock()

	rm := core.Rooms[id]
	if rm == nil || len(rm.BingoQueue) == 0 {
		return
	}

	if ok {
		rm.BingoOK = true
		rm.Running = false
		rm.Paused = true
		rm.Winner = rm.BingoQueue[0].User
		rm.WinnerNums = rm.BingoQueue[0].Nums
		rm.ApprovedAt = time.Now().Unix()
		rm.BingoQueue = nil
		utils.JSON(w, map[string]bool{"ok": true})
		return
	}

	rm.BingoQueue = rm.BingoQueue[1:]
	rm.Paused = len(rm.BingoQueue) > 0
	utils.JSON(w, map[string]bool{"ok": true})
}

func RestartGame(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")

	core.Mu.Lock()
	defer core.Mu.Unlock()

	rm := core.Rooms[id]
	if rm == nil || !rm.BingoOK {
		return
	}

	rm.Running = false
	rm.Paused = false
	rm.Numbers = utils.NewNumbers()
	rm.Called = nil
	rm.Current = 0
	rm.BingoQueue = nil
	rm.BingoOK = false
	rm.Winner = ""
	rm.WinnerNums = ""
	rm.ApprovedAt = 0

	utils.JSON(w, map[string]bool{"ok": true})
}
