package app

import (
	"net/http"

	handlers "my-source/loto-full/backend/internal/handler"
	utils "my-source/loto-full/backend/internal/utils"
)

func RegisterRoutes() {
	http.HandleFunc("/rooms", utils.WithCORS(handlers.ListRooms))
	http.HandleFunc("/rooms/create", utils.WithCORS(handlers.CreateRoom))
	http.HandleFunc("/rooms/join", utils.WithCORS(handlers.JoinRoom))
	http.HandleFunc("/rooms/leave", utils.WithCORS(handlers.LeaveRoom))
	http.HandleFunc("/rooms/state", utils.WithCORS(handlers.RoomState))
	http.HandleFunc("/rooms/ping", utils.WithCORS(handlers.PingRoom))

	http.HandleFunc("/rooms/start", utils.WithCORS(handlers.StartRoom))
	http.HandleFunc("/rooms/interval", utils.WithCORS(handlers.SetInterval))

	http.HandleFunc("/rooms/bingo", utils.WithCORS(handlers.Bingo))
	http.HandleFunc("/rooms/bingo/result", utils.WithCORS(handlers.BingoResult))
	http.HandleFunc("/rooms/restart", utils.WithCORS(handlers.RestartGame))

	http.HandleFunc("/rooms/loto/select", utils.WithCORS(handlers.SelectLoto))
	http.HandleFunc("/rooms/loto/unselect", utils.WithCORS(handlers.UnselectLoto))

	http.HandleFunc("/rooms/force-number", utils.WithCORS(handlers.ForceNumberHandler))
}
