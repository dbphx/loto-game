import { useEffect, useState } from "react";
import Lobby from "./Lobby";
import RoomV2 from "./RoomV2";

// random 6 ký tự a-z0-9
const randomSuffix = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let str = "";
  for (let i = 0; i < 6; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
};

export default function App() {
  /* ================= RESTORE SESSION ================= */

  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem("loto_session"));
  } catch {}

  const [user, setUser] = useState(
    parsed?.user || `${randomSuffix()}-${parsed?.displayName || ""}`
  );

  const [displayName, setDisplayName] = useState(parsed?.displayName || "");

  const [room, setRoom] = useState(
    parsed?.roomId
      ? { id: parsed.roomId, secret: parsed.secret }
      : null
  );

  /* ================= SYNC STORAGE ================= */

  useEffect(() => {
    if (!room) {
      localStorage.removeItem("loto_session");
      return;
    }

    localStorage.setItem(
      "loto_session",
      JSON.stringify({
        user,
        displayName,
        roomId: room.id,
        secret: room.secret,
      })
    );
  }, [user, displayName, room]);

  /* ================= LEAVE ROOM ================= */

  const leaveRoom = () => {
    setRoom(null);
    localStorage.removeItem("loto_session");
  };

  /* ================= RENDER ================= */

  return room ? (
    <RoomV2
      user={user}
      displayName={displayName}
      roomId={room.id}
      secret={room.secret}
      onLeave={leaveRoom}
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
