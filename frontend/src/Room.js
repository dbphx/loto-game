import { useEffect, useState } from "react";

const API = "http://localhost:8080";

export default function Room({ roomId, user, onLeave }) {
  const [state, setState] = useState(null);
  const [bingoNums, setBingoNums] = useState("");
  const [bingoResult, setBingoResult] = useState(null);

  /* ===============================
     LOAD ROOM STATE (POLLING)
  =============================== */
  const load = async () => {
    try {
      const res = await fetch(`${API}/rooms/state?id=${roomId}`);
      if (!res.ok) return;
      const data = await res.json();
      setState(data);
    } catch (e) {
      console.error(e);
    }
  };

  /* ===============================
     JOIN + HEARTBEAT + POLLING
  =============================== */
  useEffect(() => {
    if (!roomId || !user) return;

    // lưu localStorage để reload không văng
    localStorage.setItem("bingo_room", roomId);
    localStorage.setItem("bingo_user", user);

    // join lại room (safe khi reload)
    fetch(`${API}/rooms/join?id=${roomId}&user=${user}`, {
      method: "POST",
    });

    // load ngay
    load();

    // polling state mỗi 1s
    const poll = setInterval(load, 1000);

    // heartbeat để backend không kick
    const ping = setInterval(() => {
      fetch(`${API}/rooms/ping?id=${roomId}&user=${user}`, {
        method: "POST",
      });
    }, 5000);

    return () => {
      clearInterval(poll);
      clearInterval(ping);
    };
  }, [roomId, user]);

  if (!state) {
    return <p style={{ padding: 20 }}>Loading room...</p>;
  }

  const isAdmin = state.admin === user;
  const usersCount = Object.keys(state.users || {}).length;
  const called = state.called || [];

  /* ===============================
     PLAYER BINGO
  =============================== */
  const checkBingo = async () => {
    // pause game
    await fetch(
      `${API}/rooms/bingo?id=${roomId}&user=${user}`,
      { method: "POST" }
    );

    const nums = bingoNums
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));

    if (nums.length !== 5) {
      setBingoResult("❌ Nhập đúng 5 số");
      return;
    }

    const ok = nums.every((n) => called.includes(n));
    setBingoResult(ok ? "🎉 BINGO HỢP LỆ" : "❌ CHƯA ĐỦ SỐ");

    await fetch(
      `${API}/rooms/bingo/result?id=${roomId}&ok=${ok ? 1 : 0}`,
      { method: "POST" }
    );
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>🎱 Room: {roomId}</h2>
        <button
          style={{ background: "#f44336", color: "#fff" }}
          onClick={async () => {
            await fetch(
              `${API}/rooms/leave?id=${roomId}&user=${user}`,
              { method: "POST" }
            );
            localStorage.removeItem("bingo_room");
            localStorage.removeItem("bingo_user");
            onLeave();
          }}
        >
          Leave
        </button>
      </div>

      <p>👑 Admin: <b>{state.admin}</b></p>
      <p>👥 Players: <b>{usersCount}</b></p>

      {/* ===== GLOBAL BINGO MESSAGE ===== */}
      {state.paused && state.bingoBy && state.bingoOK && (
        <div
          style={{
            background: "#4caf50",
            color: "#fff",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          🎉 Chúc mừng <b>{state.bingoBy}</b> đã BINGO!
        </div>
      )}

      {state.paused && state.bingoBy && !state.bingoOK && (
        <div
          style={{
            background: "#ffeb3b",
            padding: 10,
            borderRadius: 6,
            marginBottom: 10,
            fontWeight: "bold",
          }}
        >
          ⏸ {state.bingoBy} đang kiểm tra BINGO…
        </div>
      )}

      {/* Ball */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "#ff9800",
          color: "#fff",
          fontSize: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "20px auto",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        }}
      >
        {state.current || "-"}
      </div>

      {/* START */}
      {!state.running && isAdmin && (
        <button
          style={{
            padding: "10px 20px",
            background: "#4caf50",
            color: "#fff",
            borderRadius: 6,
            border: "none",
          }}
          onClick={() =>
            fetch(`${API}/rooms/start?id=${roomId}`, { method: "POST" })
          }
        >
          ▶ Start Game
        </button>
      )}

      {!isAdmin && !state.running && (
        <p style={{ color: "#888" }}>Waiting admin to start…</p>
      )}

      {/* ADMIN DECISION */}
      {state.paused && isAdmin && (
        <div style={{ marginTop: 20 }}>
          <button
            style={{
              padding: "8px 16px",
              marginRight: 10,
              background: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
            onClick={() =>
              fetch(
                `${API}/rooms/bingo/result?id=${roomId}&ok=0`,
                { method: "POST" }
              )
            }
          >
            ▶ Resume
          </button>

          {state.bingoOK && (
            <button
              style={{
                padding: "8px 16px",
                background: "#f44336",
                color: "#fff",
                border: "none",
                borderRadius: 6,
              }}
              onClick={() =>
                fetch(
                  `${API}/rooms/bingo/result?id=${roomId}&ok=1`,
                  { method: "POST" }
                )
              }
            >
              🔄 Start New Game
            </button>
          )}
        </div>
      )}

      {/* PLAYER BINGO */}
      {state.running && !state.paused && (
        <div
          style={{
            marginTop: 30,
            padding: 15,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h3>🎯 Bingo Check</h3>

          <input
            placeholder="VD: 1, 12, 25, 34, 90"
            value={bingoNums}
            onChange={(e) => setBingoNums(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 10 }}
          />

          <button
            onClick={checkBingo}
            style={{
              padding: "8px 16px",
              background: "#2196f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
          >
            🎉 BINGO
          </button>

          {bingoResult && (
            <p style={{ marginTop: 10, fontWeight: "bold" }}>
              {bingoResult}
            </p>
          )}
        </div>
      )}

      {/* Called numbers */}
      <h3 style={{ marginTop: 30 }}>Called Numbers</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 6,
        }}
      >
        {called.length === 0 && (
          <span style={{ gridColumn: "span 10", color: "#888" }}>
            No numbers yet
          </span>
        )}

        {called.map((n) => (
          <div
            key={n}
            style={{
              background: "#e0e0e0",
              borderRadius: 4,
              padding: "6px 0",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}
