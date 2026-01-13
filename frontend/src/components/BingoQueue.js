import { Card, CardContent, Typography, Button, Stack } from "@mui/material";

export default function BingoQueue({ state, isAdmin, API, roomId }) {
  const queue = state.bingoQueue || [];
  if (!queue.length) return null;

  const approve = () =>
    fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=1`, { method: "POST" });

  const reject = () =>
    fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=0`, { method: "POST" });

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6">📝 BINGO Queue</Typography>

        {queue.map((q, i) => (
          <Stack key={q.user} spacing={1} sx={{ mt: 1 }}>
            <Typography>
              <b>{q.user}</b> — {q.nums || "đang nhập"}
            </Typography>

            {isAdmin && i === 0 && (
              <Stack direction="row" spacing={1}>
                <Button color="success" onClick={approve}>
                  Approve
                </Button>
                <Button color="error" onClick={reject}>
                  Reject
                </Button>
              </Stack>
            )}
          </Stack>
        ))}
      </CardContent>
    </Card>
  );
}
