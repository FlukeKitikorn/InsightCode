## InsightCode – System Code Overview

ไฟล์นี้อธิบายโครงสร้างโค้ดและการเชื่อมต่อของระบบทั้งหมด (backend, worker, frontend) เพื่อใช้เป็นฐานสำหรับ gen system diagram, sequence diagram, workflow ฯลฯ

---

## 1. โครงสร้างโปรเจคหลัก

```text
Work/InsightCode/
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
├─ worker/            # BullMQ worker สำหรับ judge
│  └─ src/index.mjs
│
├─ docs/              # PRD, SQL, system docs
│  ├─ PRD_INSIGHTCODE.md
│  ├─ PROJECT_REQUIREMENTS_CHECKLIST.md
│  ├─ SQL_INSERT_PROBLEMS_AND_TESTCASES.md
│  └─ TESTCASES_AND_LANGUAGES.md
│
└─ docker-compose.yml # postgres, redis, tools
```

---

## 2. Backend – Express App

### 2.1 Entry point: `Backend/src/index.ts`

โค้ดหลัก (สรุป):

- ตั้งค่า logging ด้วย `pino-http` + custom log line → ส่งเข้าฟังก์ชัน `pushLogLine` (เก็บใน in-memory buffer)
- ใช้ middleware พื้นฐาน:
  - `helmet()` – security headers
  - `cors({ origin: "http://localhost:5173", credentials: true })`
  - `express.json()`, `express.urlencoded()`
  - `cookieParser()`
- ผูก routes:
  - `/api/auth` → `authRoutes`
  - `/api/users` → `userRoutes`
  - `/api/problems` → `problemRoutes`
  - `/api/submissions` → `submissionRoutes`
  - `/api/admin` → `adminRoutes`
  - `/api/announcements` → `announcementRoutes`
- Health check: `GET /health`

### 2.2 Routes & Controllers

#### 2.2.1 Auth (`src/routes/auth.routes.ts`, `src/controllers/auth.controller.ts`)

Routes หลัก:

- `POST /api/auth/register` → `register`
- `POST /api/auth/login` → `login`
- `POST /api/auth/admin-login` → `adminLogin`
- `POST /api/auth/logout` → `logout`
- `POST /api/auth/refresh` → `refreshAccessToken`

การทำงาน:

- ใช้ Prisma เข้าถึง `User` และ `RefreshToken`
- Hash password ด้วย `bcryptjs`
- สร้าง JWT access/refresh token ด้วย `lib/jwt.ts`
- เก็บ refresh token ลง DB และ cookie (httpOnly)

#### 2.2.2 Users (`src/routes/user.routes.ts`, `src/controllers/user.controller.ts`)

Routes (ทั้งหมดต้อง auth ผ่าน middleware `authenticate`):

- `GET /api/users/me` → `getProfile`
- `PUT /api/users/me` → `updateProfile`
- `GET /api/users/me/progress` → `getProgress`
- `GET /api/users/me/insights` → `getMyInsights`
- `GET /api/users/me/announcements` → `getMyAnnouncements`
- `POST /api/users/me/announcements/read` → `markMyAnnouncementsRead`
- `POST /api/users/me/chat` → `postChat` (อยู่ใน `chat.controller.ts` แต่ mount ที่ user routes)

ฟังก์ชันสำคัญ:

- `getProgress`:
  - ใช้ Prisma aggregate/groupBy กับ `Problem` และ `Submission`
  - สร้าง object: totalsByDifficulty, solvedByDifficulty, masteryByDifficulty, etc.
- `getMyInsights`:
  - ดึง submissions ของ user + join `AiFeedback` + `Problem`
  - รองรับ pagination

#### 2.2.3 Problems (`src/routes/problem.routes.ts`, controller ที่เกี่ยวข้อง)

- `GET /api/problems` – list problems สำหรับ user
- `GET /api/problems/:id` – detail + test cases (filter hidden บางส่วนขึ้นอยู่กับ endpoint)

#### 2.2.4 Submissions (`src/routes/submission.routes.ts`, `src/controllers/submission.controller.ts`)

Routes:

