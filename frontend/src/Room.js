import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Chat from "./Chat";
import LotoSelect from "./LotoSelect";
import CalledNumbers from "./Called";

/* ================= CONFIG ================= */

const API = process.env.REACT_APP_LOTO_API || "http://localhost:8080";

export default function Room({ roomId, user, secret, onLeave }) {
  const [state, setState] = useState(null);
  const [bingoNums, setBingoNums] = useState("");
  const [bingoResult, setBingoResult] = useState(null);
  const [bingoActive, setBingoActive] = useState(false);

  const [approveNotice, setApproveNotice] = useState("");
  const lastApproveRef = useRef(0);

  const [openUsers, setOpenUsers] = useState(false);

  /* ================= HELPERS ================= */

  const isValidBingoNums = (numsStr) => {
    if (!numsStr) return false;
    const nums = numsStr
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    return nums.length === 5;
  };

  const clearLocalAndLeave = (msg) => {
    localStorage.removeItem("loto_room");
    localStorage.removeItem("loto_user");
    localStorage.removeItem("loto_secret");
    if (msg) alert(msg);
    onLeave();
  };

  /* ================= LOAD ROOM ================= */

  const load = async () => {
    try {
      const res = await fetch(`${API}/rooms/state?id=${roomId}`);
      if (!res.ok) return;

      const data = await res.json();
      if (!data) {
        clearLocalAndLeave("⚠️ Room đã bị xoá");
        return;
      }

      if (data?.approvedAt && data.approvedAt !== lastApproveRef.current) {
        lastApproveRef.current = data.approvedAt;
        setApproveNotice(`🏆 ADMIN APPROVED: ${data.winner}`);
      }

      if (!data?.approvedAt && lastApproveRef.current !== 0) {
        setApproveNotice("");
        lastApproveRef.current = 0;
      }

      if (data.running && (!data.bingoQueue || data.bingoQueue.length === 0)) {
        setBingoActive(false);
        setBingoNums("");
        setBingoResult(null);
      }

      setState(data);
    } catch (e) {
      console.error(e);
    }
  };

  /* ================= JOIN + POLL ================= */

  useEffect(() => {
    const join = async () => {
      const res = await fetch(
        `${API}/rooms/join?id=${roomId}&user=${user}&secret=${secret}`,
        { method: "POST" }
      );

      if (!res.ok) {
        clearLocalAndLeave("❌ Room không tồn tại hoặc đã bị xoá");
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
      clearInterval(poll);
      clearInterval(ping);
    };
  }, [roomId, user, secret]);

  if (!state) return <p style={{ padding: 20 }}>Loading room...</p>;

  const isAdmin = state.admin === user;
  const called = state.called || [];
  const queue = state.bingoQueue || [];
  const myQueueItem = queue.find((q) => q.user === user);
  const canBingo = state.running && called.length >= 5;

  const userList = state.users ? Object.keys(state.users) : [];
  const playerCount = userList.length;

  /* ================= ACTIONS ================= */

  const startGame = async () => {
    const res = await fetch(
      `${API}/rooms/start?id=${roomId}&secret=${secret}`,
      { method: "POST" }
    );
    if (!res.ok) alert("❌ Wrong secret or game already running");
  };

  const startBingo = async () => {
    await fetch(`${API}/rooms/bingo?id=${roomId}&user=${user}&nums=`, {
      method: "POST",
    });
    setBingoActive(true);
    setBingoResult("⏸ Game paused, nhập 5 số để báo BINGO");
  };

  const reportBingo = async () => {
    const nums = bingoNums
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));

    if (nums.length !== 5) {
      setBingoResult("❌ Nhập đúng 5 số");
      return;
    }

    await fetch(
      `${API}/rooms/bingo?id=${roomId}&user=${user}&nums=${nums.join(",")}`,
      { method: "POST" }
    );

    setBingoNums("");
    setBingoActive(false);
    setBingoResult(`📤 Đã gửi BINGO: ${nums.join(",")}`);
  };

  const approveBingo = async (q) => {
    if (!isValidBingoNums(q?.nums)) {
      alert("❌ User chưa nhập đủ 5 số");
      return;
    }

    await fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=1`, {
      method: "POST",
    });

    load();
  };

  const rejectBingo = async () => {
    await fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=0`, {
      method: "POST",
    });

    setBingoActive(false);
    setBingoNums("");
    setBingoResult(null);

    load();
  };

  const restartGame = async () => {
    await fetch(`${API}/rooms/restart?id=${roomId}`, { method: "POST" });
    setBingoActive(false);
    setBingoNums("");
    setBingoResult(null);
    load();
  };

  /* ================= UI ================= */

  return (
    <Box sx={{ background: "#f4f6f8", minHeight: "100vh", p: 3 }}>
      <Card sx={{ maxWidth: 1000, mx: "auto", borderRadius: 3 }}>
        <CardContent>
          {/* HEADER */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={`🎱 ROOM: ${roomId}`}
                color="primary"
                sx={{ fontWeight: "bold" }}
              />
              <Chip
                label={`👥 ${playerCount}`}
                variant="outlined"
                onClick={() => setOpenUsers(true)}
                sx={{ cursor: "pointer" }}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={isAdmin ? `${user} 👑` : user}
                color={isAdmin ? "success" : "default"}
                sx={{ fontWeight: "bold" }}
              />
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<ExitToAppIcon />}
                onClick={async () => {
                  await fetch(
                    `${API}/rooms/leave?id=${roomId}&user=${user}`,
                    { method: "POST" }
                  );
                  clearLocalAndLeave();
                }}
              >
                Leave
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* APPROVE NOTICE */}
          {approveNotice && (
            <Box
              sx={{
                background: "#ff9800",
                color: "#fff",
                p: 1.5,
                borderRadius: 2,
                textAlign: "center",
                fontWeight: "bold",
                mb: 2,
              }}
            >
              {approveNotice}
            </Box>
          )}

          {/* CURRENT NUMBER */}
          <Box textAlign="center" my={3}>
            <Chip label="Current Number" color="warning" sx={{ fontWeight: "bold" }}/>
            <Box
              sx={{
                mt: 1,
                width: 140,
                height: 140,
                mx: "auto",
                borderRadius: "50%",
                border: "4px solid #1976d2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 42,
                fontWeight: "bold",
                color: "#1976d2",
              }}
            >
              {state.current || "-"}
            </Box>
          </Box>
          {!state.running && isAdmin && !state.bingoOK && (
            <Box textAlign="center" mb={3}>
              <Button variant="contained" color="success" onClick={startGame}>
                ▶ Start Game
              </Button>
            </Box>
          )}

          {queue.length > 0 && (
            <Card
              variant="outlined"
              sx={{
                mb: 3,
                borderColor: "#ff9800",
                background: "#fff8e1",
              }}
            >
              <CardContent>
                <Typography variant="h6">📝 BINGO Queue</Typography>

                {queue.map((q, idx) => (
                  <Box
                    key={q.user}
                    sx={{
                      p: 1,
                      borderBottom: "1px dashed #ccc",
                      background:
                        idx === 0 ? "rgba(255,152,0,0.15)" : "transparent",
                    }}
                  >
                    <Typography>
                      <b>{q.user}</b> — {q.nums || "đang nhập số"}
                    </Typography>

                    {isAdmin && idx === 0 && (
                      <Stack direction="row" spacing={1} mt={1}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          disabled={!isValidBingoNums(q.nums)}
                          onClick={() => approveBingo(q)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={rejectBingo}
                        >
                          Reject
                        </Button>
                      </Stack>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {canBingo && !myQueueItem && !bingoActive && (
            <Box textAlign="center" mb={2}>
              <Button variant="contained" onClick={startBingo}>
                🎉 BINGO
              </Button>
            </Box>
          )}

          {(myQueueItem || bingoActive) && (
            <Box mb={3}>
              <input
                value={bingoNums}
                onChange={(e) => setBingoNums(e.target.value)}
                placeholder="VD: 1,12,25,34,90"
                style={{ width: "100%", padding: 10 }}
              />
              <Button sx={{ mt: 1 }} variant="contained" onClick={reportBingo}>
                📤 Gửi 5 số
              </Button>
            </Box>
          )}

          {state.bingoOK && (
            <Card sx={{ background: "#4caf50", color: "#fff", mb: 3 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6">🏆 Winner: {state.winner}</Typography>
                <Typography>🔢 {state.winnerNums}</Typography>
              </CardContent>
            </Card>
          )}

          {isAdmin && state.bingoOK && (
            <Box textAlign="center">
              <Button variant="contained" color="error" onClick={restartGame}>
                🔄 Reset Game
              </Button>
            </Box>
          )}

          <Card variant="outlined" sx={{ mt: 3 }}>
            <LotoSelect
              roomId={roomId}
              user={user}
              state={state}
              API={API}
            />
            <CardContent>
              <Typography variant="h6">
                🔢 Called Numbers ({called.length})
              </Typography>
              <CalledNumbers called={called} />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* USERS POPUP */}
      <Dialog open={openUsers} onClose={() => setOpenUsers(false)}>
        <DialogTitle>👥 Người chơi trong room</DialogTitle>
        <DialogContent>
          {userList.map((u) => (
            <Typography
              key={u}
              sx={{
                fontWeight: u === user ? "bold" : "normal",
                color: u === user ? "#1976d2" : "inherit",
                mb: 0.5,
              }}
            >
              {u} {u === state.admin && "👑"} {u === user && "(you)"}
            </Typography>
          ))}
        </DialogContent>
      </Dialog>

      <Chat roomId={roomId} user={user} />
    </Box>
  );
}
