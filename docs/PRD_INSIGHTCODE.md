## InsightCode – Product Requirements (Frontend & Backend)

### 1. Product Overview

- **Product**: InsightCode – เว็บแพลตฟอร์มฝึกเขียนโค้ดและวิเคราะห์การเรียนรู้
- **Goals**:
  - ให้ผู้ใช้ฝึกทำโจทย์ algorithm / data structure ผ่านเว็บ
  - มีระบบ judge ตรวจคำตอบด้วย test case จริง
  - มี AI feedback วิเคราะห์คุณภาพโค้ดและให้คำแนะนำ
  - มีฝั่ง Admin สำหรับดูสถิติและจัดการทรัพยากรในระบบ

### 2. Personas

- **Learner / User**
  - สมัคร/เข้าสู่ระบบ
  - เลือกโจทย์ → เขียนโค้ด → run / submit → ดูผล test case และ AI feedback
  - ใช้ AI chat เพื่อขอคำแนะนำ (ไม่ใช่เฉลย)

- **Admin / Instructor**
  - ดูสถิติโดยรวม (users, problems, submissions, aiFeedback)
  - จัดการ users, problems, test cases, announcements
  - ตรวจสอบระบบ (logs, submissions, AI insights)

---

### 3. Frontend Requirements

#### 3.1 Global

- SPA (React + Vite) ใช้ layout กลาง `PageLayout`:
  - Navbar (โลโก้, navigation, notifications, avatar)
  - Content area (page-specific)
  - Footer (ยกเว้นบางหน้า full-screen เช่น workspace)
  - Floating AI Chat Bubble ที่มุมล่างขวา
- จัดการ state auth ผ่าน `authStore` (Zustand)
- ใช้ DaisyUI/Tailwind สำหรับ styling และ components

#### 3.2 Auth & Profile

- **AuthPage**
  - Register: email, password, fullName (optional)
  - Login: email, password
  - แสดง error ชัดเจน, ใช้ toast แจ้งผล
- **Silent refresh**
  - เมื่อเปิดหน้า `/`:
    - ถ้ามี refresh token (ใน cookie) → เรียก `/api/auth/refresh` + `/api/users/me`
    - set auth state และ redirect ไป `/problems`
  - ถ้า refresh fail → เคลียร์ auth และ redirect ไป `/`
- **Profile**
  - Page `/profile`
  - แสดง email, fullName, role, createdAt, avatar
  - แก้ fullName / avatarUrl แล้ว save ผ่าน `PUT /api/users/me`

#### 3.3 User – Problems & Workspace

- **Problems Explorer (`/problems`)**
  - Table/list แสดง:
    - Title, Difficulty, #Submissions, CreatedAt
  - Filter:
    - Search by title
    - Filter by difficulty
  - Pagination (เช่น 10–20 ต่อหน้า)
  - คลิก row → ไป `/workspace/:id`

- **Problem Workspace (`/workspace/:id`)**
  - ซ้าย:
    - Title, difficulty, description
    - แสดง sample test cases (เฉพาะ non-hidden)
  - ขวา:
    - Code editor (CodeMirror)
    - เลือก language: `typescript`, `javascript`, `python`, `cpp`, `java`, `go`
    - Starter code ต่อภาษา (บังคับรูปแบบ solve ตาม design)
  - Tabs ด้านล่าง:
    - **Testcases**: รายการ test cases (แสดง input/output เฉพาะ non-hidden)
    - **Output**: แสดงผลจาก run ล่าสุด (ต่อ test case)
    - **Submissions**: ประวัติ submission ของ user สำหรับโจทย์นี้:
      - language, status, executionTime, createdAt, qualityScore (ถ้ามี)
  - Actions:
    - **Run**: `POST /api/submissions/run`
    - **Submit**: `POST /api/submissions` แล้ว refresh submissions tab
  - Loading, error, และ toast สำหรับทุก action

#### 3.4 User – Analytics / My Insights

- **AiAnalyticsPage (`/analyze`)**
  - ดึงข้อมูลจาก `/api/users/me/progress` และ `/api/users/me/insights`
  - แสดง:
    - Progress per difficulty (EASY/MEDIUM/HARD)
    - กราฟ line/bar ของ `qualityScore` 10 ครั้งล่าสุด
    - Recent AI insights:
      - problemTitle, status, qualityScore, short analysisText
  - Filter:
    - by date range (optional)
    - by difficulty (optional)

#### 3.5 User – Notifications & Announcements

- Navbar แสดงไอคอน notification:
  - badge แสดงว่ามีประกาศใหม่
  - คลิกแล้วเปิด dropdown:
    - แสดง list `announcements` ที่ยังไม่อ่านจาก `/api/users/me/announcements`
    - ปุ่ม **Mark all as read**:
      - เรียก `POST /api/users/me/announcements/read`
      - เคลียร์ badge และ list ฝั่ง frontend

