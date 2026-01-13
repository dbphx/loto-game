import { Dialog, DialogTitle, DialogContent, Typography } from "@mui/material";

export default function UsersDialog({ open, onClose, users, admin, me }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>👥 Người chơi</DialogTitle>
      <DialogContent>
        {Object.keys(users || {}).map((u) => (
          <Typography key={u} fontWeight={u === me ? "bold" : "normal"}>
            {u} {u === admin && "👑"} {u === me && "(you)"}
          </Typography>
        ))}
      </DialogContent>
    </Dialog>
  );
}
