# System architecture

This document describes the architecture of the **Backend** and **Frontend** for InsightCode, separate from other docs (e.g. State Management, Worker, System Overview).

---

## High-level overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (SPA)                                                   │
│  React + Vite, React Router, Zustand, Context                    │
│  ─────────────────────────────────────────────────────────────  │
│  User: Auth, Problems, Workspace, Analytics, Profile             │
│  Admin: Dashboard, Users, Problems, Submissions, AI Insights     │
└───────────────────────────────┬───────────────────────────────────┘
                                │ HTTP/REST (CORS, JWT, Cookie)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (Monolithic API)                                         │
│  Express.js, Prisma, PostgreSQL, BullMQ                          │
│  ─────────────────────────────────────────────────────────────  │
│  Routes → Middleware → Controllers → DB / Queue / External API   │
└───────────────────────────────┬───────────────────────────────────┘
                                │ Redis (queue)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Worker                                                           │
│  BullMQ Worker, Node.js                                           │
│  ─────────────────────────────────────────────────────────────  │
│  Consumes queue jobs → calls Backend internal/judge API          │
└─────────────────────────────────────────────────────────────────┘
```

- **Frontend:** Single SPA (separate entry points for User and Admin apps via HTML).
- **Backend:** Single API (monolith), one process.
- **Worker:** Separate process, runs asynchronously from the queue.

---

## Backend architecture

### Overall style

- **Layered / MVC-style** on **Express.js** (Node.js)
- **REST-style API** (resource-based paths)
- **Monolithic:** All routes in one app; no microservices

### Folder structure and layers

| Layer | Location | Role |
|-------|----------|------|
| **Entry** | `src/index.ts` | Create Express app, attach middleware in order, mount routes under `/api/*` |
| **Routes** | `src/routes/*.routes.ts` | Define method + path, wire controllers and middleware (`authenticate`, `authorize`) |
| **Controllers** | `src/controllers/*.controller.ts` | Handle `req`/`res`, read/write data (Prisma), call queue or external API, send JSON |
| **Middleware** | `src/middleware/auth.middleware.ts` | Verify JWT, set `req.user`, check role (authorize) |
| **Lib** | `src/lib/*.ts` | Shared code: Prisma client, JWT, logger, logBuffer, OpenRouter |
| **Queue** | `src/queue/judgeQueue.ts` | BullMQ queue for judge jobs to the Worker |
| **OpenAPI** | `src/openapi.ts` | API spec for docs |

### Middleware order (from index.ts)

1. Logging (pino-http)
2. Request log → pushLogLine (res.on("finish"))
3. Security (helmet, cors, cookieParser)
4. Body parsing (express.json, urlencoded)
5. Routes (by prefix: `/api/auth`, `/api/users`, `/api/problems`, `/api/submissions`, `/api/admin`, `/api/announcements`)

### Data and external services

- **Database:** PostgreSQL via Prisma ORM (schema in `prisma/schema.prisma`)
- **Auth:** JWT (access token in memory/header, refresh token in HttpOnly cookie)
- **Queue:** Redis + BullMQ (queue name `submission-judge`)
- **External API:** OpenRouter (chat/AI) via `src/lib/openrouter.ts`

### Related docs

- Worker and queue: [WORKER_SYSTEM.md](WORKER_SYSTEM.md)
- Redis: [REDIS_DESIGN.md](REDIS_DESIGN.md)

---

## Frontend architecture

### Overall style

- **SPA** on **React + Vite**
- **Client-side routing** (React Router)
- **Component-based:** Pages, Layout, UI components, Services, Store/Context

### Folder structure and layers

| Part | Location | Role |
|------|----------|------|
| **Entry** | `src/main.tsx`, `src/admin-main.tsx` | Wrap Providers (Loading, Router), render App or Admin app |
| **App / Routing** | `src/App.tsx` | Define `<Routes>`, guards (RequireAuth, RequireAdmin), silent refresh on boot |
| **Pages** | `src/pages/*.tsx`, `src/pages/admin/*.tsx` | One route per page; fetch via API and keep in that page’s state |
| **Layout** | `src/components/layout/*` | Navbar, PageLayout, AdminPageLayout, Footer, Sidebar |
| **UI Components** | `src/components/ui/*` | StatCard, ProgressBar, Badge, Modal, etc. |
| **Features** | `src/components/chat/*` | ChatBubble (AI chat) |
| **Services** | `src/services/*Api.ts` | HTTP calls to Backend (auth, problems, submissions, admin, chat, notification) |
| **State** | `src/store/authStore.ts`, `src/contexts/LoadingContext.tsx` | App-wide auth (Zustand), page-loading state (Context) |
| **Hooks** | `src/hooks/useAuth.ts` | Wraps authStore + authApi (login, logout, …) |
| **Types** | `src/types/index.ts` | Shared TypeScript types |

### Data flow

- **Auth:** Pages use `useAuth()` or `useAuthStore()` → call `authApi` → update `authStore`; on app load `App.tsx` runs silent refresh.
- **Per-page data:** Page calls `*Api.*()` with `accessToken` from store → stores result in that page’s `useState` (no global cache like React Query).
- **Navigation:** User clicks nav → set loading via Context → `navigate()` → Layout shows skeleton based on loading.

### Main technologies

- **Build & dev:** Vite
- **UI:** React, React Router, DaisyUI (Tailwind)
- **State:** Zustand (auth), React Context (loading), useState per page
- **HTTP:** fetch via functions in `services/*Api.ts`

### Related docs

- State management details: [FRONTEND_STATE_MANAGEMENT.md](FRONTEND_STATE_MANAGEMENT.md)

---

## Summary

| | Backend | Frontend |
|---|---------|----------|
| **Style** | Layered / MVC-style, monolithic API | SPA, component-based |
| **Stack** | Express, Prisma, PostgreSQL, BullMQ, Redis | React, Vite, React Router, Zustand, Context |
| **Layers** | Routes → Middleware → Controllers → Lib / Queue | Entry → App/Routes → Pages → Components, Services, Store |
