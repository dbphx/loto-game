package db

import (
	"context"
	"time"
)

type RoomRecord struct {
	ID        string
	Admin     string
	Secret    string
	CreatedAt time.Time
}

func CreateRoom(ctx context.Context, id, admin, secret string) error {
	_, err := DB.ExecContext(ctx, `
		INSERT INTO rooms (id, admin, secret)
		VALUES ($1, $2, $3)
		ON CONFLICT (id) DO NOTHING
	`, id, admin, secret)

	return err
}

func GetRoom(ctx context.Context, id string) (*RoomRecord, error) {
	row := DB.QueryRowContext(ctx, `
		SELECT id, admin, secret, created_at
		FROM rooms
		WHERE id = $1
	`, id)

	var r RoomRecord
	err := row.Scan(&r.ID, &r.Admin, &r.Secret, &r.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &r, nil
}

func ListRooms(ctx context.Context, limit int) ([]RoomRecord, error) {
	if limit <= 0 {
		limit = 50
	}

	rows, err := DB.QueryContext(ctx, `
		SELECT id, admin, secret, created_at
		FROM rooms
		ORDER BY created_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var res []RoomRecord
	for rows.Next() {
		var r RoomRecord
		if err := rows.Scan(&r.ID, &r.Admin, &r.Secret, &r.CreatedAt); err != nil {
			return nil, err
		}
		res = append(res, r)
	}

	return res, nil
}

func DeleteRoom(ctx context.Context, id string) error {
	_, err := DB.ExecContext(ctx, `
		DELETE FROM rooms WHERE id = $1
	`, id)
	return err
}
