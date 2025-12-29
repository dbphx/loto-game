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
import ImageIcon from "@mui/icons-material/Image";

const CHAT_API = "http://localhost:8081";

export default function Chat({ roomId, user }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [chats, setChats] = useState([]);
  const [sending, setSending] = useState(false); // 🔥 LOCK DUPLICATE SEND
  const endRef = useRef(null);
  const fileRef = useRef(null);

  /* ================= HELPERS ================= */

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /* ================= LOAD CHAT ================= */

  const loadChat = async () => {
    try {
      const res = await fetch(`${CHAT_API}/chat/list?room=${roomId}`);
      const data = await res.json();
      setChats(data || []);
    } catch (e) {
      console.error("Load chat error", e);
    }
  };

  /* ================= SEND TEXT ================= */

  const sendText = async () => {
    if (sending) return;
    if (!text.trim()) return;

    setSending(true);

    try {
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
      await loadChat();
    } catch (e) {
      console.error("Send text failed", e);
    } finally {
      setSending(false);
    }
  };

  /* ================= SEND IMAGE (BASE64) ================= */

  const sendImage = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (sending) return;

    setSending(true);

    try {
      const base64 = await fileToBase64(file);

      await fetch(`${CHAT_API}/chat/image/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: roomId,
          user,
          base64,
        }),
      });

      fileRef.current.value = "";
      await loadChat();
    } catch (e) {
      console.error("Send image failed", e);
    } finally {
      setSending(false);
    }
  };

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (!open) return;

    loadChat();
    const t = setInterval(loadChat, 1000);
    return () => clearInterval(t);
  }, [open, roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  /* ================= UI ================= */

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
            width: 340,
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
            {chats.map((c, i) => {
              const isMe = c.user === user;

              return (
                <Box
                  key={i}
                  sx={{
                    mb: 1,
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: "80%",
                      p: 1,
                      borderRadius: 2,
                      background: isMe ? "#1976d2" : "#e0e0e0",
                      color: isMe ? "#fff" : "#000",
                    }}
                  >
                    <Typography fontSize={11} fontWeight="bold">
                      {c.user}
                    </Typography>

                    {c.type === "image" ? (
                      <img
                        src={`${CHAT_API}${c.text}`}
                        style={{
                          maxWidth: "100%",
                          borderRadius: 6,
                          marginTop: 4,
                        }}
                        alt="chat-img"
                      />
                    ) : (
                      <Typography fontSize={13}>{c.text}</Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
            <div ref={endRef} />
          </Box>

          {/* INPUT */}
          <Stack direction="row" spacing={1} mt={1}>
            <IconButton onClick={() => fileRef.current.click()} disabled={sending}>
              <ImageIcon />
            </IconButton>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => sendImage(e.target.files[0])}
            />

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.repeat) {
                  e.preventDefault(); // 🔥 FIX DUPLICATE
                  sendText();
                }
              }}
              style={{ flex: 1, padding: 8 }}
              placeholder="Nhập tin nhắn hoặc gửi ảnh..."
              disabled={sending}
            />

            <Button onClick={sendText} disabled={sending}>
              Gửi
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
