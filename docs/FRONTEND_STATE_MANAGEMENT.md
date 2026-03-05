# State Management — หน้าบ้าน (Frontend)

เอกสารนี้อธิบายสถาปัตยกรรมการจัดการ state ของแอป Frontend (React + Vite) โปรเจกต์ InsightCode

---

## ภาพรวม

| ชั้น | เทคโนโลยี | ขอบเขต | ใช้สำหรับ |
|-----|-----------|--------|-----------|
| **Global auth** | Zustand (`authStore`) | ทั้งแอป | ผู้ใช้ล็อกอิน, token, การ guard route |
| **Global UI** | React Context (`LoadingContext`) | ทั้งแอป | สถานะ loading ระหว่างเปลี่ยนหน้า (skeleton) |
| **หน้าหรือคอมโพเนนต์** | `useState` / `useReducer` | ภายในหน้า/คอมโพเนนต์ | ฟอร์ม, รายการจาก API, modal, filter, pagination |

- **ไม่มี** Redux, React Query, หรือ global store สำหรับ server state  
- แต่ละหน้าดึงข้อมูลจาก API แล้วเก็บใน **local state** (useState) ของหน้านั้น

---

## 1. Auth State (Zustand)

**ไฟล์:** `Frontend/src/store/authStore.ts`

### รูปแบบ

- ใช้ **Zustand** (`create`) เป็น store เดียวสำหรับ auth ทั้งแอป
- อ่านผ่าน hook: `useAuthStore()`

### State

| ค่า | ประเภท | ความหมาย |
|----|--------|-----------|
| `user` | `AuthUser \| null` | ข้อมูล user ปัจจุบัน (id, email, role, fullName, …) |
| `accessToken` | `string \| null` | JWT access token ไว้ใส่ใน header ตอนเรียก API |
| `isAuthenticated` | `boolean` | ว่าเข้าสู่ระบบแล้วหรือไม่ |
| `isLoading` | `boolean` | กำลังรอ silent refresh ตอนเปิดแอป (เริ่มต้นเป็น `true`) |

### Actions

| Action | การทำงาน |
|--------|----------|
| `setAuth(user, accessToken)` | ตั้งว่า login สำเร็จ (user + token), ปิด loading |
| `setAccessToken(token)` | อัปเดตเฉพาะ token |
| `updateUser(user)` | อัปเดตข้อมูล user (เช่นหลังแก้ profile) |
| `clearAuth()` | ออกจากระบบ (ล้าง user + token) |
| `setLoading(loading)` | ตั้งสถานะ isLoading (ใช้ตอน boot) |

### การใช้งาน

- **App.tsx**: ใช้ `isAuthenticated`, `isLoading`, `user`, `setAuth`, `clearAuth`, `setLoading` สำหรับ  
  - silent refresh ตอนเปิดแอป  
  - guard route (`RequireAuth`, `RequireAdmin`)  
  - listener `insightcode:auth-expired` → clearAuth + redirect
- **useAuth** (`hooks/useAuth.ts`): ห่อการเรียก `authApi` (login, register, adminLogin, logout, silentRefresh) แล้วอัปเดต store ผ่าน `setAuth` / `clearAuth`
- **หน้าต่างๆ / Navbar**: ใช้ `useAuthStore()` เพื่อเอา `user`, `accessToken`, `isAuthenticated` มาแสดงหรือส่งให้ API

---

## 2. Loading Context (React Context)

**ไฟล์:** `Frontend/src/contexts/LoadingContext.tsx`

### รูปแบบ

- **createContext** + **useState** ภายใน Provider  
- ให้ทั้งแอปใช้สถานะ “กำลังเปลี่ยนหน้า” เพื่อแสดง full-page skeleton

### State & API

| ค่า | ประเภท | ความหมาย |
|----|--------|-----------|
| `loading` | `boolean` | กำลังอยู่ในช่วง “เปลี่ยนหน้า” หรือไม่ |
| `setLoading(value)` | `(value: boolean) => void` | ตั้งค่า loading |

### การให้ Provider

- **User app:** `main.tsx` ห่อ `<App />` ด้วย `<LoadingProvider>`
- **Admin app:** `admin-main.tsx` ห่อด้วย `<LoadingProvider>` เช่นกัน

### การใช้งาน

- **App.tsx**: ก่อน `navigate()` เรียก `setPageLoading(true)` แล้วหลัง ~500ms เรียก `setPageLoading(false)` เพื่อให้เห็น skeleton สั้นๆ ตอนเปลี่ยน route
- **PageLayout** (user): ใช้ `useLoading()` อ่าน `loading` → ถ้า `true` แสดง `<GlobalSkeleton />` แทน children
- **AdminPageLayout**: อ่าน `loading` จาก `useLoading()` เพื่อแสดง skeleton ในส่วน admin
- **AuthPage, ProblemExplorerPage, AdminLoginPage**: เรียก `setLoading` ตอนกดปุ่มหรือก่อนเปลี่ยนหน้า (ตามที่ออกแบบในแต่ละหน้า)

---

## 3. Local State (useState ในหน้า/คอมโพเนนต์)

