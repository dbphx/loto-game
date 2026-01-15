import { Box, Button } from "@mui/material";

export default function BingoInput({
  state,
  user,
  roomId,
  API,
  bingoNums,
  setBingoNums,
  bingoActive,
  setBingoActive,
}) {
  const called = state.called || [];
  const queue = state.bingoQueue || [];

  const myQueueItem = queue.find((q) => q.user === user);

  const canBingo = state.running && called.length >= 5;

  /* ================= ACTIONS ================= */

  const startBingo = async () => {
    await fetch(`${API}/rooms/bingo?id=${roomId}&user=${user}&nums=`, {
      method: "POST",
    });

    setBingoActive(true);
  };

  const reportBingo = async () => {
    const nums = bingoNums
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));

    if (nums.length !== 5) {
      alert("❌ Nhập đúng 5 số");
      return;
    }

    await fetch(
      `${API}/rooms/bingo?id=${roomId}&user=${user}&nums=${nums.join(",")}`,
      { method: "POST" }
    );

    setBingoNums("");
    setBingoActive(false);
  };

  /* ================= RENDER ================= */

  // ❌ không đủ điều kiện bingo
  if (!canBingo) return null;

  // ✅ CHƯA bấm BINGO
  if (!bingoActive && !myQueueItem) {
    return (
      <Box textAlign="center" mb={2}>
        <Button variant="contained" onClick={startBingo}>
          🎉 BINGO
        </Button>
      </Box>
    );
  }

  // ✅ ĐÃ bấm BINGO → cho nhập số
  if (bingoActive) {
    return (
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
    );
  }

  return null;
}
