import { useEffect, useState } from "react";

const API = "http://localhost:8080";

export default function Room({ roomId, user, onLeave }) {
  const [state, setState] = useState(null);
  const [bingoNums, setBingoNums] = useState("");
  const [bingoResult, setBingoResult] = useState(null);
  const [bingoActive, setBingoActive] = useState(false); // user đang nhập số

  const load = async () => {
    try {
      const res = await fetch(`${API}/rooms/state?id=${roomId}`);
      if (!res.ok) return;
      const data = await res.json();

      // nếu game đã reset sau khi approve
      if (data.BingoOK && !data.running) {
        setBingoNums("");
        setBingoActive(false);
        setBingoResult("♻ Game reset sau khi approve!");
      }

      setState(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!roomId || !user) return;

    localStorage.setItem("bingo_room", roomId);
    localStorage.setItem("bingo_user", user);

    fetch(`${API}/rooms/join?id=${roomId}&user=${user}`, { method: "POST" });

    load();

    const poll = setInterval(load, 1000);
    const ping = setInterval(() => {
      fetch(`${API}/rooms/ping?id=${roomId}&user=${user}`, { method: "POST" });
    }, 5000);

    return () => {
      clearInterval(poll);
      clearInterval(ping);
    };
  }, [roomId, user]);

  if (!state) return <p style={{ padding: 20 }}>Loading room...</p>;

  const isAdmin = state.admin === user;
  const usersCount = Object.keys(state.users || {}).length;
  const called = state.called || [];
  const queue = state.bingoQueue || [];

  const myQueueItem = queue.find(q => q.user === user);

  /* ===================== PLAYER BINGO ===================== */
  const startBingo = async () => {
    await fetch(`${API}/rooms/bingo?id=${roomId}&user=${user}&nums=`, { method: "POST" });
    setBingoActive(true);
    setBingoResult("⏸ Game paused, nhập 5 số để hoàn tất BINGO");
  };

  const reportBingo = async () => {
    if (!bingoNums) {
      setBingoResult("❌ Nhập 5 số muốn BINGO");
      return;
    }

    const nums = bingoNums
      .toString()
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));

    if (nums.length !== 5) {
      setBingoResult("❌ Nhập đúng 5 số");
      return;
    }

    await fetch(
      `${API}/rooms/bingo?id=${roomId}&user=${user}&nums=${nums.join(",")}`,
      { method: "POST" }
    );

    setBingoResult(`✅ Báo BINGO: ${user} với ${nums.join(",")}`);
    setBingoNums("");
    setBingoActive(false);
  };

  /* ===================== ADMIN VERIFY ===================== */
  const approveBingo = async () => {
    await fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=1`, { method: "POST" });
    load();
  };

  const rejectBingo = async () => {
    await fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=0`, { method: "POST" });
    load();
  };

  /* ===================== ADMIN CONTROL (ADDED) ===================== */
  const restartGame = async () => {
    await fetch(`${API}/rooms/restart?id=${roomId}`, { method: "POST" });
    load();
  };

  const resumeGame = async () => {
    await fetch(`${API}/rooms/resume?id=${roomId}`, { method: "POST" });
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>🎱 Room: {roomId}</h2>
        <button
          style={{ background: "#f44336", color: "#fff" }}
          onClick={async () => {
            await fetch(`${API}/rooms/leave?id=${roomId}&user=${user}`, { method: "POST" });
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

      {/* Ball */}
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: "#ff9800", color: "#fff", fontSize: 36,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "20px auto", boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
      }}>
        {state.current || "-"}
      </div>

      {/* START */}
      {!state.running && isAdmin && (
        <button
          style={{ padding: "10px 20px", background: "#4caf50", color: "#fff", borderRadius: 6, border: "none" }}
          onClick={() => fetch(`${API}/rooms/start?id=${roomId}`, { method: "POST" })}
        >
          ▶ Start Game
        </button>
      )}
      {!isAdmin && !state.running && <p style={{ color: "#888" }}>Waiting admin to start…</p>}

      {/* ===================== QUEUE BINGO CHO TẤT CẢ ===================== */}
      {queue.length > 0 && (
        <div style={{ marginTop: 20, padding: 10, border: "1px solid #ddd", borderRadius: 6 }}>
          <h4>📝 Đang báo BINGO:</h4>
          {queue.map((q) => (
            <div key={q.user} style={{ padding: "4px 8px", borderBottom: "1px solid #eee" }}>
              <b>{q.user}</b> {q.nums ? `với số: ${q.nums}` : "(đang nhập số)"}
            </div>
          ))}
        </div>
      )}

      {/* Player BINGO */}
      {state.running && (
        <div style={{ marginTop: 20, padding: 15, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3>🎯 Báo BINGO</h3>

          {!myQueueItem && !bingoActive && (
            <button
              onClick={startBingo}
              style={{ padding: "8px 16px", background: "#2196f3", color: "#fff", border: "none", borderRadius: 6 }}
            >
              🎉 BINGO
            </button>
          )}

          {(myQueueItem || bingoActive) && (
            <>
              <input
                placeholder="VD: 1,12,25,34,90"
                value={bingoNums}
                onChange={e => setBingoNums(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 10 }}
              />
              <button
                onClick={reportBingo}
                style={{ padding: "8px 16px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 6 }}
              >
                📤 Gửi 5 số
              </button>
            </>
          )}

          {bingoResult && <p style={{ marginTop: 10, fontWeight: "bold" }}>{bingoResult}</p>}
        </div>
      )}

      {/* Admin verify queue */}
      {isAdmin && queue.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>📝 BINGO Queue (Admin duyệt)</h3>
          {queue.map((q, idx) => (
            <div key={idx} style={{ marginBottom: 10, padding: 8, border: "1px solid #ccc", borderRadius: 6 }}>
              <b>{q.user}</b> với số: {q.nums || "chưa nhập số"}
              <div style={{ marginTop: 6 }}>
                <button
                  onClick={approveBingo}
                  style={{ padding: "6px 12px", marginRight: 8, background: "#4caf50", color: "#fff", border: "none", borderRadius: 6 }}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={rejectBingo}
                  style={{ padding: "6px 12px", background: "#f44336", color: "#fff", border: "none", borderRadius: 6 }}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================== ADMIN DECISION (ADDED) ===================== */}
      {isAdmin && state.paused && queue.length === 0 && (
        <div
          style={{
            marginTop: 25,
            padding: 15,
            border: "2px dashed #999",
            borderRadius: 8,
            background: "#fafafa"
          }}
        >
          {state.BingoOK ? (
            <button
              onClick={restartGame}
              style={{ padding: "10px 20px", background: "#f44336", color: "#fff", border: "none", borderRadius: 6 }}
            >
              🔄 Reset Game
            </button>
          ) : (
            <button
              onClick={resumeGame}
              style={{ padding: "10px 20px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 6 }}
            >
              ▶ Resume Game
            </button>
          )}
        </div>
      )}

      {/* Called numbers */}
      <h3 style={{ marginTop: 30 }}>Called Numbers</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
        {called.length === 0 && (
          <span style={{ gridColumn: "span 10", color: "#888" }}>No numbers yet</span>
        )}
        {called.map(n => (
          <div
            key={n}
            style={{
              background: "#e0e0e0",
              borderRadius: 4,
              padding: "6px 0",
              textAlign: "center",
              fontWeight: "bold"
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}
