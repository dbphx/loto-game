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
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Chat from "./Chat";

const API = "http://localhost:8080";

export default function Room({ roomId, user, secret, onLeave }) {
  const [state, setState] = useState(null);
  const [bingoNums, setBingoNums] = useState("");
  const [bingoResult, setBingoResult] = useState(null);
  const [bingoActive, setBingoActive] = useState(false);

  const [approveNotice, setApproveNotice] = useState("");
  const lastApproveRef = useRef(0);

  /* ================= HELPERS ================= */

  const isValidBingoNums = (numsStr) => {
    if (!numsStr) return false;
    const nums = numsStr
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    return nums.length === 5;
  };

  /* ================= LOAD ROOM ================= */

  const load = async () => {
    try {
      const res = await fetch(`${API}/rooms/state?id=${roomId}`);
      if (!res.ok) return;
      const data = await res.json();

      // APPROVE NOTICE
      if (data?.approvedAt && data.approvedAt !== lastApproveRef.current) {
        lastApproveRef.current = data.approvedAt;
        setApproveNotice(`🏆 ADMIN APPROVED: ${data.winner}`);
      }

      if (!data?.approvedAt && lastApproveRef.current !== 0) {
        setApproveNotice("");
        lastApproveRef.current = 0;
      }

      // ✅ AUTO RESUME FE nếu game đang chạy & queue trống
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

  useEffect(() => {
    fetch(`${API}/rooms/join?id=${roomId}&user=${user}&secret=${secret}`, {
      method: "POST",
    });

    load();

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

  // chỉ cho BINGO khi đã gọi >= 5 số
  const canBingo = state.running && called.length >= 5;

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

  // ❗ APPROVE: bắt buộc đủ 5 số
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

  // ✅ REJECT: luôn cho phép + reset FE pause
  const rejectBingo = async () => {
    await fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=0`, {
      method: "POST",
    });

    // 🔥 FIX CHÍNH
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
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="bold">
              🎱 Room: {roomId}
            </Typography>

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
                onLeave();
              }}
            >
              Leave
            </Button>
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
            <Typography variant="subtitle2">Current Number</Typography>
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

          {/* START GAME */}
          {!state.running && isAdmin && !state.bingoOK && (
            <Box textAlign="center" mb={3}>
              <Button variant="contained" color="success" onClick={startGame}>
                ▶ Start Game
              </Button>
            </Box>
          )}

          {/* BINGO QUEUE */}
          {queue.length > 0 && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6">📝 BINGO Queue</Typography>

                {queue.map((q, idx) => (
                  <Box key={q.user} sx={{ p: 1, borderBottom: "1px dashed #ccc" }}>
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

          {/* 🎉 BINGO BUTTON */}
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

          {/* WINNER */}
          {state.bingoOK && (
            <Card sx={{ background: "#4caf50", color: "#fff", mb: 3 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6">🏆 Winner: {state.winner}</Typography>
                <Typography>🔢 {state.winnerNums}</Typography>
              </CardContent>
            </Card>
          )}

          {/* RESET */}
          {isAdmin && state.bingoOK && (
            <Box textAlign="center">
              <Button variant="contained" color="error" onClick={restartGame}>
                🔄 Reset Game
              </Button>
            </Box>
          )}

          {/* CALLED NUMBERS */}
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6">🔢 Called Numbers ({called.length})</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 1 }}>
                {called.map((n) => (
                  <Chip key={n} label={n} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* CHAT */}
      <Chat roomId={roomId} user={user} />
    </Box>
  );
}
