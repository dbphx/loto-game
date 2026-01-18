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

  /* 🔊 VOICE – DÙNG CHUNG TOÀN ROOM */
  const [voiceOn, setVoiceOn] = useState(true);

  const mountedRef = useRef(true);

  /* ================= LOAD ROOM ================= */

  const load = async () => {
    try {
      const res = await fetch(`${API}/rooms/state?id=${roomId}`);
      if (!res.ok) return;

      const data = await res.json();
      if (!data || !mountedRef.current) return;

      setState(data);
    } catch (e) {
      console.error("load room error:", e);
    }
  };

  /* ================= JOIN + POLL ================= */

  useEffect(() => {
    mountedRef.current = true;

    const join = async () => {
      const res = await fetch(
        `${API}/rooms/join?id=${roomId}&user=${user}&secret=${secret}`,
        { method: "POST" }
      );

      if (!res.ok) {
        onLeave();
        return;
      }

      load();
    };

    join();

    const poll = setInterval(load, 1000);
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

  // legacy rules
  const canStartGame = isAdmin && !state.running && !state.winner;
  const canResetGame = isAdmin && !!state.winner;

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
            voiceOn={voiceOn}
            setVoiceOn={setVoiceOn}
          />

          <Divider sx={{ my: 2 }} />

          {/* 🎯 CURRENT NUMBER — LUÔN HIỆN */}
          <CurrentNumber
            number={state.current}
            running={state.running}
            isAdmin={canStartGame}
            onStart={
              canStartGame
                ? () =>
                    fetch(
                      `${API}/rooms/start?id=${roomId}&secret=${secret}`,
                      { method: "POST" }
                    )
                : undefined
            }
            voiceOn={voiceOn}
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
            voiceOn={voiceOn}
          />

          {/* 🏆 WINNER */}
          <WinnerCard
            winner={state.winner}
            nums={state.winnerNums}
            voiceOn={voiceOn}
          />

          {/* 🔄 RESET GAME — chỉ hiện khi có winner */}
          {canResetGame && (
            <Box textAlign="center" mb={2}>
              <button
                onClick={async () => {
                  await fetch(`${API}/rooms/restart?id=${roomId}`, {
                    method: "POST",
                  });
                  setBingoNums("");
                  setBingoActive(false);
                  load();
                }}
                style={{
                  padding: "10px 20px",
                  background: "#d32f2f",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                🔄 Reset Game
              </button>
            </Box>
          )}

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
