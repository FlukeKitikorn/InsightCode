## InsightCode – System code overview

This file describes the code structure and connections of the whole system (backend, worker, frontend) for use as a base for system diagrams, sequence diagrams, and workflows.

---

## 1. Main project structure

```text
InsightCode/
├─ Backend/           # Node.js + Express + Prisma
│  ├─ src/
│  │  ├─ index.ts
│  │  ├─ controllers/
│  │  ├─ routes/
│  │  ├─ lib/
│  │  ├─ middleware/
│  │  ├─ queue/
│  │  └─ ...
│  ├─ prisma/
│  │  └─ schema.prisma
│  └─ prisma.config.ts
│
├─ Frontend/          # React + Vite + Tailwind/DaisyUI
│  ├─ src/
│  │  ├─ App.tsx
│  │  ├─ pages/
│  │  ├─ components/
│  │  ├─ services/
│  │  ├─ store/
│  │  ├─ contexts/
│  │  └─ types/
│  └─ ...
│
├─ worker/            # BullMQ worker for judge
│  └─ src/index.mjs
│
├─ docs/              # Project docs (index at docs/README.md)
│  ├─ README.md
│  ├─ PRD_INSIGHTCODE.md
│  ├─ ARCHITECTURE.md
│  ├─ SYSTEM_OVERVIEW.md
│  ├─ WORKER_SYSTEM.md
│  ├─ REDIS_DESIGN.md
│  ├─ FRONTEND_STATE_MANAGEMENT.md
│  ├─ OPENROUTER_MODELS.md
│  ├─ TESTCASES_AND_LANGUAGES.md
│  └─ SQL_INSERT_PROBLEMS_AND_TESTCASES.md
│
└─ docker-compose.yml # postgres, redis, tools
```

---

## 2. Backend – Express app

### 2.1 Entry: `Backend/src/index.ts`

- Logging via `pino-http` + custom log line → `pushLogLine` (in-memory buffer)
- Middleware: `helmet()`, `cors({ origin: "http://localhost:5173", credentials: true })`, `express.json()`, `express.urlencoded()`, `cookieParser()`
- Routes: `/api/auth`, `/api/users`, `/api/problems`, `/api/submissions`, `/api/admin`, `/api/announcements`
- Health: `GET /health`

### 2.2 Routes & controllers

#### 2.2.1 Auth (`auth.routes.ts`, `auth.controller.ts`)

- `POST /api/auth/register`, `login`, `admin-login`, `logout`, `refresh`
- Protected: `GET /api/auth/me`
- Uses Prisma (`User`, `RefreshToken`), bcrypt, JWT (lib/jwt.ts), refresh token in DB + HttpOnly cookie

#### 2.2.2 Users (`user.routes.ts`, `user.controller.ts`)

All under `authenticate`: `GET/PUT /api/users/me`, `GET /api/users/me/progress`, `GET /api/users/me/insights`, `GET /api/users/me/announcements`, `POST /api/users/me/announcements/read`, `POST /api/users/me/chat` (chat in `chat.controller.ts`). Key: `getProgress` (aggregates), `getMyInsights` (submissions + AiFeedback, paginated).

#### 2.2.3 Problems (`problem.routes.ts`)

- `GET /api/problems` – list for user
- `GET /api/problems/:id` – detail + test cases (hidden filtered per endpoint)

#### 2.2.4 Submissions (`submission.routes.ts`, `submission.controller.ts`)

- `POST /api/submissions/run` → `runSubmission` (evaluate with `includeHidden = false`, return per-test result)
- `POST /api/submissions` → `createSubmission` (insert Submission, enqueue job)
- `POST /api/submissions/internal/judge` → `internalJudgeSubmission` (token-protected, evaluate with hidden, update status + AiFeedback via `analyzeCodeWithLLM` or `analyzeCode`)

Core: `evaluate()` loads Problem + TestCases, runs user code in Node `vm` as `solve(input)`; `analyzeCode` / `analyzeCodeWithLLM` produce `analysisText` and `qualityScore`.

