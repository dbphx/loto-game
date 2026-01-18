import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";
import { playWinSound, stopWinSound } from "../utils/winsound";

export default function WinnerCard({
  winner,
  nums,
  isAdmin,
  onReset,
  voiceOn,
}) {
  const [showFx, setShowFx] = useState(false);

  useEffect(() => {
    if (winner) {
      setShowFx(true);

      if (voiceOn) {
        playWinSound();
      }
    } else {
      setShowFx(false);
      stopWinSound();
    }

    return () => stopWinSound();
  }, [winner, voiceOn]);

  if (!winner) return null;

  return (
    <>
      {showFx && (
        <Confetti
          numberOfPieces={320}
          recycle
          gravity={0.15}
        />
      )}

      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          color: "#fff",
          background: "linear-gradient(135deg, #2ecc71, #f1c40f)",
          boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
          animation: "winnerPop 0.45s ease-out",
          "@keyframes winnerPop": {
            from: { transform: "scale(0.88)", opacity: 0 },
            to: { transform: "scale(1)", opacity: 1 },
          },
        }}
      >
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            🏆 WINNER
          </Typography>

          <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
            {winner}
          </Typography>

          <Box
            sx={{
              mt: 2,
              px: 2.5,
              py: 1.2,
              borderRadius: 3,
              background: "rgba(0,0,0,0.25)",
              display: "inline-block",
            }}
          >
            <Typography sx={{ fontSize: 18 }}>
              🔢 {Array.isArray(nums) ? nums.join(", ") : nums}
            </Typography>
          </Box>

          {isAdmin && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="error"
                onClick={onReset}
                sx={{
                  px: 4,
                  fontWeight: 800,
                  borderRadius: 3,
                }}
              >
                🔄 Reset Game
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}
