# 🎱 LOTO Realtime Game

LOTO Realtime Game is a **room-based multiplayer Loto game** where players can join rooms, play together in real time, and chat during the game.  
The project focuses on **simplicity, clarity, and fast deployment using Docker Compose**.

---

## ✨ Features

### 🏠 Lobby
- Create a room with `room_id` and `secret`
- Join an existing room using its secret
- View available rooms in real time
- Persist user session using `localStorage`
- Auto-generate user identity:
  ```
  random6chars-displayName
  ```

---

### 🎮 Game Room
- Room-based game state management
- Random number calling
- Display:
  - Current called number
  - All previously called numbers
  - Numbers grouped by ranges (0–9, 10–19, ...)
  - Highlight the last 3 called numbers
- Multiple players can join and watch the game simultaneously

---

### 💬 Room Chat
- Realtime room chat (polling-based)
- Send text messages
- Send image messages
- Unread message counter
- Chat system is fully separated from game logic

---

### 🗄️ Backend & Data
- Backend written in **Golang**
- Separate **Chat Server**
- **PostgreSQL** used for:
  - Room persistence
  - User-room relations
  - Join time, client IP, and user agent tracking
- Database tables are auto-created on startup

---

## 🧱 System Architecture

```
[ React Frontend ]
        |
        | HTTP
        v
[ Loto API :8080 ] ---- PostgreSQL
        |
        |
[ Chat Server :8081 ]
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|-----------|
| Frontend | React + Material UI |
| Backend | Golang |
| Chat | Golang (in-memory) |
| Database | PostgreSQL |
| Realtime | Polling |
| Deployment | Docker, Docker Compose |

---

## 🚀 Deployment with Docker Compose

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-org/loto-game.git
cd loto-game
```

---

### 2️⃣ Environment Configuration

Create a `.env` file in the project root:

```env
POSTGRES_DSN=postgres://loto:loto@postgres:5432/loto?sslmode=disable
REACT_APP_LOTO_API=http://localhost:8080
REACT_APP_CHAT_API=http://localhost:8081
```

---

### 3️⃣ Docker Compose Setup

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: loto
      POSTGRES_PASSWORD: loto
      POSTGRES_DB: loto
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  loto-api:
    build: ./backend
    depends_on:
      - postgres
    env_file:
      - .env
    ports:
      - "8080:8080"

  chat-api:
    build: ./chat
    ports:
      - "8081:8081"

  frontend:
    build: ./frontend
    env_file:
      - .env
    ports:
      - "3000:80"
    depends_on:
      - loto-api
      - chat-api

volumes:
  pgdata:
```

---

### 4️⃣ Build & Run

```bash
docker compose up --build
```

---

### 5️⃣ Access the Application

| Service | URL |
|-------|-----|
| Frontend | http://localhost:3000 |
| Loto API | http://localhost:8080 |
| Chat API | http://localhost:8081 |
| PostgreSQL | localhost:5432 |

---

## 📂 Project Structure

```
.
├── frontend/
├── backend/
├── chat/
├── docker-compose.yml
├── .env
└── README.md
```

---

## 🔮 Roadmap
- Replace polling with WebSocket
- Role-based permissions (admin / player)
- Persist chat history in database
- Game history & replay support
- Mobile UI optimization
- Event-based themes (Tết, holidays, festivals)

---

## ❤️ Credits

Built with ❤️ by **duc**
