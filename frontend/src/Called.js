import { Box, CardContent, Typography, Stack, Chip } from "@mui/material";

export default function CalledNumbers({ called }) {
  /* ===== TOTAL ===== */
  const total = called.length;

  /* ===== LAST CALLED NUMBERS ===== */
  const last1 = called[called.length - 1];
  const last2 = called[called.length - 2];
  const last3 = called[called.length - 3];

  /* ===== GROUP CALLED BY COLUMN ===== */
  const calledColumns = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}-${i * 10 + 9}`,
    nums: [],
  }));

  called.forEach((n) => {
    const idx = Math.floor(n / 10);
    if (calledColumns[idx]) {
      calledColumns[idx].nums.push(n);
    }
  });

  return (
    <CardContent>
      {/* 🔢 TOTAL COUNT */}
      <Typography
        variant="subtitle1"
        sx={{
          textAlign: "center",
          fontWeight: "bold",
          mb: 2,
        }}
      >
        🔢 Đã kêu: {total} số
      </Typography>

      {/* 📊 GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 1,
        }}
      >
        {calledColumns.map((col, idx) => (
          <Box
            key={idx}
            sx={{
              border: "1px solid #ddd",
              borderRadius: 2,
              p: 1,
              minHeight: 100,
              background: "#fafafa",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                fontWeight: "bold",
                mb: 0.5,
              }}
            >
              {col.label}
            </Typography>

            <Stack spacing={0.5}>
              {col.nums.map((n) => {
                let sx = {};

                // 🔴 số mới nhất
                if (n === last1) {
                  sx = {
                    backgroundColor: "#f44336",
                    color: "#fff",
                    fontWeight: "bold",
                    border: "2px solid #b71c1c",
                  };
                }
                // 🟠 2 số trước đó
                else if (n === last2 || n === last3) {
                  sx = {
                    backgroundColor: "#ff9800",
                    color: "#fff",
                    fontWeight: "bold",
                    border: "2px solid #e65100",
                  };
                }

                return (
                  <Chip
                    key={n}
                    label={n}
                    size="small"
                    sx={sx}
                  />
                );
              })}
            </Stack>
          </Box>
        ))}
      </Box>
    </CardContent>
  );
}
