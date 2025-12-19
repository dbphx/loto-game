import { useState } from "react";
import Lobby from "./Lobby";
import Room from "./Room";

export default function App() {
  const [user] = useState("u" + Math.floor(Math.random() * 1000));
  const [room, setRoom] = useState(null);

  return room ? (
    <Room user={user} roomId={room} onLeave={() => setRoom(null)} />
  ) : (
    <Lobby user={user} onJoin={setRoom} />
  );
}