- `POST /api/submissions/run` → `runSubmission`
  - รับ `{ problemId, language, code }`
  - validate language (ตอนนี้ support `"javascript" | "typescript"`)
  - เรียก `evaluate(problemId, lang, code, includeHidden = false)`
  - คืน run result (ต่อ test case: passed/failed, actual/expected, error, logs)
- `POST /api/submissions` → `createSubmission`
  - สร้าง row ใน `Submission` (`status = "pending"`)
  - ส่ง job เข้า queue `judgeQueue.add("judge", { submissionId })`
- `POST /api/submissions/internal/judge` → `internalJudgeSubmission`
  - ป้องกันด้วย header `x-internal-judge-token`
  - ใช้ `evaluate(..., includeHidden = true)`
  - ตัดสิน `status = "accepted" | "wrong_answer"`
  - อัปเดต submission (status, executionTime)
  - เรียก `analyzeCode(code, language)` → อัปเดต/สร้าง `AiFeedback`

Core ฟังก์ชันใน `submission.controller.ts`:

- `evaluate(problemId, language, code, includeHidden)`:
  - load `Problem` + `TestCase[]`
  - แปลง `input_data` / `expected_output` ด้วย `parseMaybeJson`
  - ใช้ Node `vm` รันโค้ด user ที่ห่อเป็น `solve(input)`
  - วัดเวลา + สร้าง array ของผลลัพธ์
- `analyzeCode(code, language)`:
  - rule-based analysis (นับบรรทัด, detect nested loop, recursion, การใช้ Map/Set)
  - คืน `{ analysisText, qualityScore }`

#### 2.2.5 Admin (`src/routes/admin.routes.ts`, `src/controllers/admin.controller.ts`)

Mount ด้วย `router.use(authenticate, authorize("ADMIN"))`:

- Stats:
  - `GET /api/admin/stats` – usersCount, problemsCount, submissionsCount, aiFeedbackCount
- Logs:
  - `GET /api/admin/logs` – ดึง log lines จาก in-memory buffer `logBuffer`
- Users:
  - `GET /api/admin/users`
  - `POST /api/admin/users`
  - `PATCH /api/admin/users/:id`
  - `DELETE /api/admin/users/:id`
- Problems:
  - `GET /api/admin/problems`
  - `POST /api/admin/problems`
  - `GET /api/admin/problems/:id`
  - `PATCH /api/admin/problems/:id`
  - `DELETE /api/admin/problems/:id`
  - `POST /api/admin/problems/import`
- Submissions:
  - `GET /api/admin/submissions`
- AI Insights:
  - `GET /api/admin/ai-feedback`
- Announcements:
  - `POST /api/admin/announcements` (controller จริงอยู่ใน `announcement.controller.ts`)

#### 2.2.6 Announcements (`src/routes/announcement.routes.ts`, `src/controllers/announcement.controller.ts`)

- `GET /api/announcements` – public list of latest announcements
- `POST /api/admin/announcements` – create announcement (ผ่าน admin route)

### 2.3 Middleware & Libs

- `src/middleware/auth.middleware.ts`
  - `authenticate` –ดึง JWT จาก Authorization header, verify, set `req.user`
  - `authorize(role)` –ตรวจ role จาก `req.user`
- `src/lib/prisma.ts`
  - สร้าง PrismaClient ด้วย adapter pg จาก `DATABASE_URL`
- `src/lib/logger.ts`
  - ตัว logger ที่ใช้กับ `pino-http`
- `src/lib/logBuffer.ts`
  - เก็บ log lines ล่าสุดใน ring buffer → ใช้โดย `getAdminLogs`
- `src/lib/openrouter.ts`
  - wrapper `openRouterChat({ model?, messages, max_tokens?, temperature? })`
  - สร้าง HTTP call ไปที่ OpenRouter `/chat/completions`

### 2.4 Queue & Worker

- `src/queue/judgeQueue.ts`
  - BullMQ `Queue("submission-judge", { connection: { url: REDIS_URL }, defaultJobOptions: {...} })`
