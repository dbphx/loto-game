package db

import (
	"context"
	"time"
)

type RoomJoinRecord struct {
	ID        int64
	RoomID    string
	Username  string
	ClientIP  string
	UserAgent string
	JoinedAt  time.Time
}

func InsertRoomJoin(
	ctx context.Context,
	roomID string,
	username string,
	clientIP string,
	userAgent string,
) error {

	_, err := DB.ExecContext(ctx, `
		INSERT INTO room_joins (
			room_id, username, client_ip, user_agent
		) VALUES ($1, $2, $3, $4)
	`, roomID, username, clientIP, userAgent)

	return err
}

func ListRoomJoinsByRoom(
	ctx context.Context,
	roomID string,
	limit int,
) ([]RoomJoinRecord, error) {

	if limit <= 0 {
		limit = 100
	}

	rows, err := DB.QueryContext(ctx, `
		SELECT id, room_id, username, client_ip, user_agent, joined_at
		FROM room_joins
		WHERE room_id = $1
		ORDER BY joined_at DESC
		LIMIT $2
	`, roomID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var res []RoomJoinRecord
	for rows.Next() {
		var r RoomJoinRecord
		if err := rows.Scan(
			&r.ID,
			&r.RoomID,
			&r.Username,
			&r.ClientIP,
			&r.UserAgent,
			&r.JoinedAt,
		); err != nil {
			return nil, err
		}
		res = append(res, r)
	}

	return res, nil
}

func ListRoomJoinsByUser(
	ctx context.Context,
	username string,
	limit int,
) ([]RoomJoinRecord, error) {

	if limit <= 0 {
		limit = 100
	}

	rows, err := DB.QueryContext(ctx, `
		SELECT id, room_id, username, client_ip, user_agent, joined_at
		FROM room_joins
		WHERE username = $1
		ORDER BY joined_at DESC
		LIMIT $2
	`, username, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var res []RoomJoinRecord
	for rows.Next() {
		var r RoomJoinRecord
		if err := rows.Scan(
			&r.ID,
			&r.RoomID,
			&r.Username,
			&r.ClientIP,
			&r.UserAgent,
			&r.JoinedAt,
		); err != nil {
			return nil, err
		}
		res = append(res, r)
	}

	return res, nil
}

func DeleteJoinsByRoom(ctx context.Context, roomID string) error {
	_, err := DB.ExecContext(ctx, `
		DELETE FROM room_joins WHERE room_id = $1
	`, roomID)
	return err
}
