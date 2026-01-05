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

/* ================= IMAGE CACHE ================= */
// 🔥 cache ảnh loto theo index
const imageCache = {};

const getLotoImage = (index) => {
  if (index === null || index === undefined) return "";

  if (!imageCache[index]) {
    const img = new Image();
    img.src = `${LOTO_CDN}/${index + 1}.jpg`;
    imageCache[index] = img;
  }

  return imageCache[index].src;
};

export default function LotoSelect({ roomId, user, state, API }) {
  /* ================= STATE ================= */

  const [open, setOpen] = useState(false);
  const [currentLoto, setCurrentLoto] = useState(null);

  /* ================= CANVAS ================= */

  const canvasRef = useRef(null);
  const drawing = useRef(false);

  // 🔥 paths theo từng loto
  const [pathsByLoto, setPathsByLoto] = useState({});

  const paths = pathsByLoto[currentLoto] || [];

  /* ================= PRELOAD ALL IMAGES ================= */
  // 🔥 load sẵn toàn bộ 16 tờ (1 lần duy nhất)
  useEffect(() => {
    Array.from({ length: 16 }).forEach((_, i) => {
      if (!imageCache[i]) {
        const img = new Image();
        img.src = `${LOTO_CDN}/${i + 1}.jpg`;
        imageCache[i] = img;
      }
    });
  }, []);

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

  // 🔥 FIX: khi mở drawer hoặc đổi tờ → redraw lại
  useEffect(() => {
    if (open) {
      requestAnimationFrame(redraw);
    }
  }, [open, currentLoto]);

  useEffect(() => {
    redraw();
  }, [paths]);

  /* ================= DRAW EVENTS ================= */

  const startDraw = (e) => {
    if (!canvasRef.current) return;

    drawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();

    setPathsByLoto((prev) => ({
      ...prev,
      [currentLoto]: [
        ...(prev[currentLoto] || []),
        [{ x: e.clientX - rect.left, y: e.clientY - rect.top }],
      ],
    }));
  };

  const draw = (e) => {
    if (!drawing.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    setPathsByLoto((prev) => {
      const lotoPaths = prev[currentLoto] || [];
      const last = lotoPaths[lotoPaths.length - 1];

      const next = [
        ...last,
        { x: e.clientX - rect.left, y: e.clientY - rect.top },
      ];

      return {
        ...prev,
        [currentLoto]: [...lotoPaths.slice(0, -1), next],
      };
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
    await fetch(
      `${API}/rooms/loto/unselect?id=${roomId}&user=${user}&loto=${currentLoto}`,
      { method: "POST" }
    );
  };

  const myLotos = Object.entries(state.lotos || {})
    .filter(([, u]) => u === user)
    .map(([k]) => Number(k));

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

      {/* ===== DRAWER BÊN TRÁI ===== */}
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            width: 380,
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
              src={getLotoImage(currentLoto)}   // 🔥 dùng cache
              sx={{ width: 320 }}
            />

            <canvas
              ref={canvasRef}
              width={320}
              height={480}
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
            <IconButton
              onClick={() =>
                setPathsByLoto((p) => ({
                  ...p,
                  [currentLoto]: (p[currentLoto] || []).slice(0, -1),
                }))
              }
            >
              <UndoIcon />
            </IconButton>

            <IconButton
              onClick={() =>
                setPathsByLoto((p) => ({ ...p, [currentLoto]: [] }))
              }
            >
              <DeleteSweepIcon />
            </IconButton>
          </Stack>

          {/* ACTIONS */}
          {!state.running && (
            <Stack direction="row" spacing={2} mt={2}>
              <Button
                variant="contained"
                disabled={state.lotos?.[currentLoto]}
                onClick={selectLoto}
              >
                Select
              </Button>

              {myLotos.includes(currentLoto) && (
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
