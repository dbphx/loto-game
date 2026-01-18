package services

import (
	"time"

	"my-source/loto-full/backend/internal/core"
	"my-source/loto-full/backend/internal/utils"
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

		if rm.NextForce > 0 && rm.NextForce <= 90 {
			if !utils.ContainsInt(rm.Called, rm.NextForce) {
				rm.Current = rm.NextForce
				rm.Called = append(rm.Called, rm.Current)
				rm.Numbers = utils.RemoveInt(rm.Numbers, rm.NextForce)
				core.Mu.Unlock()
				continue
			}

			rm.NextForce = 0
		}

		if len(rm.Numbers) > 0 {
			rm.Current = rm.Numbers[0]
			rm.Numbers = rm.Numbers[1:]
			rm.Called = append(rm.Called, rm.Current)
		}

		core.Mu.Unlock()
	}
}