#### 3.6 User – AI Chat Bubble

- อยู่ทุกหน้าที่ใช้ `PageLayout` (ยกเว้น auth/admin)
- FAB (ปุ่มวงกลม) มุมล่างขวา:
  - กดเปิด/ปิด panel chat
  - มี transition/hover เล็กน้อย
- Panel chat:
  - Header:
    - Avatar bot (icon smart_toy + gradient circle)
    - Title: “AI ช่วยติว (ไม่เฉลยโจทย์)”
    - Subtitle: “แนะนำแนวคิด / concept / syntax เท่านั้น”
  - Body:
    - Chat bubbles:
      - user ด้านขวา, bot ด้านซ้าย
      - Avatar user: รูปจาก `avatarUrl` หรือ initials (จาก fullName/email)
      - Avatar bot: icon
      - Bubble กว้างไม่เกิน ~75% เพื่อไม่ล้นจอ
      - แสดง history ล่าสุด (ส่งเข้า backend เป็น `history`)
    - Loading state เมื่อรอ LLM ตอบ
  - Footer:
    - input text + ปุ่ม “ส่ง”
    - Enter ส่ง (ถ้าไม่มี Shift)
  - เมื่ออยู่ใน workspace: ส่ง `problemId` ไปพร้อม message เพื่อให้ backend ดึง context โจทย์ + ประวัติ submission

---

### 4. Admin Frontend Requirements

#### 4.1 Admin Login & Layout

- Route `/admin/login`:
  - email, password, adminCode
  - login ผ่าน `/api/auth/admin-login`
- Admin layout:
  - Sidebar links: Dashboard, Users, Problems, Submissions, AI Insights, Settings
  - Content area สำหรับแต่ละหน้า

#### 4.2 Admin Dashboard

- Stats:
  - Total users, problems, submissions, aiFeedback (จาก `/api/admin/stats`)
- Recent Users:
  - Table: User, Role, SubmissionsCount, CreatedAt
  - search, pagination, row click → user detail modal
- Recent AI Insights:
  - list feedback (problemTitle, status, qualityScore, snippet of analysisText)
- System Resource:
  - แสดง CPU/Mem/Storage (randomized numeric UI)
- System Logs:
  - inline “terminal” viewer:
    - auto-refresh ดึงจาก `/api/admin/logs`
    - แสดง request log ล่าสุด
- Announcements:
  - ปุ่ม “ประกาศข่าวสาร” → modal สร้างแจ้งเตือน
  - submit → `POST /api/admin/announcements` + toast

#### 4.3 Admin Users

- Table:
  - columns: User, Role, #Submissions, CreatedAt, Action (Edit/Delete)
  - search (name/email)
  - filter role
  - pagination
- Create User:
  - modal: email, password, fullName, role
  - call `/api/admin/users` (POST)
- Edit User:
  - modal: fullName, role
  - confirm dialog ก่อน save
  - call `/api/admin/users/:id` (PATCH)
- Delete User:
  - confirm dialog
  - call `/api/admin/users/:id` (DELETE)

#### 4.4 Admin Problems

- Problem list:
  - Table: Title, Difficulty, #Testcases, #Submissions, CreatedAt, Actions (Edit/Delete/Preview)
  - search + filter difficulty + pagination
- Create Problem:
  - modal: title, description, difficulty
  - optional test cases (inputData, expectedOutput, isHidden)
- Edit Problem (`/admin/problems/:id`):
  - form: title, description, difficulty
  - test case list + edit/add/remove
  - confirm dialog ก่อน save
- Import Problems:
  - modal + file upload (.json ตาม `docs/problems-import-template.json`)
  - call `/api/admin/problems/import`
  - ปุ่ม “ดาวน์โหลด template” สร้างไฟล์ JSON ตัวอย่างให้

#### 4.5 Admin Submissions

- Table:
  - userEmail, problemTitle, language, status, executionTime, createdAt
  - filter by status, user, problem, date
- Stats:
  - total submissions
  - accepted count + acceptance rate
  - average execution time

#### 4.6 Admin AI Insights

- Overview:
  - total count aiFeedback
  - distribution ของ `qualityScore` (กราฟ/แผนภาพ)
  - breakdown by language/problem
- List:
  - problemTitle, status, language, qualityScore, short analysisText, createdAt
- Optional:
  - filter by user, problem, language
  - detail panel เมื่อคลิกแต่ละ feedback

#### 4.7 Admin Settings

- content centered
- sections:
  - Features (mock flags)
  - Rate limits (mock)
  - System config (บางค่าจริง/บางค่าจำลอง – label ให้ชัด)

---

### 5. Backend Requirements

#### 5.1 Stack & Infrastructure