- `worker/src/index.mjs`
  - สร้าง `Worker("submission-judge", async job => { ... })`
  - สำหรับแต่ละ job:
    - อ่าน `submissionId` จาก `job.data`
    - call `POST {BACKEND_URL}/api/submissions/internal/judge` พร้อม internal token
  - log events: waiting, active, completed, failed

---

## 3. Database Schema (Prisma)

ไฟล์: `Backend/prisma/schema.prisma`

Models สำคัญ:

- `User`:
  - fields: id, email, passwordHash, role, fullName, avatarUrl, createdAt
  - relations: `submissions`, `refreshTokens`, `announcementReads`
- `Problem`:
  - id, title, description, difficulty, createdAt
  - relations: `testCases`, `submissions`
- `TestCase`:
  - id, problemId, inputData, expectedOutput, isHidden
- `Submission`:
  - id, userId, problemId, code, language, status, executionTime, memoryUsed, createdAt
  - relations: `user`, `problem`, `aiFeedback`
- `AiFeedback`:
  - id, submissionId, analysisText, qualityScore, createdAt
- `Announcement`:
  - id, title, body, type, createdAt
- `AnnouncementRead`:
  - composite id: (userId, announcementId)
  - relation many-to-many user ↔ announcement
- `RefreshToken`:
  - id, token, userId, expiresAt, createdAt, revoked

---

## 4. Frontend – React App

### 4.1 App entry: `Frontend/src/App.tsx`

- ใช้ `react-router-dom` กำหนด routes:
  - `/` → `AuthPage`
  - `/problems` → `ProblemExplorerPage` (RequireAuth)
  - `/analyze` → `AiAnalyticsPage` (RequireAuth)
  - `/workspace/:id` → `ProblemWorkspacePage` (RequireAuth)
  - `/profile` → `UserProfilePage` (RequireAuth)
  - `/admin/login` → `AdminLoginPage`
  - `/admin/*` → `AdminPage` (RequireAdmin + nested routes ใน `AdminLayout`/`admin-main.tsx`)
- ทำ silent refresh ตอน boot:
  - ใช้ `authApi.refresh()` + `authApi.getMe()` แล้ว set state ผ่าน `authStore`
- Global handler เมื่อ access token หมดอายุ:
  - listen event `insightcode:auth-expired` → clear auth + redirect

### 4.2 Layout & Navigation

- `components/layout/PageLayout.tsx`:
  - ส่ง `currentPage` และ `onNavigate` เพื่อ sync กับ Navbar
  - แสดง `Navbar`, content area, `Footer` (ถ้าไม่ fullScreen) และ `ChatBubble`
- `components/layout/Navbar.tsx`:
  - โลโก้, nav items (Problems, Analytics)
  - Search bar, notifications dropdown, avatar, Sign Out
  - ดึง announcements ผ่าน `notificationApi` (และ `/users/me/announcements` เพื่อ unread)
- `components/layout/AdminLayout.tsx` / `AdminPageLayout.tsx`:
  - Sidebar (Dashboard, Users, Problems, Submissions, AI Insights, Settings)
  - Content area แสดงหน้า admin ต่าง ๆ

### 4.3 State Management

- `store/authStore.ts` (Zustand):
  - state: `user`, `accessToken`, `isAuthenticated`, `isLoading`
  - actions: `setAuth`, `setAccessToken`, `updateUser`, `clearAuth`, `setLoading`
- `hooks/useAuth.ts`:
  - รวม logic login/register/adminLogin/logout/silentRefresh โดยใช้ `authStore` + `authApi`

### 4.4 Services (API Layer)

- `services/authApi.ts` – auth + user profile/progress/insights
- `services/problemsApi.ts` – problems list/detail
- `services/submissionApi.ts` – run & submission APIs
- `services/adminApi.ts` – admin stats/users/problems/submissions/ai-feedback/logs/announcements
- `services/notificationApi.ts` – announcements (public + user-specific)
- `services/chatApi.ts` – `POST /users/me/chat`

แต่ละ service ใช้ `fetch` ไปที่ `http://localhost:4000/api/*` และจัดการ error + token expiry

### 4.5 Pages (User)