ข้อมูลที่ “ไม่แชร์ข้ามหน้า” เก็บใน **local state** ของหน้านั้นด้วย `useState` (และบางที่ใช้ `useMemo` สำหรับ derived data)

### แนวปฏิบัติที่ใช้อยู่

- **ข้อมูลจาก API**: แต่ละหน้าดึงเองใน `useEffect` แล้วเก็บใน state เช่น `problems`, `users`, `stats`, `submissions`
- **ฟอร์ม / Modal**: state แยกสำหรับค่าฟอร์ม (เช่น `email`, `password`, `createForm`, `editForm`) และสถานะเปิด/ปิด modal (`showCreateModal`, `showEditModal`, `deleteConfirm`)
- **Filter / Pagination**: เก็บใน state ของหน้านั้น เช่น `search`, `roleFilter`, `currentPage`, `statusFilter`
- **สถานะ async**: ใช้ state แยกสำหรับ loading/error เช่น `loading`, `isSubmitting`, `error`, `saving`

### ตัวอย่างการกระจาย state (โดยสรุป)

| หน้า/คอมโพเนนต์ | State หลัก (นอกจาก auth/loading) |
|------------------|-----------------------------------|
| AuthPage | mode, email, password, fullName, error, isSubmitting, showPassword |
| AdminLoginPage | email, password, adminCode, error, isSubmitting |
| ProblemExplorerPage | difficultyFilter, statusFilter, currentPage, problems, isLoading, progress |
| ProblemWorkspacePage | state (problem, code), language, activeTab, runResult, isRunning, isSubmitting, submissions, codeByLang, … |
| AdminDashboardPage | stats, users, feedback, logs, หลาย loading, search, userPage, selectedUser, modal ประกาศ, cpu/memory/storage (UI) |
| AdminUsersPage | users, loading, search, roleFilter, currentPage, modals, createForm, editForm, saving, deleteConfirm |
| AdminSubmissionsPage | submissions, loading, statusFilter, userSearch, currentPage |
| ProblemListPage (admin) | problems, loading, search, diffFilter, currentPage, modals, createForm, importFile, importing, … |
| ChatBubble | open, messages, input, loading |
| Navbar | isNotifOpen, announcements, notifLoaded |
| UserProfilePage | fullName, avatarUrl, isSaving |

ไม่มีการแชร์ state เหล่านี้ข้ามหน้าผ่าน global store; ถ้าจะใช้ซ้ำต้องส่งเป็น props หรือดึง API ใหม่ในหน้านั้น

---

## 4. Data Flow สรุป

### Auth

1. **เปิดแอป:** `App.tsx` เรียก `authApi.refresh()` (ใช้ HttpOnly cookie) → ได้ accessToken → `authApi.getMe(accessToken)` → `setAuth(user, accessToken)`  
2. **Login/Register/Admin login:** หน้าเรียก `useAuth().login(...)` (หรือ register/adminLogin) → `authApi` → `setAuth(user, accessToken)`  
3. **Logout:** เรียก `authApi.logout()` แล้ว `clearAuth()`  
4. **Token หมดอายุ (401):** บาง API ส่ง event `insightcode:auth-expired` → App listener เรียก `clearAuth()` + toast + `navigate('/')`

### ข้อมูลแต่ละหน้า

- หน้าเรียก API ผ่าน service (เช่น `adminApi`, `authApi`) โดยใช้ `accessToken` จาก `useAuthStore().accessToken`
- ผลลัพธ์เก็บใน state ของหน้านั้น (useState)
- ไม่มี layer แคชหรือ normalized store ร่วมกัน; เปลี่ยนหน้ากลับมาอาจดึง API ใหม่

### การเปลี่ยนหน้า + Loading

- ผู้ใช้กดเมนู → `handleNavigate(page)` (หรือเทียบเท่า) → `setPageLoading(true)` → `navigate(...)` → หลังจาก delay สั้นๆ → `setPageLoading(false)`
- `PageLayout` / `AdminPageLayout` อ่าน `loading` จาก `useLoading()` → แสดง skeleton แทนเนื้อหาเมื่อ `loading === true`

---

## 5. โครงสร้างไฟล์ที่เกี่ยวกับ State

```
Frontend/src/
├── store/
│   └── authStore.ts          # Zustand auth store
├── contexts/
│   └── LoadingContext.tsx    # React Context สำหรับ loading แบบ global
├── hooks/
│   └── useAuth.ts            # ห่อ authStore + authApi (login, logout, …)
├── App.tsx                   # ใช้ authStore + useLoading, route guard, silent refresh
└── main.tsx                  # LoadingProvider ห่อทั้งแอป
```

---

## 6. สรุปสั้นๆ

- **Auth**: Zustand store เดียว (`authStore`) + hook `useAuthStore` / `useAuth`  
- **Loading ระหว่างเปลี่ยนหน้า**: React Context `LoadingContext` + `useLoading`  
- **ข้อมูลหน้าและ UI อื่น**: ใช้ `useState` (และ `useMemo` ถ้าต้องการ) ในแต่ละหน้า/คอมโพเนนต์ ไม่มี global store สำหรับ server state  
- **การไหลของข้อมูล**: API → setState ในหน้า; auth ผ่าน store + event `insightcode:auth-expired` สำหรับ session หมดอายุ
