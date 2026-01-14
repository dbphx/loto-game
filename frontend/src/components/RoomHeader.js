import { Stack, Chip, Button, Menu, MenuItem } from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useState } from "react";

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

  const [anchorEl, setAnchorEl] = useState(null);

  const leaveRoom = async () => {
    await fetch(`${API}/rooms/leave?id=${roomId}&user=${user}`, {
      method: "POST",
    });
    onLeave();
  };

  const setIntervalValue = async (v) => {
    await fetch(`${API}/rooms/interval?id=${roomId}&v=${v}`, {
      method: "POST",
    });
    setAnchorEl(null);
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

        {/* INTERVAL SETTING (ADMIN ONLY) */}
        {isAdmin && (
          <>
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ fontWeight: "bold" }}
            >
              ⏱ {state.interval}s
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              {[2, 3, 5, 8, 10].map((v) => (
                <MenuItem
                  key={v}
                  selected={state.interval === v}
                  onClick={() => setIntervalValue(v)}
                >
                  {v} giây
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        <Button
          variant="outlined"
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
