import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const CHAT_API = "http://localhost:8081";

export default function Chat({ roomId, user }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [chats, setChats] = useState([]);
  const sendingRef = useRef(false);
  const endRef = useRef(null);

  /* ========== LOAD CHAT ========== */
  const loadChat = async () => {
    try {
      const res = await fetch(
        `${CHAT_API}/chat/list?room=${roomId}&limit=50`
      );
      const data = await res.json();
      setChats(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  /* ========== SEND CHAT (ANTI DUP) ========== */
  const sendChat = async () => {
    if (sendingRef.current) return;
    if (!text.trim()) return;

    sendingRef.current = true;

    await fetch(`${CHAT_API}/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: roomId,
        user,
        text: text.trim(),
      }),
    });

    setText("");
    sendingRef.current = false;
    loadChat();
  };

  /* ========== EFFECTS ========== */

  // poll only when open
  useEffect(() => {
    if (!open) return;
    loadChat();
    const t = setInterval(loadChat, 1000);
    return () => clearInterval(t);
  }, [open, roomId]);

  // auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  return (
    <>
      {/* FLOAT BUTTON */}
      <Button
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          borderRadius: "50%",
          width: 56,
          height: 56,
          fontSize: 22,
          zIndex: 2000,
        }}
        variant="contained"
      >
        💬
      </Button>

      {/* DRAWER */}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            width: 320,
            p: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight="bold">💬 Room Chat</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* MESSAGES */}
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {chats.map((c, i) => (
              <Typography
                key={i}
                sx={{
                  fontSize: 13,
                  color: c.user === user ? "#1976d2" : "#000",
                }}
              >
                <b>{c.user}</b>: {c.text}
              </Typography>
            ))}
            <div ref={endRef} />
          </Box>

          {/* INPUT */}
          <Stack direction="row" spacing={1} mt={1}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // ⭐ FIX DUP
                  sendChat();
                }
              }}
              style={{ flex: 1, padding: 8 }}
              placeholder="Nhập tin nhắn..."
            />
            <Button onClick={sendChat}>Gửi</Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
