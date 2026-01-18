import { Box, Button, Chip, Stack } from "@mui/material";
import { useEffect, useRef } from "react";
import { speak } from "../utils/utils";

export default function CurrentNumber({
  number,
  isAdmin,
  running,
  onStart,
  voiceOn,
}) {
  const lastRef = useRef(null);

  useEffect(() => {
    if (!voiceOn) return;
    if (!number) return;
    if (number === lastRef.current) return;

    lastRef.current = number;
    speak(`${number}`);
  }, [number, voiceOn]);

  return (
    <>
      <Box textAlign="center" my={3}>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Chip
            label="Current Number"
            color="warning"
            sx={{ fontWeight: "bold" }}
          />
          <Chip
            label={voiceOn ? "🔊 Voice ON" : "🔇 Voice OFF"}
            color={voiceOn ? "success" : "default"}
          />
        </Stack>

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
            background: "#fff",
          }}
        >
          {number || "-"}
        </Box>
      </Box>

      {/* ▶ START GAME */}
      {!running && isAdmin && (
        <Box textAlign="center" mb={3}>
          <Button variant="contained" color="success" onClick={onStart}>
            ▶ Start Game
          </Button>
        </Box>
      )}
    </>
  );
}
