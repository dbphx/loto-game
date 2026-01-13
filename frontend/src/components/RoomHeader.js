import { Stack, Chip, Button } from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

export default function RoomHeader({
  roomId,
  user,
  state,
  isAdmin,
  onLeave,
  onShowUsers,
  API,
}) {
  const playerCount = state.users ? Object.keys(state.users).length : 0;

  const leaveRoom = async () => {
    await fetch(`${API}/rooms/leave?id=${roomId}&user=${user}`, {
      method: "POST",
    });
    onLeave();
  };

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={1}
    >
      {/* LEFT */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          label={`🎱 ROOM: ${roomId}`}
          color="primary"
          sx={{ fontWeight: "bold" }}
        />

        <Chip
          label={`👥 ${playerCount}`}
          variant="outlined"
          onClick={onShowUsers}
          sx={{ cursor: "pointer" }}
        />
      </Stack>

      {/* RIGHT */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          label={isAdmin ? `${user} 👑` : user}
          color={isAdmin ? "success" : "default"}
          sx={{ fontWeight: "bold" }}
        />

        <Button
          variant="outlined"        // ✅ border restored
          color="error"
          size="small"
          startIcon={<ExitToAppIcon />}
          onClick={leaveRoom}
          sx={{
            borderWidth: 1.5,
            fontWeight: "bold",
          }}
        >
          Leave
        </Button>
      </Stack>
    </Stack>
  );
}
