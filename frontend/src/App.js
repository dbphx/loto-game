import { useEffect, useState } from "react";
import Lobby from "./Lobby";
import Room from "./Room";

export default function App() {
  // 🔥 RESTORE SESSION (CHỈ THÊM)
  const saved = localStorage.getItem("loto_session");
  const parsed = saved ? JSON.parse(saved) : null;

  // ❗ giữ user cũ nếu có, nếu không thì random như cũ
  const [user] = useState(
    parsed?.user || "u" + Math.floor(Math.random() * 1000)
  );

  const [room, setRoom] = useState(
    parsed?.roomId
      ? { id: parsed.roomId, secret: parsed.secret }
      : null
  );

  // 🔐 sync session (CHỈ THÊM)
  useEffect(() => {
    if (room) {
      localStorage.setItem(
        "loto_session",
        JSON.stringify({
          user,
          roomId: room.id,
          secret: room.secret,
        })
      );
    }
  }, [room, user]);

  return room ? (
    <Room
      user={user}
      roomId={room.id}
      secret={room.secret}
      onLeave={() => {
        localStorage.removeItem("loto_session"); // ✅ chỉ xoá khi Leave
        setRoom(null);
      }}
    />
  ) : (
    <Lobby user={user} onJoin={setRoom} />
  );
}
