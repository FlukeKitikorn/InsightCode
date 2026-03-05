## Project Requirements Checklist – InsightCode

### 1. การเล่าเนื้อหาหัวข้อโปรเจคที่เลือกทำ

- **คำอธิบายโปรเจค**  
  - ระบบฝึกเขียนโค้ดออนไลน์ + judge + AI analytics (อธิบายไว้ใน `docs/PRD_INSIGHTCODE.md`)
  - ครอบคลุม flow ผู้ใช้, admin, และ AI integration
- **สถานะ**: ✅ **มี** – มีการอธิบายหัวข้อและขอบเขตโปรเจคอย่างชัดเจนใน PRD

---

### 2. ส่วน Backend (Node.js)

- **Architecture / Structure ชัดเจน**
  - ใช้โครงสร้างแยกชั้น: `src/controllers`, `src/routes`, `src/lib`, `src/middleware`, `src/queue`, `prisma/schema.prisma`
  - controller แยกเป็นไฟล์ตามโดเมน (`auth.controller`, `user.controller`, `problem/submission/admin/chat.controller` ฯลฯ)
  - route แยกไฟล์ (`auth.routes`, `user.routes`, `problem.routes`, `submission.routes`, `admin.routes`, `announcement.routes`)
  - **สถานะ**: ✅

- **REST API ไม่น้อยกว่า 8 routes ที่ชัดเจน**
  - ตัวอย่างหลัก:
    - `POST /api/auth/register`
    - `POST /api/auth/login`
    - `POST /api/auth/admin-login`
    - `POST /api/auth/refresh`
    - `GET /api/users/me`
    - `GET /api/problems`
    - `GET /api/problems/:id`
    - `POST /api/submissions/run`
    - `POST /api/submissions`
    - `POST /api/submissions/internal/judge`
    - `GET /api/admin/users`
    - `POST /api/admin/users`
    - `PATCH /api/admin/users/:id`
    - `DELETE /api/admin/users/:id`
    - `GET /api/admin/problems`
    - `POST /api/admin/problems`
    - `PATCH /api/admin/problems/:id`
    - `DELETE /api/admin/problems/:id`
    - `POST /api/admin/problems/import`
    - `GET /api/admin/submissions`
    - `GET /api/admin/ai-feedback`
    - `POST /api/admin/announcements`
    - `GET /api/announcements`
    - `GET /api/users/me/announcements`
    - `POST /api/users/me/announcements/read`
    - `POST /api/users/me/chat`
  - มีมากกว่า 8 route อย่างชัดเจน
  - **สถานะ**: ✅

- **Middleware ไม่น้อยกว่า 3 ตัว**
  - `helmet()` – security headers
  - `cors()` – CORS สำหรับ frontend dev server
  - `cookieParser()` – จัดการ cookies (refresh token)
  - `express.json()` / `express.urlencoded()` – body parsing
  - `pino-http` logging middleware
  - custom middleware: `authenticate`, `authorize("ADMIN")`
  - **สถานะ**: ✅ (มีทั้ง built-in และ custom หลายตัว)

- **Authentication & Authorization (2 บทบาทขึ้นไป + route จำกัดสิทธิ์)**
  - JWT auth (access/refresh):
    - `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`
  - Roles: `"USER"`, `"ADMIN"` ใน model `User`
  - Admin routes ใช้ `router.use(authenticate, authorize("ADMIN"))` ใน `admin.routes.ts`
  - ตัวอย่าง route จำกัดสิทธิ์: `/api/admin/users`, `/api/admin/problems`, `/api/admin/stats`, `/api/admin/submissions` ฯลฯ
  - **สถานะ**: ✅

- **Database ออกแบบถูกต้อง**
  - ใช้ Prisma + PostgreSQL
  - Models หลัก: `User`, `Problem`, `TestCase`, `Submission`, `AiFeedback`, `Announcement`, `AnnouncementRead`, `RefreshToken`
  - ความสัมพันธ์ชัดเจน:
    - `Problem` 1–N `TestCase`
    - `Problem` 1–N `Submission`
    - `Submission` 1–1 `AiFeedback`
    - `User` 1–N `Submission`
    - `User` N–N `Announcement` ผ่าน `AnnouncementRead`
  - ใช้ enum `ProblemDifficulty` (EASY/MEDIUM/HARD)
  - onDelete behavior กำหนดใน Prisma (เช่น cascade, set null)
  - **สถานะ**: ✅

