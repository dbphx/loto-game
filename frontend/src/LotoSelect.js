import { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Button,
  Drawer,
  IconButton,
  Divider,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CloseIcon from "@mui/icons-material/Close";

const LOTO_CDN = "https://stcff2623316212.cloud.insky.io.vn";

export default function LotoSelect({ roomId, user, state, API }) {
  /* ================= STATE ================= */

  const [open, setOpen] = useState(false);
  const [currentLoto, setCurrentLoto] = useState(null);

  /* ================= CANVAS ================= */

  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [paths, setPaths] = useState([]);

  /* ================= REDRAW ================= */

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    paths.forEach((path) => {
      ctx.beginPath();
      path.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });
  };

  /* 🔥 FIX QUAN TRỌNG */
  useEffect(() => {
    if (open) {
      // đợi canvas mount xong
      setTimeout(redraw, 0);
    }
  }, [open]);

  useEffect(() => {
    redraw();
  }, [paths]);

  /* ================= DRAW EVENTS ================= */

  const startDraw = (e) => {
    if (!canvasRef.current) return;

    drawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();

    setPaths((p) => [
      ...p,
      [{ x: e.clientX - rect.left, y: e.clientY - rect.top }],
    ]);
  };

  const draw = (e) => {
    if (!drawing.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    setPaths((p) => {
      const last = p[p.length - 1];
      const next = [
        ...last,
        { x: e.clientX - rect.left, y: e.clientY - rect.top },
      ];
      return [...p.slice(0, -1), next];
    });
  };

  const stopDraw = () => {
    drawing.current = false;
  };

  /* ================= API ================= */

  const selectLoto = async () => {
    await fetch(
      `${API}/rooms/loto/select?id=${roomId}&user=${user}&loto=${currentLoto}`,
      { method: "POST" }
    );
  };

  const unselectLoto = async () => {
    const my = Object.entries(state.lotos || {}).find(
      ([, u]) => u === user
    );
    if (!my) return;

    await fetch(
      `${API}/rooms/loto/unselect?id=${roomId}&user=${user}&loto=${my[0]}`,
      { method: "POST" }
    );
  };

  const myLoto = Object.entries(state.lotos || {}).find(
    ([, u]) => u === user
  )?.[0];

  /* ================= UI ================= */

  return (
    <>
      {/* ===== GRID CHỌN SỐ (GIỮ NGUYÊN) ===== */}
      <Card variant="outlined" sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            🎴 Chọn tờ Loto
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gap: 1.2,
            }}
          >
            {Array.from({ length: 16 }, (_, i) => {
              const owner = state.lotos?.[i];
              const isMine = owner === user;
              const isTaken = !!owner;

              return (
                <Chip
                  key={i}
                  label={owner ? `#${i + 1} (${owner})` : `#${i + 1}`}
                  onClick={() => {
                    setCurrentLoto(i);
                    setOpen(true);
                  }}
                  sx={{
                    height: 40,
                    fontWeight: "bold",
                    cursor: "pointer",
                    bgcolor: isMine
                      ? "#4caf50"
                      : isTaken
                      ? "#e0e0e0"
                      : "#1976d2",
                    color: isTaken && !isMine ? "#555" : "#fff",
                  }}
                />
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* ===== DRAWER BÊN TRÁI (GIỐNG CHAT) ===== */}
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            width: 360,
            height: "100%",
            p: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight="bold">
              🎴 Tờ #{currentLoto + 1}
            </Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* IMAGE + CANVAS */}
          <Box sx={{ position: "relative", mx: "auto" }}>
            <Box
              component="img"
              src={`${LOTO_CDN}/${currentLoto + 1}.jpg`}
              sx={{ width: 320, height: 320 }}
            />

            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                cursor: "crosshair",
              }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
            />
          </Box>

          {/* TOOLS */}
          <Stack direction="row" spacing={1} mt={1}>
            <IconButton onClick={() => setPaths((p) => p.slice(0, -1))}>
              <UndoIcon />
            </IconButton>
            <IconButton onClick={() => setPaths([])}>
              <DeleteSweepIcon />
            </IconButton>
          </Stack>

          {/* ACTIONS */}
          {!state.running && (
            <Stack direction="row" spacing={2} mt={2}>
              <Button
                variant="contained"
                disabled={
                  !!state.lotos?.[currentLoto] ||
                  (!!myLoto && myLoto !== currentLoto)
                }
                onClick={selectLoto}
              >
                Select
              </Button>

              {myLoto !== undefined && (
                <Button color="error" onClick={unselectLoto}>
                  Cancel
                </Button>
              )}
            </Stack>
          )}
        </Box>
      </Drawer>
    </>
  );
}
