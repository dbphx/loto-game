package services

import (
	"time"

	"my-source/loto-full/backend/internal/core"
)

func GameLoop(rm *core.Room) {
	for {
		time.Sleep(time.Duration(rm.Interval) * time.Second)
		core.Mu.Lock()

		if !rm.Running {
			core.Mu.Unlock()
			return
		}
		if rm.Paused || len(rm.Numbers) == 0 {
			core.Mu.Unlock()
			continue
		}

		rm.Current = rm.Numbers[0]
		rm.Numbers = rm.Numbers[1:]
		rm.Called = append(rm.Called, rm.Current)

		core.Mu.Unlock()
	}
}