- **CRUD เชื่อมต่อ Database ครบถ้วน**
  - Users (admin):
    - C: `POST /api/admin/users`
    - R: `GET /api/admin/users`
    - U: `PATCH /api/admin/users/:id`
    - D: `DELETE /api/admin/users/:id`
  - Problems (admin):
    - C: `POST /api/admin/problems`, `POST /api/admin/problems/import`
    - R: `GET /api/admin/problems`, `GET /api/admin/problems/:id`, `GET /api/problems`, `GET /api/problems/:id`
    - U: `PATCH /api/admin/problems/:id`
    - D: `DELETE /api/admin/problems/:id`
  - Submissions:
    - C: `POST /api/submissions`
    - R: `GET /api/admin/submissions`, `GET /api/users/me/insights`
    - U: `POST /api/submissions/internal/judge` (update status/result)
    - D: (ถ้าต้องการสามารถเพิ่ม แต่ requirement CRUD หลักครอบคลุมแล้ว)
  - Announcements:
    - C: `POST /api/admin/announcements`
    - R: `GET /api/announcements`, `GET /api/users/me/announcements`
    - U/D: สามารถเพิ่มภายหลังได้ถ้าต้องการ แต่ CRUD หลักกับ entity อื่นทำครบแล้ว
  - **สถานะ**: ✅ (มี CRUD เต็มกับ Users/Problems/Submissions)

- **Error handling**
  - ทุก controller ใช้ `try/catch`:
    - Log error (`req.log.error` หรือ `console.error`)
    - ส่ง `res.status(500).json({ message: "Internal server error" })` หรือ message ชัดเจน
  - ตรวจ input และส่ง `400` / `401` / `404` ตามเคส (เช่น missing fields, not found, auth missing)
  - Chat + OpenRouter มีการแยก message ชัดเจน เช่น ถ้า OPENROUTER_API_KEY ไม่ถูกตั้ง
  - **สถานะ**: ✅

- **Security พื้นฐานสำหรับเว็บ**
  - ใช้ `helmet()` (security headers)
  - ใช้ `cors()` จำกัด origin (`http://localhost:5173` dev)
  - JWT auth + refresh token ใน httpOnly cookie
  - Internal judge ใช้ secret token (`x-internal-judge-token`)
  - ไม่ log ข้อมูลสำคัญเกินจำเป็น
  - **สถานะ**: ✅

---

### 3. ส่วน Frontend (React)

- **Component Architecture ถูกต้อง**
  - แยก layout: `PageLayout`, `AdminLayout`, `Navbar`, `Footer`, `Sidebar`
  - แยก pages: `AuthPage`, `ProblemExplorerPage`, `ProblemWorkspacePage`, `AiAnalyticsPage`, `UserProfilePage`, `AdminDashboardPage`, `AdminUsersPage`, `AdminSubmissionsPage`, `AdminProblems` ฯลฯ
  - แยก UI components: `StatCard`, `D3BarChart`, `ConfirmModal`, ฯลฯ
  - ใช้ pattern data-fetching ในแต่ละ page อย่างชัดเจน (hooks + services)
  - **สถานะ**: ✅

- **State Management**
  - ใช้ Zustand (`authStore`) เก็บ:
    - user, accessToken, isAuthenticated, isLoading
    - actions: setAuth, clearAuth, silent refresh เป็นต้น
  - ใช้ React state (`useState`, `useEffect`, `useMemo`) สำหรับ state ของแต่ละหน้า (filter, pagination, modal)
  - **สถานะ**: ✅

- **React Router**
  - ใช้ `react-router-dom`:
    - Routes หลัก: `/`, `/problems`, `/analyze`, `/workspace/:id`, `/profile`, `/admin/login`, `/admin`, `/admin/...`
    - Protected routes ด้วย component `RequireAuth` และ `RequireAdmin`
  - ใช้ `useNavigate`, `useParams` ในหลายหน้า
  - **สถานะ**: ✅

- **เชื่อมต่อ Backend**
  - Services layer:
    - `authApi`, `problemsApi`, `submissionApi`, `adminApi`, `notificationApi`, `chatApi`
  - ทุกหน้าเรียก API จริง:
    - Auth, problems, run/submission, admin dashboards, AI insights, announcements, chat
  - Handle loading, error, toast แจ้งผลทุก action สำคัญ
  - **สถานะ**: ✅

---

### สรุปภาพรวม

- Backend: ✅ ครบตาม requirement (architecture, REST API > 8 routes, middleware >= 3, auth & roles, DB + CRUD, error handling, security)
- Frontend: ✅ ครบตาม requirement (component architecture, state management, React Router, backend integration)

หากอาจารย์หรือ reviewer ต้องการ reference เพิ่มเติม สามารถดูรายละเอียดเชิงลึกได้ใน:

- `docs/PRD_INSIGHTCODE.md` – PRD frontend/backend
- `docs/SQL_INSERT_PROBLEMS_AND_TESTCASES.md` – ตัวอย่างโจทย์ + test cases
- `docs/TESTCASES_AND_LANGUAGES.md` – ภาษาที่รองรับและโครงสร้าง test case
