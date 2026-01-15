import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
} from "@mui/material";

export default function BingoQueue({ state, isAdmin, API, roomId }) {
  const queue = state?.bingoQueue || [];
  if (!queue.length) return null;

  const approve = async () => {
    await fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=1`, {
      method: "POST",
    });
    // ⛔ KHÔNG setState – polling sẽ cập nhật
  };

  const reject = async () => {
    await fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=0`, {
      method: "POST",
    });
  };

  return (
    <Card
      variant="outlined"
      sx={{ mb: 3, borderColor: "#ff9800", background: "#fff8e1" }}
    >
      <CardContent>
        <Typography variant="h6">📝 BINGO Queue</Typography>

        {queue.map((q, i) => (
          <Box
            key={q.user}
            sx={{
              mt: 1,
              p: 1,
              borderBottom: "1px dashed #ccc",
              background:
                i === 0 ? "rgba(255,152,0,0.15)" : "transparent",
            }}
          >
            <Typography>
              <b>{q.user}</b> — {q.nums || "đang nhập"}
            </Typography>

            {isAdmin && i === 0 && (
              <Stack direction="row" spacing={1} mt={1}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={approve}
                >
                  Approve
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={reject}
                >
                  Reject
                </Button>
              </Stack>
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
