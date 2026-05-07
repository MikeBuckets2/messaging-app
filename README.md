# Messaging App

A full-stack messaging application with real-time polling, image sharing, friends, and group chats.

## Stack

- **Backend**: Express + PostgreSQL
- **Frontend**: React + Vite
- **Images**: Cloudinary
- **Auth**: JWT (jsonwebtoken) + bcrypt

---

## Getting Started

### 1. Prerequisites

- Node.js
- PostgreSQL
- A free [Cloudinary](https://cloudinary.com) account

---

### 2. Backend Setup

```bash
cd backend
npm install
```

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/messaging_app"
JWT_SECRET="change-this-to-something-long-and-random"
JWT_EXPIRES_IN="7d"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
PORT=3000
CLIENT_URL="http://localhost:5173"
```

Run migrations and generate the Prisma client.

Start the dev server.

The API will be live at `http://localhost:3000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will open at `http://localhost:5173`. Vite proxies all `/api` requests to `:3000` automatically.

## How Polling Works

There are no WebSockets. Instead:

- **Conversation list** polls `GET /api/conversations` every **5 seconds**
- **Chat window** polls `GET /api/conversations/:id/messages?since=<timestamp>` every **3 seconds**, only fetching messages newer than the last received never the full history
- **Online status** is determined by `lastSeenAt` if a user was seen within the last 2 minutes they show as Online. The frontend pings `PATCH /api/users/me/last-seen` every **30 seconds** while logged in.