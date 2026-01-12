package services

import (
	"time"

	"my-source/loto-full/backend/internal/core"
)

func Cleaner() {
	for {
		time.Sleep(5 * time.Second)
		core.Mu.Lock()

		for id, rm := range core.Rooms {
			for u, t := range rm.Users {
				if time.Since(t) > 60*time.Second {
					delete(rm.Users, u)
					if u == rm.Admin {
						delete(core.Rooms, id)
						break
					}
				}
			}
		}

		core.Mu.Unlock()
	}
}
