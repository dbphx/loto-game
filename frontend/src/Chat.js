import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
  Badge,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";

const CHAT_API = process.env.REACT_APP_CHAT_API || "http://localhost:8081";

// 🔧 helper: detect command
const isCommand = (text) =>
  typeof text === "string" && text.includes("/doi");

export default function Chat({ roomId, user }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [chats, setChats] = useState([]);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);

  const endRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);

  const lastCountRef = useRef(null);

  // ✅ HISTORY STATE
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  /* ================= LOAD CHAT ================= */

  const loadChat = async () => {
    try {
      const res = await fetch(`${CHAT_API}/chat/list?room=${roomId}`);
      const data = (await res.json()) || [];

      const visible = data.filter((c) => !isCommand(c.text));

      if (lastCountRef.current === null) {
        lastCountRef.current = visible.length;
        setChats(data);
        return;
      }

      if (!open) {
        const diff = visible.length - lastCountRef.current;
        setUnread(diff > 0 ? diff : 0);
      }

      if (open) {
        lastCountRef.current = visible.length;
        setUnread(0);
      }

      setChats(data);
    } catch (e) {
      console.error("Load chat error", e);
    }
  };

  /* ================= EFFECTS ================= */

  useEffect(() => {
    loadChat();
    const t = setInterval(loadChat, 1000);
    return () => clearInterval(t);
  }, [roomId, open]);

  useEffect(() => {
    if (!open) return;

    setTimeout(() => inputRef.current?.focus(), 100);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, chats]);

  /* ================= SEND TEXT ================= */

  const sendText = async () => {
    if (sending || !text.trim()) return;

    const msg = text.trim();

    setSending(true);
    try {
      await fetch(`${CHAT_API}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: roomId,
          user,
          text: msg,
        }),
      });

      // ✅ push vào history
      historyRef.current.push(msg);
      historyIndexRef.current = historyRef.current.length;

      setText("");
      await loadChat();
    } catch (e) {
      console.error("Send text failed", e);
    } finally {
      setSending(false);
    }
  };

  /* ================= SEND IMAGE ================= */

  const sendImage = async (file) => {
    if (!file || !file.type.startsWith("image/") || sending) return;

    setSending(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        await fetch(`${CHAT_API}/chat/image/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room: roomId,
            user,
            base64: reader.result,
          }),
        });

        fileRef.current.value = "";
        loadChat();
      };
      reader.readAsDataURL(file);
    } finally {
      setSending(false);
    }
  };

  /* ================= HANDLE HISTORY KEYS ================= */

  const handleKeyDown = (e) => {
    // ENTER
    if (e.key === "Enter" && !e.shiftKey && !e.repeat) {
      e.preventDefault();
      sendText();
      return;
    }

    // ⬆ UP
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyRef.current.length === 0) return;

      if (historyIndexRef.current > 0) {
        historyIndexRef.current--;
      }

      setText(historyRef.current[historyIndexRef.current] || "");
    }

    // ⬇ DOWN
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyRef.current.length === 0) return;

      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current++;
        setText(historyRef.current[historyIndexRef.current]);
      } else {
        historyIndexRef.current = historyRef.current.length;
        setText("");
      }
    }
  };

  /* ================= UI ================= */

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            borderRadius: "50%",
            width: 56,
            height: 56,
            minWidth: 56,
            fontSize: 22,
            zIndex: 2000,
            padding: 0,
          }}
          variant="contained"
        >
          <Badge
            badgeContent={unread}
            color="error"
            invisible={unread === 0}
            overlap="circular"
          >
            💬
          </Badge>
        </Button>
      )}

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
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight="bold">💬 Room Chat</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {chats.map((c, i) => {
              if (isCommand(c.text)) return null;
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

          <Stack direction="row" spacing={1} mt={1}>
            <IconButton
              onClick={() => fileRef.current.click()}
              disabled={sending}
            >
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
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, padding: 8 }}
              placeholder="Nhập tin nhắn..."
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
