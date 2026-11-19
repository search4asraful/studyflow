# StudyFlow — Collaborative Digital Study Environment

> **Study together. Stay focused. Make progress.**

StudyFlow is a modern, real-time collaborative workspace designed for high-focus group study sessions, featuring authoritative synchronized Pomodoro timers, collaborative Kanban boards, and data-driven productivity analytics.

---

## ✨ Features

- **Authoritative Group Pomodoro**: Single source of truth on the server with zero clock drift. Handles browser reloads and client reconnections smoothly.
- **Collaborative Task Management**: Real-time task board (Backlog, To Do, In Progress, Completed) synchronized instantly across participants via WebSockets.
- **Live Presence & Concurrency**: Heartbeat-driven online presence tracking, room member rosters, and activity feeds.
- **Data-Driven Analytics**: Daily/weekly focus metrics, study streak tracking, and task completion records derived from PostgreSQL data.
- **Enterprise-Grade Security**: Secure HTTP-only JWT cookies, salted bcrypt password hashing, and role-based permissions (Owner, Moderator, Member).

---

## 🛠️ Technology Stack

### Frontend (`apps/web`)
- **Next.js 15 (App Router)** & React 19
- **TypeScript** (strict mode enabled)
- **Tailwind CSS** (custom dark & light productivity theme)
- **GSAP & @gsap/react** (landing page animations)
- **Framer Motion** (micro-interactions & transitions)
- **Zustand** (client-side state management for auth, rooms, and timer)
- **Lucide React** (icons)
- **Recharts** (data-driven productivity charts)
- **Sonner** (toast notifications)
- **React Hook Form & Zod** (form validation)

### Backend (`apps/server`)
- **Node.js & Express.js**
- **Socket.IO** (authoritative real-time synchronization)
- **JWT Authentication** via secure HTTP-only cookies
- **bcryptjs** (salted password hashing)
- **Prisma ORM** & **PostgreSQL 16** (with connection pooling support for Supabase)
- **Vitest** (automated unit, integration, and multi-client concurrency tests)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL database (or Docker / Supabase)

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `DATABASE_URL` matches your PostgreSQL setup (or Supabase).

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database Schema & Seed Data
```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Servers
In two separate terminals:

**Start the Backend Server (Port 4000):**
```bash
npm run dev:server
```

**Start the Next.js Frontend (Port 3000):**
```bash
npm run dev:web
```

Navigate to: `http://localhost:3000`

---

## 🔑 Pre-Seeded Demo Accounts

For instant exploration, use these pre-seeded demo accounts (or use the one-click demo login buttons on the login page):

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Workspace Host** | Md. Asraful Islam Furdus | `asraful@studyflow.dev` | `password123` |
| **Workspace Moderator** | Md Shakil Mia | `shakil@studyflow.dev` | `password123` |
| **Workspace Member** | Alex Rivera | `demo@studyflow.dev` | `password123` |

### Pre-Configured Study Rooms
- **Group Astro — Engineering Workspace** (Invite Code: `SD3ASTRO`)
- **Algorithms & Data Structures Circle** (Invite Code: `ALGO2026`)
- **Late Night Deep Work Sanctuary** (Invite Code: `DEEPWORK`)

---

## 🧪 Automated Testing

Execute the automated test suite covering authentication security, non-drifting timer mathematics, and multi-client WebSocket concurrency:

```bash
npm test
```

All 10 test cases in 3 suites run and pass in under 1 second.

---

## 👥 Credits & Attribution

StudyFlow was designed and developed by **Group Astro**:
- **Md. Asraful Islam Furdus** — Lead Full-Stack Architect
- **Md Shakil Mia** — Full-Stack Developer & Collaborator

For full academic defense specifications and architectural documentation, visit the application's dedicated `/credits` page or refer to [docs/ACADEMIC_DEFENSE.md](file:///home/asraful/www/practice/studyflow/docs/ACADEMIC_DEFENSE.md).
