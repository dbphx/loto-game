const API = process.env.API || "https://loto-api.insky.fun";

const ROOMS = 50;
const PING_INTERVAL = 3000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const randomSuffix = () =>
  Math.random().toString(36).substring(2, 8);

/* ================= KEEP ADMIN ALIVE ================= */

async function adminPing(roomId, adminUser) {
  while (true) {
    try {
      await fetch(
        `${API}/rooms/ping?id=${roomId}&user=${adminUser}`
      );
      console.log(`👑 admin ping ${roomId}`);
    } catch (e) {
      console.error("⚠️ admin ping error", roomId, e.message);
    }
    await sleep(PING_INTERVAL);
  }
}

/* ================= KEEP PLAYER ALIVE ================= */

async function playerPoll(roomId, user) {
  while (true) {
    try {
      await fetch(`${API}/rooms/state?id=${roomId}`);
      console.log(`💓 player alive ${roomId} ${user}`);
    } catch (e) {
      console.error("⚠️ player poll error", roomId);
    }
    await sleep(PING_INTERVAL);
  }
}

/* ================= CREATE ROOM ================= */

async function createRoom(idx) {
  const roomId = `room_${idx}`;
  const secret = `secret_${idx}`;
  const adminUser = `${randomSuffix()}-admin`;

  const res = await fetch(
    `${API}/rooms/create?id=${roomId}&user=${adminUser}&secret=${secret}`,
    { method: "POST" }
  );

  if (!res.ok) {
    console.error("❌ create room failed", roomId);
    return null;
  }

  console.log("✅ room created", roomId);

  // 🔥 ADMIN MUST PING
  adminPing(roomId, adminUser);

  return { roomId, secret };
}

/* ================= JOIN ROOM ================= */

async function joinRoom(room, idx) {
  const user = `${randomSuffix()}-player${idx}`;

  const res = await fetch(
    `${API}/rooms/join?id=${room.roomId}&user=${user}&secret=${room.secret}`,
    { method: "POST" }
  );

  if (!res.ok) {
    console.error("❌ join failed", room.roomId);
    return;
  }

  console.log(`👤 ${user} joined ${room.roomId}`);

  playerPoll(room.roomId, user);
}

/* ================= MAIN ================= */

(async () => {
  console.log("🚀 START LOTO LOAD TEST");
  console.log("API =", API);

  const rooms = [];

  for (let i = 0; i < ROOMS; i++) {
    const room = await createRoom(i);
    if (room) rooms.push(room);
    await sleep(100);
  }

  let idx = 0;
  for (const room of rooms) {
    joinRoom(room, idx++);
    await sleep(50);
  }

  console.log("🔥 ALL ROOMS ACTIVE – ADMIN PING ENABLED");
})();
