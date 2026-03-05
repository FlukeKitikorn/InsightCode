# สถาปัตยกรรมระบบ (Architecture)

เอกสารนี้อธิบายสถาปัตยกรรมของ **หลังบ้าน (Backend)** และ **หน้าบ้าน (Frontend)** โปรเจกต์ InsightCode โดยแยกจากเอกสารอื่น (เช่น State Management, Worker, System Overview)

---

## ภาพรวมระดับระบบ

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (SPA)                                                   │
│  React + Vite, React Router, Zustand, Context                    │
│  ─────────────────────────────────────────────────────────────  │
│  หน้า User: Auth, Problems, Workspace, Analytics, Profile         │
│  หน้า Admin: Dashboard, Users, Problems, Submissions, AI Insights  │
└───────────────────────────────┬───────────────────────────────────┘
                                │ HTTP/REST (CORS, JWT, Cookie)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (Monolithic API)                                         │
│  Express.js, Prisma, PostgreSQL, BullMQ                          │
│  ─────────────────────────────────────────────────────────────  │
│  Routes → Middleware → Controllers → DB / Queue / External API  │
└───────────────────────────────┬───────────────────────────────────┘
                                │ Redis (queue)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Worker                                                           │
│  BullMQ Worker, Node.js                                           │
│  ─────────────────────────────────────────────────────────────  │
│  รับ job จาก queue → เรียก Backend internal/judge API            │
└─────────────────────────────────────────────────────────────────┘
```

- **Frontend:** SPA เดียว (มี entry แยกสำหรับ User app และ Admin app ตาม HTML)
- **Backend:** API เดียว (monolith) รัน process เดียว
- **Worker:** process แยก ทำงานแบบ async ตาม queue

---

## หลังบ้าน (Backend) Architecture

### รูปแบบโดยรวม

- **Layered / MVC-style** บน **Express.js** (Node.js)
- **REST-style API** (resource-based paths)
- **Monolithic:** ทุก route อยู่ในแอปเดียว ไม่แยก microservice

### โครงสร้างโฟลเดอร์และชั้น (Layers)

| ชั้น | ที่อยู่ | หน้าที่ |
|------|--------|--------|
| **Entry** | `src/index.ts` | สร้าง Express app, ต่อ middleware ตามลำดับ, mount routes ภายใต้ `/api/*` |
| **Routes** | `src/routes/*.routes.ts` | กำหนด method + path, ผูก controller และ middleware (เช่น `authenticate`, `authorize`) |
| **Controllers** | `src/controllers/*.controller.ts` | รับ `req`/`res`, ดึง/บันทึกข้อมูล (Prisma), เรียก queue หรือ external API, ส่ง JSON response |
| **Middleware** | `src/middleware/auth.middleware.ts` | ตรวจ JWT, ใส่ `req.user`, ตรวจ role (authorize) |
| **Lib** | `src/lib/*.ts` | โค้ดร่วม: Prisma client, JWT, logger, logBuffer, OpenRouter |
| **Queue** | `src/queue/judgeQueue.ts` | BullMQ queue สำหรับส่งงาน judge ไป Worker |
| **OpenAPI** | `src/openapi.ts` | นิยาม spec สำหรับ API docs |

### ลำดับ Middleware (จาก index.ts)

1. Logging (pino-http)
2. Request log → pushLogLine (res.on("finish"))
3. Security (helmet, cors, cookieParser)
4. Body parsing (express.json, urlencoded)
5. Routes (แยกตาม prefix: `/api/auth`, `/api/users`, `/api/problems`, `/api/submissions`, `/api/admin`, `/api/announcements`)

### ข้อมูลและบริการภายนอก

- **Database:** PostgreSQL ผ่าน Prisma ORM (schema ที่ `prisma/schema.prisma`)
- **Auth:** JWT (access token ใน memory/header, refresh token ใน HttpOnly cookie)
- **Queue:** Redis + BullMQ (queue ชื่อ `submission-judge`)
- **External API:** OpenRouter (ใช้ใน chat/AI) ผ่าน `src/lib/openrouter.ts`

### เอกสารที่เกี่ยวข้อง

- Worker และ queue: `docs/WORKER_SYSTEM.md`
- Redis: `docs/REDIS_DESIGN.md`

---

## หน้าบ้าน (Frontend) Architecture

### รูปแบบโดยรวม

- **SPA (Single Page Application)** บน **React + Vite**
- **Client-side routing** (React Router)
- **Component-based:** แบ่งเป็น Pages, Layout, UI components, Services, Store/Context

### โครงสร้างโฟลเดอร์และชั้น

| ส่วน | ที่อยู่ | หน้าที่ |
|------|--------|--------|
| **Entry** | `src/main.tsx`, `src/admin-main.tsx` | ห่อ Provider (Loading, Router), เรนเดอร์ App หรือ Admin app |
| **App / Routing** | `src/App.tsx` | กำหนด `<Routes>`, guard (RequireAuth, RequireAdmin), silent refresh ตอน boot |
| **Pages** | `src/pages/*.tsx`, `src/pages/admin/*.tsx` | หนึ่ง route ต่อหนึ่งหน้า, ดึงข้อมูลผ่าน API แล้วเก็บใน state ของหน้านั้น |
| **Layout** | `src/components/layout/*` | Navbar, PageLayout, AdminPageLayout, Footer, Sidebar |
| **UI Components** | `src/components/ui/*` | StatCard, ProgressBar, Badge, Modal, etc. |
| **Features** | `src/components/chat/*` | ChatBubble (AI chat) |
| **Services** | `src/services/*Api.ts` | เรียก HTTP ไป Backend (auth, problems, submissions, admin, chat, notification) |
| **State** | `src/store/authStore.ts`, `src/contexts/LoadingContext.tsx` | Auth ทั้งแอป (Zustand), Loading ระหว่างเปลี่ยนหน้า (Context) |
| **Hooks** | `src/hooks/useAuth.ts` | ห่อ authStore + authApi (login, logout, …) |
| **Types** | `src/types/index.ts` | TypeScript types ร่วม |

### การไหลของข้อมูล (Data flow)

- **Auth:** หน้าเรียก `useAuth()` หรือ `useAuthStore()` → เรียก `authApi` → อัปเดต `authStore`; ตอนเปิดแอป `App.tsx` ทำ silent refresh
- **ข้อมูลแต่ละหน้า:** หน้าเรียก `*Api.*()` ด้วย `accessToken` จาก store → เก็บผลใน `useState` ของหน้านั้น (ไม่มี global cache แบบ React Query)
- **การเปลี่ยนหน้า:** กดเมนู → ตั้ง loading ผ่าน Context → `navigate()` → Layout แสดง skeleton ตาม loading

### เทคโนโลยีหลัก

- **Build & Dev:** Vite
- **UI:** React, React Router, DaisyUI (Tailwind)
- **State:** Zustand (auth), React Context (loading), useState ตามหน้า
- **HTTP:** fetch ผ่านฟังก์ชันใน `services/*Api.ts`

### เอกสารที่เกี่ยวข้อง

- รายละเอียด state management: `docs/FRONTEND_STATE_MANAGEMENT.md`

---

## สรุปสั้น

| | หลังบ้าน | หน้าบ้าน |
|---|----------|----------|
| **รูปแบบ** | Layered / MVC-style, Monolithic API | SPA, Component-based |
| **Stack หลัก** | Express, Prisma, PostgreSQL, BullMQ, Redis | React, Vite, React Router, Zustand, Context |
| **การแบ่งชั้น** | Routes → Middleware → Controllers → Lib / Queue | Entry → App/Routes → Pages → Components, Services, Store |
