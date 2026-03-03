import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { speak } from "../utils/utils";

export default function BingoInput({
  state,
  user,
  roomId,
  API,
  bingoNums,
  setBingoNums,
  bingoActive,
  setBingoActive,
  voiceOn,
}) {
  const called = state.called || [];
  const queue = state.bingoQueue || [];
  const myQueueItem = queue.find((q) => q.user === user);
  const isRejected = bingoActive && !myQueueItem;

  const canBingo = state.running && called.length >= 5;

  /* ================= ACTIONS ================= */

  const startBingo = async () => {
    if (voiceOn) speak("Kinh Kinh Kinh!!");

    await fetch(`${API}/rooms/bingo?id=${roomId}&user=${user}&nums=`, {
      method: "POST",
    });

    setBingoActive(true);
  };

  const reportBingo = async () => {
    const nums = bingoNums
      .split(/[\s,]+/) // dấu phẩy HOẶC dấu cách
      .map((n) => parseInt(n, 10))
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

  if (!canBingo) return null;

  // ===== CHƯA BẤM BINGO =====
  if (!bingoActive && !myQueueItem) {
    return (
      <Box textAlign="center" mb={2}>
        <Button variant="contained" onClick={startBingo}>
          🎉 BINGO
        </Button>
      </Box>
    );
  }

  // ===== ĐÃ BẤM BINGO =====
  if (bingoActive) {
    return (
      <Box mb={3}>
        <input
          value={bingoNums}
          onChange={(e) => setBingoNums(e.target.value)}
          placeholder="VD: 1,12,25,34,90 hoặc 1 12 25 34 90"
          style={{
            width: "100%",
            padding: 10,
            fontSize: 16,
          }}
          disabled={isRejected}
        />
        {isRejected && (
          <Typography sx={{ mt: 1 }} color="error" fontSize={14}>
            🚫 Admin đã từ chối lượt BINGO này. Bấm "🎉 BINGO" lại để gửi lại.
          </Typography>
        )}
        <Button
          sx={{ mt: 1 }}
          variant="contained"
          onClick={reportBingo}
          disabled={isRejected}
        >
          📤 Gửi 5 số
        </Button>
        {isRejected && (
          <Button
            sx={{ mt: 1, ml: 1 }}
            variant="outlined"
            onClick={() => {
              setBingoActive(false);
            }}
          >
            🔁 Trở lại
          </Button>
        )}
      </Box>
    );
  }

  return null;
}
