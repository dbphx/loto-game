import { Box, Button, Chip } from "@mui/material";

export default function CurrentNumber({ number, isAdmin, running, onStart }) {
  return (
    <>
      <Box textAlign="center" my={3}>
        <Chip
          label="Current Number"
          color="warning"
          sx={{ fontWeight: "bold" }}
        />

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
          }}
        >
          {number || "-"}
        </Box>
      </Box>

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