- Node.js + Express app (`Backend/`)
- PostgreSQL (ผ่าน Prisma)
- Redis + BullMQ สำหรับ queue `submission-judge`
- Worker (Node) ที่แยกจาก backend API
- OpenRouter API สำหรับ chat LLM (และต่อยอดสำหรับ code analysis)

#### 5.2 Auth & Users

- Endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/admin-login`
  - `POST /api/auth/logout`
  - `POST /api/auth/refresh`
  - `GET /api/users/me`
  - `PUT /api/users/me`
  - `GET /api/users/me/progress`
  - `GET /api/users/me/insights`
  - `GET /api/users/me/announcements`
  - `POST /api/users/me/announcements/read`
  - `POST /api/users/me/chat`
- JWT:
  - Access token (short-lived) ผ่าน Authorization header
  - Refresh token ใน httpOnly cookie
- Authorization:
  - Admin routes ใช้ middleware ตรวจ role === ADMIN

#### 5.3 Problems & Test Cases

- Public:
  - `GET /api/problems`
  - `GET /api/problems/:id`
- Admin:
  - `GET /api/admin/problems`
  - `GET /api/admin/problems/:id`
  - `POST /api/admin/problems`
  - `PATCH /api/admin/problems/:id`
  - `DELETE /api/admin/problems/:id`
  - `POST /api/admin/problems/import`

#### 5.4 Submissions & Judge

- Public:
  - `POST /api/submissions/run`
    - body: `{ problemId, language, code }`
    - ใช้ internal evaluator (Node vm) สำหรับ JS/TS
    - run กับ test cases (exclude hidden) → คืน run result
  - `POST /api/submissions`
    - create row ใน DB ด้วย `status=pending`
    - enqueue job ไป BullMQ queue `submission-judge`
- Worker:
  - ใช้ BullMQ `Worker("submission-judge", ...)`
  - สำหรับแต่ละ job:
    - call `POST /api/submissions/internal/judge` (พร้อม internal token)
- Internal judge:
  - endpoint: `POST /api/submissions/internal/judge`
  - รับ `{ submissionId }`
  - โหลด submission + problem + test cases
  - evaluate code (รวม hidden test cases)
  - update submission:
    - status = `accepted` หรือ `wrong_answer`
    - executionTime
  - สร้าง/อัปเดต `ai_feedback` โดยเรียก analyzeCode(rule-based)

#### 5.5 AI Feedback

- `analyzeCode(code, language)`:
  - สร้าง hints จาก pattern ง่าย ๆ:
    - nested loops, recursion, ใช้ Map/Set, ความยาวโค้ด ฯลฯ
  - คำนวณ `qualityScore` (0–100)
  - สร้าง `analysisText` เป็นข้อความหลายบรรทัด
- บันทึกลง `ai_feedback` ผูกกับ `submissionId`
- Admin / User endpoints:
  - `GET /api/users/me/insights`
  - `GET /api/admin/ai-feedback`

#### 5.6 AI Chat (OpenRouter)

- Config:
  - `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_MODEL` ใน `.env`
- Helper: `openRouterChat(options)` เรียก `POST {BASE}/chat/completions`
- `POST /api/users/me/chat`:
  - auth required
  - input:
    - `problemId?`, `message`, `history?`
  - logic:
    - โหลด problem context (ถ้ามี problemId)
    - โหลดประวัติ submission 5 ครั้งล่าสุดของ user กับโจทย์นี้ พร้อม `qualityScore` + `analysisText`
    - สร้าง system prompt:
      - กฎห้ามเฉลย (no code, no direct answer, no hidden test cases)
      - สรุป context โจทย์
      - สรุปประวัติ submission + feedback (สำหรับแนะแนว)
    - ส่ง messages (system + history + user) ไป OpenRouter
    - คืน `{ reply }`

#### 5.7 Admin APIs

- `GET /api/admin/stats`
- `GET /api/admin/logs`
- Users:
  - `GET /api/admin/users`
  - `POST /api/admin/users`
  - `PATCH /api/admin/users/:id`
  - `DELETE /api/admin/users/:id`
- Submissions:
  - `GET /api/admin/submissions`
- AI Insights:
  - `GET /api/admin/ai-feedback`
- Announcements:
  - `POST /api/admin/announcements`

---

### 6. Non-functional Requirements

- **Security**
  - ใช้ JWT access/refresh tokens
  - Admin routes ป้องกันด้วย role check
  - Internal judge endpoint ป้องกันด้วย secret header
- **Performance**
  - Judge ใช้ queue + worker แยก process
  - Log buffer in-memory ช่วยให้ admin ดู log ได้แบบ realtime
- **Reliability**
  - BullMQ retry/backoff สำหรับงาน judge
  - Prisma schema + `db push` สำหรับดูแล schema
- **Observability**
  - Logging ด้วย Pino + request log → `/api/admin/logs`
  - Health check: `GET /health`