#### 2.2.5 Admin (`admin.routes.ts`, `admin.controller.ts`)

Under `authenticate`, `authorize("ADMIN")`: stats, logs, users CRUD, problems CRUD + import, submissions list, ai-feedback list, announcements (create; list/update/delete in announcement controller).

#### 2.2.6 Announcements (`announcement.routes.ts`)

- `GET /api/announcements` – public list
- Create via admin route

### 2.3 Middleware & libs

- `auth.middleware.ts`: `authenticate` (JWT from Authorization header, set `req.user`), `authorize(role)`
- `lib/prisma.ts`: PrismaClient with pg adapter
- `lib/logger.ts`, `lib/logBuffer.ts`: pino logger, ring buffer for admin logs
- `lib/openrouter.ts`: `openRouterChat()` → OpenRouter `/chat/completions`

### 2.4 Queue & worker

- `queue/judgeQueue.ts`: BullMQ `Queue("submission-judge")`
- `worker/src/index.mjs`: `Worker("submission-judge")`, per job calls `POST .../internal/judge` with token; logs waiting/active/completed/failed

---

## 3. Database schema (Prisma)

File: `Backend/prisma/schema.prisma`

Main models: `User` (submissions, refreshTokens, announcementReads), `Problem` (testCases, submissions), `TestCase`, `Submission` (user, problem, aiFeedback), `AiFeedback`, `Announcement`, `AnnouncementRead`, `RefreshToken`.

---

## 4. Frontend – React app

### 4.1 App entry (`App.tsx`)

Routes: `/` AuthPage, `/problems` ProblemExplorerPage (RequireAuth), `/analyze` AiAnalyticsPage, `/workspace/:id` ProblemWorkspacePage, `/profile` UserProfilePage, `/admin/login` AdminLoginPage, `/admin/*` AdminPage (RequireAdmin). Silent refresh on boot via `authApi.refresh()` + `getMe()` → authStore. Listener `insightcode:auth-expired` → clearAuth + redirect.

### 4.2 Layout & navigation

PageLayout (Navbar, content, Footer, ChatBubble), Navbar (logo, nav, notifications, avatar), AdminPageLayout (sidebar, content).

### 4.3 State

authStore (Zustand), useAuth (authStore + authApi).

### 4.4 Services

authApi, problemsApi, submissionApi, adminApi, notificationApi, chatApi – fetch to `http://localhost:4000/api/*`, handle errors and token expiry.

### 4.5–4.7 Pages and components

User: AuthPage, ProblemExplorerPage, ProblemWorkspacePage, AiAnalyticsPage, UserProfilePage. Admin: AdminLoginPage, AdminDashboardPage, AdminUsersPage, ProblemListPage, AdminSubmissionsPage, AdminAiInsightsPage, AdminSettingsPage. Key components: ChatBubble (chatApi + motion), StatCard, D3BarChart, ConfirmModal.

---

## 5. High-level flows (for diagrams)

### 5.1 User – login and main use

1. Open app → silent refresh → set auth
2. `/problems` → `GET /api/problems`
3. `/workspace/:id` → `GET /api/problems/:id`
4. Run → `POST /api/submissions/run`
5. Submit → `POST /api/submissions` → queue → worker → internal judge → status + aiFeedback updated
6. `/analyze` → `GET /api/users/me/progress`, `GET /api/users/me/insights`

### 5.2 User – AI chat

ChatBubble → `POST /api/users/me/chat` { problemId, message, history } → backend loads problem + recent submissions/feedback, builds prompt, calls OpenRouter → reply to frontend.

### 5.3 Admin – dashboard and management

Admin login → `/admin` → stats, users, problems, submissions, announcements; users see announcements via `/api/announcements` and `/api/users/me/announcements`.

---

This overview is enough to build system context diagrams, container/component diagrams, and sequence diagrams for login, run/submit+judge, chat, and admin flows.