- `AuthPage.tsx` – login/register UI
- `ProblemExplorerPage.tsx` – ตารางโจทย์ + filter/search
- `ProblemWorkspacePage.tsx` – โจทย์ + editor + run/submit + tabs results/submissions
- `AiAnalyticsPage.tsx` – ความคืบหน้า + กราฟคะแนนคุณภาพ (ใช้ `D3BarChart`) + recent AI insights
- `UserProfilePage.tsx` – ดู/แก้ไขข้อมูล user

### 4.6 Pages (Admin)

- `AdminLoginPage.tsx` – admin login (email/password/adminCode)
- `AdminDashboardPage.tsx` – stats, recent users, AI insights, system resource, system logs, announcement modal
- `AdminUsersPage.tsx` – ตาราง users + create/edit/delete + pagination + icon actions
- `ProblemListPage.tsx` – ตาราง problems + create/edit/delete/import + preview link + icon actions
- `AdminSubmissionsPage.tsx` – submissions table + filters + stats
- `AdminAiInsightsPage.tsx` – สรุป AI feedback (กราฟ + list)
- `AdminSettingsPage.tsx` – settings mock/real flags

### 4.7 Components สำคัญ

- `components/chat/ChatBubble.tsx` – floating chat bot:
  - ใช้ `chatApi.send(accessToken, { problemId, message, history })`
  - ใช้ `motion` เพื่อ animate panel ตอนเปิด
- `components/ui/StatCard.tsx` – card แสดง KPI
- `components/ui/D3BarChart.tsx` – แผนภูมิแท่งด้วย D3 (ใช้ใน Analytics/Admin)
- `components/ui/ConfirmModal.tsx` – generic confirm dialog

---

## 5. High-level Flows (สำหรับทำ diagram ต่อ)

### 5.1 User – Login & ใช้งานทั่วไป

1. User เปิดเว็บ → App ทำ silent refresh → set auth state
2. User ไปที่ `/problems` → frontend เรียก `GET /api/problems`
3. User เลือกโจทย์ → `/workspace/:id` → `GET /api/problems/:id`
4. User เขียนโค้ด → กด **Run** → `POST /api/submissions/run`
5. User พอใจ → กด **Submit** → `POST /api/submissions` → queue → worker → `POST /api/submissions/internal/judge` → update status + aiFeedback
6. User ไปหน้า `/analyze` → ดู progress + AI insights (`GET /api/users/me/progress`, `GET /api/users/me/insights`)

### 5.2 User – AI Chat

1. จาก workspace (มี `problemId`) → เปิด ChatBubble
2. พิมพ์คำถาม → frontend ส่ง `POST /api/users/me/chat`:
   - body: `{ problemId, message, history }`
3. Backend `postChat`:
   - โหลด problem context และประวัติ submission+AiFeedback (ล่าสุด N รายการ)
   - สร้าง system prompt ด้วยกฎห้ามเฉลย + summary
   - รวม messages (system + history + user)
   - เรียก `openRouterChat` → OpenRouter → ได้ reply
4. ส่ง reply กลับ → frontend แสดงใน bubble ด้านซ้าย

### 5.3 Admin – Dashboard & Management

1. Admin login → `POST /api/auth/admin-login` → set auth role=ADMIN
2. เข้า `/admin` → ดึง stats (`GET /api/admin/stats`), users, AI feedback
3. จัดการ users/problems ผ่านตารางต่าง ๆ
4. กด “ประกาศข่าวสาร” → `POST /api/admin/announcements`
5. Users ฝั่งหน้าเว็บดึง `GET /api/announcements` และ `GET /api/users/me/announcements` เพื่อติด badge + แสดง notification

---

ไฟล์นี้ควรเพียงพอสำหรับใช้สร้าง:

- **System context diagram** (Frontend ↔ Backend ↔ DB/Redis/Worker ↔ OpenRouter)
- **Container / Component diagram** (controllers, routes, services, store, components)
- **Sequence diagrams** สำหรับ:
  - Login
  - Run & Submit + judge
  - Chat กับ LLM
  - Admin workflows (manage users/problems)

