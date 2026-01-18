package db

import (
	"database/sql"
	"log"
)

func Init(db *sql.DB) {
	stmts := []string{

		`CREATE TABLE IF NOT EXISTS rooms (
			id TEXT PRIMARY KEY,
			admin TEXT NOT NULL,
			secret TEXT,
			created_at TIMESTAMPTZ DEFAULT now()
		);`,

		`CREATE INDEX IF NOT EXISTS idx_rooms_admin
			ON rooms (admin);`,

		`CREATE INDEX IF NOT EXISTS idx_rooms_created_at
			ON rooms (created_at);`,

		`CREATE TABLE IF NOT EXISTS room_joins (
			id SERIAL PRIMARY KEY,
			room_id TEXT NOT NULL,
			username TEXT NOT NULL,
			client_ip TEXT,
			user_agent TEXT,
			joined_at TIMESTAMPTZ DEFAULT now()
		);`,

		`CREATE INDEX IF NOT EXISTS idx_room_joins_room
			ON room_joins (room_id);`,

		`CREATE INDEX IF NOT EXISTS idx_room_joins_user
			ON room_joins (username);`,

		`CREATE INDEX IF NOT EXISTS idx_room_joins_joined_at
			ON room_joins (joined_at);`,

		`CREATE INDEX IF NOT EXISTS idx_room_joins_room_time
			ON room_joins (room_id, joined_at DESC);`,
	}

	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			log.Fatal("DB init failed:", err)
		}
	}

	log.Println("✅ DB initialized with indexes")
}
