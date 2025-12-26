import { useEffect, useState } from "react";
const API = "http://localhost:8080";

export default function Lobby({ user, onJoin }) {
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [secret, setSecret] = useState("");

  const load = async () => {
    const res = await fetch(`${API}/rooms`);
    const data = await res.json();
    setRooms(data || []);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);

  const create = async () => {
    if (!roomId) return;
    const res = await fetch(
      `${API}/rooms/create?id=${roomId}&user=${user}&secret=${secret}`,
      { method: "POST" }
    );
    if (!res.ok) return alert("Room exists");
    onJoin({ id: roomId, secret });
  };

  const join = async (id) => {
    const s = prompt("Enter room secret:");
    const res = await fetch(
      `${API}/rooms/join?id=${id}&user=${user}&secret=${s}`,
      { method: "POST" }
    );
    if (!res.ok) return alert("❌ Wrong secret");
    onJoin({ id, secret: s });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        padding: 40,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>🎱 LOTO LOBBY</h2>

        {/* CREATE ROOM */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <h4>Create Room</h4>
          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <input
            placeholder="Secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <button
            onClick={create}
            style={{
              width: "100%",
              padding: 10,
              background: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
            }}
          >
            ➕ Create Room
          </button>
        </div>

        {/* ROOM LIST */}
        <div>
          <h4>Available Rooms</h4>
          {rooms.length === 0 && (
            <p style={{ color: "#777" }}>No rooms available</p>
          )}
          {rooms.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: 10,
                marginBottom: 8,
              }}
            >
              <div>
                <b>{r.id}</b>
                <div style={{ fontSize: 12, color: "#666" }}>
                  👥 {r.players} | {r.running ? "Running" : "Waiting"}
                </div>
              </div>
              <button
                onClick={() => join(r.id)}
                style={{
                  padding: "6px 14px",
                  background: "#2196f3",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                Join
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
