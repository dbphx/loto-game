import { useEffect, useState } from "react";
import Lobby from "./Lobby";
import Room from "./Room";

// Hàm random 6 ký tự a-z0-9
const randomSuffix = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let str = "";
  for (let i = 0; i < 6; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
};

export default function App() {
  // 🔥 RESTORE SESSION
  const saved = localStorage.getItem("loto_session");
  const parsed = saved ? JSON.parse(saved) : null;

  // User = random6char + displayName
  const [user, setUser] = useState(
    parsed?.user || `${randomSuffix()}-${parsed?.displayName || ""}`
  );

  const [displayName, setDisplayName] = useState(parsed?.displayName || "");

  const [room, setRoom] = useState(
    parsed?.roomId ? { id: parsed.roomId, secret: parsed.secret } : null
  );

  // 🔐 Sync session
  useEffect(() => {
    localStorage.setItem(
      "loto_session",
      JSON.stringify({
        user,
        displayName,
        roomId: room?.id || null,
        secret: room?.secret || null,
      })
    );
  }, [user, displayName, room]);

  return room ? (
    <Room
      user={user}
      displayName={displayName}
      roomId={room.id}
      secret={room.secret}
      onLeave={() => setRoom(null)}
    />
  ) : (
    <Lobby
      user={user}
      displayName={displayName}
      setDisplayName={setDisplayName}
      setUser={setUser}
      onJoin={setRoom}
    />
  );
}
