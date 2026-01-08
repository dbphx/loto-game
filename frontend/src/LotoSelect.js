import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

const LOTO_CDN =
  process.env.REACT_APP_LOTO_CDN ||
  "https://stcff2623316212.cloud.insky.io.vn";

/* ================= IMAGE CACHE ================= */
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
  const imgRef = useRef(null);
  const drawing = useRef(false);
  const pointerIdRef = useRef(null);

  const [pathsByLoto, setPathsByLoto] = useState({});
  const paths = pathsByLoto[currentLoto] || [];

  /* ================= PRELOAD ================= */
  useEffect(() => {
    Array.from({ length: 16 }).forEach((_, i) => {
      if (!imageCache[i]) {
        const img = new Image();
        img.src = `${LOTO_CDN}/${i + 1}.jpg`;
        imageCache[i] = img;
      }
    });
  }, []);

  /* ================= CANVAS SIZE ================= */
  const syncCanvasSize = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;

    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  };

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
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });
  };

  useLayoutEffect(() => {
    if (!open || currentLoto === null) return;
    requestAnimationFrame(() => {
      syncCanvasSize();
      redraw();
    });
  }, [open, currentLoto]);

  useLayoutEffect(redraw, [paths]);

  /* ================= POINTER DRAW ================= */
  const getPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    pointerIdRef.current = e.pointerId;

    e.currentTarget.setPointerCapture(e.pointerId);

    const p = getPoint(e);
    setPathsByLoto((prev) => ({
      ...prev,
      [currentLoto]: [...(prev[currentLoto] || []), [p]],
    }));
  };

  const draw = (e) => {
    if (!drawing.current) return;
    if (e.pointerId !== pointerIdRef.current) return;

    e.preventDefault();
    const p = getPoint(e);

    setPathsByLoto((prev) => {
      const arr = prev[currentLoto] || [];
      const last = arr[arr.length - 1];
      return {
        ...prev,
        [currentLoto]: [...arr.slice(0, -1), [...last, p]],
      };
    });
  };

  const stopDraw = (e) => {
    if (e.pointerId !== pointerIdRef.current) return;
    drawing.current = false;
    pointerIdRef.current = null;
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
      {/* GRID */}
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

      {/* DRAWER */}
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 380, height: "100%", p: 2 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight="bold">
              🎴 Tờ #{currentLoto + 1}
            </Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ position: "relative", mx: "auto" }}>
            <Box
              component="img"
              ref={imgRef}
              src={getLotoImage(currentLoto)}
              sx={{ width: 320 }}
              onLoad={() => {
                syncCanvasSize();
                redraw();
              }}
            />

            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                cursor: "crosshair",
                touchAction: "none",
              }}
              onPointerDown={startDraw}
              onPointerMove={draw}
              onPointerUp={stopDraw}
              onPointerCancel={stopDraw}
              onPointerLeave={stopDraw}
            />
          </Box>

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
