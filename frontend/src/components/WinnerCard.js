import { Card, CardContent, Typography } from "@mui/material";

export default function WinnerCard({ winner, nums }) {
  if (!winner) return null;

  return (
    <Card sx={{ background: "#4caf50", color: "#fff", mb: 3 }}>
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="h6">🏆 Winner: {winner}</Typography>
        <Typography>🔢 {nums}</Typography>
      </CardContent>
    </Card>
  );
}
