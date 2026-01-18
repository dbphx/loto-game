package core

import "time"

type BingoItem struct {
	User string `json:"user"`
	Nums string `json:"nums"`
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
	BingoOK    bool                 `json:"bingoOK"`
	Winner     string               `json:"winner"`
	WinnerNums string               `json:"winnerNums"`
	ApprovedAt int64                `json:"approvedAt"`

	Lotos  map[int]string `json:"lotos"`
	Secret string         `json:"-"`

	NextForce int `json:"-"`
}
