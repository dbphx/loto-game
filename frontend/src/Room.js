import { useEffect, useState } from "react";

const API = "http://localhost:8080";

export default function Room({ roomId, user, onLeave }) {
  const [state, setState] = useState(null);
  const [bingoNums, setBingoNums] = useState("");
  const [bingoResult, setBingoResult] = useState(null);
  const [bingoActive, setBingoActive] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API}/rooms/state?id=${roomId}`);
      if (!res.ok) return;
      const data = await res.json();

      if (!data.running && !data.BingoOK && state?.BingoOK) {
        setBingoNums("");
        setBingoActive(false);
        setBingoResult(null);
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
  const called = state.called || [];
  const queue = state.bingoQueue || [];
  const myQueueItem = queue.find(q => q.user === user);

  const startBingo = async () => {
    await fetch(`${API}/rooms/bingo?id=${roomId}&user=${user}&nums=`, { method: "POST" });
    setBingoActive(true);
    setBingoResult("⏸ Game paused, nhập 5 số để báo BINGO");
  };

  const reportBingo = async () => {
    const nums = bingoNums.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (nums.length !== 5) {
      setBingoResult("❌ Nhập đúng 5 số");
      return;
    }

    await fetch(`${API}/rooms/bingo?id=${roomId}&user=${user}&nums=${nums.join(",")}`, { method: "POST" });
    setBingoNums("");
    setBingoActive(false);
    setBingoResult(`📤 Đã gửi BINGO: ${nums.join(",")}`);
  };

  const approveBingo = async () => {
    await fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=1`, { method: "POST" });
    load();
  };

  const rejectBingo = async () => {
    await fetch(`${API}/rooms/bingo/result?id=${roomId}&ok=0`, { method: "POST" });
    load();
  };

  const restartGame = async () => {
    await fetch(`${API}/rooms/restart?id=${roomId}`, { method: "POST" });
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>🎱 Room: {roomId}</h2>
        <button
          style={{ background: "#f44336", color: "#fff" }}
          onClick={async () => {
            await fetch(`${API}/rooms/leave?id=${roomId}&user=${user}`, { method: "POST" });
            localStorage.clear();
            onLeave();
          }}
        >
          Leave
        </button>
      </div>

      <p>👑 Admin: <b>{state.admin}</b></p>

      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: "#ff9800", color: "#fff", fontSize: 36,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "20px auto", boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
      }}>
        {state.current || "-"}
      </div>

      {!state.running && isAdmin && !state.BingoOK && (
        <button style={{ padding: "10px 20px", background: "#4caf50", color: "#fff", borderRadius: 6, border: "none" }}
          onClick={() => fetch(`${API}/rooms/start?id=${roomId}`, { method: "POST" })}>
          ▶ Start Game
        </button>
      )}

      {queue.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>📝 BINGO Queue</h3>
          {queue.map((q, idx) => (
            <div key={q.user} style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, marginBottom: 6 }}>
              <b>{q.user}</b> : {q.nums || "đang nhập số"}
              {isAdmin && idx === 0 && (
                <div style={{ marginTop: 6 }}>
                  <button onClick={approveBingo} style={{ padding: "6px 12px", marginRight: 8, background: "#4caf50", color: "#fff", border: "none", borderRadius: 6 }}>✅ Approve (WIN)</button>
                  <button onClick={rejectBingo} style={{ padding: "6px 12px", background: "#f44336", color: "#fff", border: "none", borderRadius: 6 }}>❌ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {state.running && !myQueueItem && !bingoActive && (
        <button style={{ padding: "8px 16px", background: "#2196f3", color: "#fff", borderRadius: 6, border: "none", marginTop: 20 }}
          onClick={startBingo}>🎉 BINGO</button>
      )}

      {(myQueueItem || bingoActive) && (
        <div style={{ marginTop: 10 }}>
          <input placeholder="VD: 1,12,25,34,90" value={bingoNums} onChange={e => setBingoNums(e.target.value)} style={{ width: "100%", padding: 8 }} />
          <button onClick={reportBingo} style={{ marginTop: 8, padding: "8px 16px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 6 }}>📤 Gửi 5 số</button>
        </div>
      )}

      {state.BingoOK && state.Winner && (
        <div style={{ marginTop: 20, padding: 20, background: "#4caf50", color: "#fff", borderRadius: 10, textAlign: "center", fontSize: 20, fontWeight: "bold" }}>
          🎉🎉 BINGO !!! 🎉🎉<br/>
          🏆 Winner: <b>{state.Winner}</b><br/>
          🔢 Numbers: {state.WinnerNums}
        </div>
      )}

      {isAdmin && state.BingoOK && (
        <div style={{ marginTop: 30 }}>
          <button onClick={restartGame} style={{ padding: "12px 24px", background: "#f44336", color: "#fff", border: "none", borderRadius: 6, fontSize: 16 }}>🔄 Reset Game</button>
        </div>
      )}

      <h3 style={{ marginTop: 30 }}>Called Numbers</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
        {called.map(n => (
          <div key={n} style={{ background: "#e0e0e0", borderRadius: 4, padding: "6px 0", textAlign: "center", fontWeight: "bold" }}>{n}</div>
        ))}
      </div>
    </div>
  );
}
