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
    <div style={{ padding: 20 }}>
      <h2>🎱 Lobby</h2>

      <input placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
      <input placeholder="Secret" value={secret} onChange={(e) => setSecret(e.target.value)} />
      <button onClick={create}>Create</button>

      <hr />

      {rooms.map((r) => (
        <div key={r.id}>
          <b>{r.id}</b> 👥 {r.players}
          <button onClick={() => join(r.id)}>Join</button>
        </div>
      ))}
    </div>
  );
}
