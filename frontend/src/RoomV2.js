import { useEffect, useRef, useState } from "react";
import { Box, Card, CardContent, Divider } from "@mui/material";

import RoomHeader from "./components/RoomHeader";
import CurrentNumber from "./components/CurrentNumber";
import BingoQueue from "./components/BingoQueue";
import BingoInput from "./components/BingoInput";
import WinnerCard from "./components/WinnerCard";
import UsersDialog from "./components/UserDialog";
import Chat from "./Chat";
import LotoSelect from "./LotoSelect";
import CalledNumbers from "./Called";

const API = process.env.REACT_APP_LOTO_API || "http://localhost:8080";

export default function RoomV2({ roomId, user, secret, onLeave }) {
  const [state, setState] = useState(null);
  const [openUsers, setOpenUsers] = useState(false);

  const [bingoNums, setBingoNums] = useState("");
  const [bingoActive, setBingoActive] = useState(false);
  const [bingoResult, setBingoResult] = useState(null);

  const [approveNotice, setApproveNotice] = useState("");
  const lastApproveRef = useRef(0);

  const mountedRef = useRef(true);

  /* ================= LOAD ROOM ================= */

  const load = async () => {
    try {
      const res = await fetch(`${API}/rooms/state?id=${roomId}`);
      if (!res.ok) return;

      const data = await res.json();
      if (!data) return; // ❗ KHÔNG onLeave ở đây (tránh race)

      if (!mountedRef.current) return;

      if (data.approvedAt && data.approvedAt !== lastApproveRef.current) {
        lastApproveRef.current = data.approvedAt;
        setApproveNotice(`🏆 ADMIN APPROVED: ${data.winner}`);
      }

      if (!data.approvedAt && lastApproveRef.current !== 0) {
        lastApproveRef.current = 0;
        setApproveNotice("");
      }

      setState(data);
    } catch (e) {
      console.error("load room error:", e);
    }
  };

  /* ================= JOIN + POLL ================= */

  useEffect(() => {
    mountedRef.current = true;

    const joinAndStart = async () => {
      const res = await fetch(
        `${API}/rooms/join?id=${roomId}&user=${user}&secret=${secret}`,
        { method: "POST" }
      );

      if (!res.ok) {
        onLeave();
        return;
      }

      await load();
    };

    joinAndStart();

    const poll = setInterval(() => {
      if (mountedRef.current) load();
    }, 1000);

    const ping = setInterval(() => {
      fetch(`${API}/rooms/ping?id=${roomId}&user=${user}`, {
        method: "POST",
      });
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(poll);
      clearInterval(ping);
    };
  }, [roomId, user, secret]);

  if (!state) return <p style={{ padding: 20 }}>Loading room...</p>;

  const isAdmin = state.admin === user;

  /* ================= UI ================= */

  return (
    <Box sx={{ background: "#f4f6f8", minHeight: "100vh", p: 3 }}>
      <Card sx={{ maxWidth: 1000, mx: "auto", borderRadius: 3 }}>
        <CardContent>
          <RoomHeader
            roomId={roomId}
            user={user}
            state={state}
            isAdmin={isAdmin}
            onLeave={onLeave}
            onShowUsers={() => setOpenUsers(true)}
            API={API}
          />

          <Divider sx={{ my: 2 }} />

          <CurrentNumber
            number={state.current}
            isAdmin={isAdmin}
            running={state.running}
            onStart={() =>
              fetch(`${API}/rooms/start?id=${roomId}&secret=${secret}`, {
                method: "POST",
              })
            }
          />

          <BingoQueue
            state={state}
            isAdmin={isAdmin}
            API={API}
            roomId={roomId}
          />

          <BingoInput
            state={state}
            user={user}
            roomId={roomId}
            API={API}
            bingoNums={bingoNums}
            setBingoNums={setBingoNums}
            bingoActive={bingoActive}
            setBingoActive={setBingoActive}
            setBingoResult={setBingoResult}
          />

          <WinnerCard
            state={state}
            isAdmin={isAdmin}
            API={API}
            roomId={roomId}
          />

          <LotoSelect
            roomId={roomId}
            user={user}
            state={state}
            API={API}
          />

          <CalledNumbers called={state.called || []} />
        </CardContent>
      </Card>

      <UsersDialog
        open={openUsers}
        onClose={() => setOpenUsers(false)}
        users={state.users}
        admin={state.admin}
        me={user}
      />

      <Chat roomId={roomId} user={user} />
    </Box>
  );
}
