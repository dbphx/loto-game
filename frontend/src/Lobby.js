import { useEffect, useState } from "react";
const API = "http://localhost:8080";

export default function Lobby({ user, onJoin }) {
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");

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
      `${API}/rooms/create?id=${roomId}&user=${user}`,
      { method: "POST" }
    );
    if (!res.ok) return alert("Room exists");
    onJoin(roomId);
  };

  const join = async (id) => {
    await fetch(`${API}/rooms/join?id=${id}&user=${user}`, {
      method: "POST",
    });
    onJoin(id);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎱 Lobby</h2>

      <input value={roomId} onChange={(e) => setRoomId(e.target.value)} />
      <button onClick={create}>Create</button>

      <hr />

      {rooms.map((r) => (
        <div key={r.id}>
          <b>{r.id}</b> 👥 {r.users}
          <button onClick={() => join(r.id)}>Join</button>
        </div>
      ))}
    </div>
  );
}
