import { useEffect, useRef, useState } from "react";

const API = process.env.REACT_APP_LOTO_API || "http://localhost:8080";

/* ================= RANDOM USER SUFFIX ================= */
const randomSuffix = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let str = "";
  for (let i = 0; i < 6; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
};

export default function Lobby({
  onJoin,
  user,
  displayName,
  setDisplayName,
  setUser,
}) {
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [secret, setSecret] = useState("");

  /* ===== random prefix chỉ tạo 1 lần ===== */
  const randomRef = useRef(user?.split("-")[0] || randomSuffix());

  /* ===== update user khi đổi displayName ===== */
  useEffect(() => {
    const name = displayName.trim() || "Guest";
    const newUser = `${randomRef.current}-${name}`;

    if (newUser !== user) {
      setUser(newUser);
      localStorage.setItem("loto_user", newUser);
      localStorage.setItem("loto_displayName", name);
    }
  }, [displayName]); // ❗ không thêm user

  /* ================= LOAD ROOMS ================= */
  const loadRooms = async () => {
    try {
      const res = await fetch(`${API}/rooms`);
      const data = await res.json();
      setRooms(data || []);
    } catch (e) {
      console.error("loadRooms error:", e);
    }
  };

  useEffect(() => {
    loadRooms();
    const t = setInterval(loadRooms, 2000);
    return () => clearInterval(t);
  }, []);

  /* ================= CREATE ROOM ================= */
  const createRoom = async () => {
    if (!roomId.trim() || !secret.trim())
      return alert("Nhập Room ID và Secret");
    if (!displayName.trim())
      return alert("Tên hiển thị không hợp lệ");

    const res = await fetch(
      `${API}/rooms/create?id=${roomId}&user=${user}&secret=${secret}`,
      { method: "POST" }
    );

    if (!res.ok) return alert("Room already exists");

    onJoin({ id: roomId, secret, user });
  };

  /* ================= JOIN ROOM ================= */
  const joinRoom = async (id) => {
    const s = prompt("Enter room secret:");
    if (!s) return;

    const res = await fetch(
      `${API}/rooms/join?id=${id}&user=${user}&secret=${s}`,
      { method: "POST" }
    );

    if (!res.ok) return alert("❌ Wrong secret");

    onJoin({ id, secret: s, user });
  };

  /* ================= UI STYLES ================= */
  const inputStyle = {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
  };

  const buttonStyle = {
    width: "100%",
    padding: 12,
    background: "#c62828",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 14,
  };

  return (
    /* ================= FULL BACKGROUND ================= */
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundImage: "url(/tet.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* ================= LOBBY FORM ================= */}
      <div
        style={{
          width: 600,
          background: "rgba(255,248,220,0.92)",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#8B0000" }}>
          🎊 LOTO TẾT VIỆT 🎊
        </h2>

        {/* DISPLAY NAME */}
        <input
          placeholder="Tên hiển thị"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={inputStyle}
        />

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
            style={inputStyle}
          />

          <input
            placeholder="Secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={inputStyle}
          />

          <button onClick={createRoom} style={buttonStyle}>
            🧧 Create Room
          </button>
        </div>

        {/* ROOM LIST */}
        <div>
          <h4>Available Rooms</h4>

          {rooms.length === 0 && (
            <p style={{ color: "#777" }}>No rooms available</p>
          )}

          {[...rooms]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((r) => (
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
                  background: "#fff",
                }}
              >
                <div>
                  <b>{r.id}</b>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    👥 {r.players} | {r.running ? "Running" : "Waiting"}
                  </div>
                </div>

                <button
                  onClick={() => joinRoom(r.id)}
                  style={{
                    padding: "8px 16px",
                    background: "#2196f3",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
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
