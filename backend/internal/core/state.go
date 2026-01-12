package core

import "sync"

var (
	Rooms = map[string]*Room{}
	Mu    sync.Mutex
)
