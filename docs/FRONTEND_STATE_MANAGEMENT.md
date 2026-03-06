# State management – Frontend

This document describes the state management approach of the InsightCode frontend (React + Vite).

---

## Overview

| Layer | Technology | Scope | Purpose |
|-------|-------------|--------|---------|
| **Global auth** | Zustand (`authStore`) | App-wide | Logged-in user, token, route guards |
| **Global UI** | React Context (`LoadingContext`) | App-wide | Loading state during navigation (skeleton) |
| **Page / component** | `useState` / `useReducer` | Within page/component | Forms, API lists, modals, filters, pagination |

- There is **no** Redux, React Query, or global store for server state.
- Each page fetches from the API and keeps data in **local state** (useState).

---

## 1. Auth state (Zustand)

**File:** `Frontend/src/store/authStore.ts`

- Single **Zustand** store for auth, used via `useAuthStore()`.

### State

| Field | Type | Meaning |
|-------|------|---------|
| `user` | `AuthUser \| null` | Current user (id, email, role, fullName, …) |
| `accessToken` | `string \| null` | JWT access token for API headers |
| `isAuthenticated` | `boolean` | Whether the user is logged in |
| `isLoading` | `boolean` | Waiting for silent refresh on app load (starts true) |

### Actions

| Action | Effect |
|--------|--------|
| `setAuth(user, accessToken)` | Set logged-in state and turn off loading |
| `setAccessToken(token)` | Update token only |
| `updateUser(user)` | Update user (e.g. after profile edit) |
| `clearAuth()` | Log out (clear user + token) |
| `setLoading(loading)` | Set isLoading (used on boot) |

### Usage

- **App.tsx:** Uses auth state for silent refresh, route guards (`RequireAuth`, `RequireAdmin`), and `insightcode:auth-expired` → clearAuth + redirect.
- **useAuth** (`hooks/useAuth.ts`): Wraps `authApi` (login, register, adminLogin, logout, silentRefresh) and updates the store.
- **Pages / Navbar:** Use `useAuthStore()` for `user`, `accessToken`, `isAuthenticated`.

---

## 2. Loading context (React Context)

**File:** `Frontend/src/contexts/LoadingContext.tsx`

- **createContext** + **useState** in a Provider to expose a global “navigating” state for full-page skeleton.

### State & API

| Field | Type | Meaning |
|-------|------|---------|
| `loading` | `boolean` | Whether we are in a “navigating” period |
| `setLoading(value)` | `(value: boolean) => void` | Set loading |

### Provider

- User app: `main.tsx` wraps `<App />` with `<LoadingProvider>`
- Admin app: `admin-main.tsx` also wraps with `<LoadingProvider>`

### Usage

- **App.tsx:** Before `navigate()` calls `setPageLoading(true)`, then after a short delay `setPageLoading(false)` so a brief skeleton shows on route change.
- **PageLayout / AdminPageLayout:** Read `loading` from `useLoading()`; when true, show `<GlobalSkeleton />` instead of children.

---

## 3. Local state (useState in pages/components)

Data that is not shared across pages lives in **local state** with `useState` (and sometimes `useMemo` for derived data).

### Current practice

- **API data:** Each page fetches in `useEffect` and stores in state (e.g. `problems`, `users`, `submissions`).
- **Forms / modals:** Separate state for form values and open/close (e.g. `showCreateModal`, `deleteConfirm`).
- **Filters / pagination:** In that page’s state (e.g. `search`, `currentPage`, `statusFilter`).
- **Async state:** Separate state for loading/error (e.g. `loading`, `isSubmitting`, `error`).

There is no global sharing of this state; reuse is via props or refetch on the target page.

---

## 4. Data flow summary

### Auth

1. **App load:** `App.tsx` calls `authApi.refresh()` (HttpOnly cookie) → gets accessToken → `authApi.getMe(accessToken)` → `setAuth(user, accessToken)`.
2. **Login/Register/Admin login:** Page calls `useAuth().login(...)` (or register/adminLogin) → `authApi` → `setAuth(user, accessToken)`.
3. **Logout:** Call `authApi.logout()` then `clearAuth()`.
4. **Token expired (401):** Some API responses dispatch `insightcode:auth-expired` → App listener runs `clearAuth()` + toast + `navigate('/')`.

### Per-page data

- Page calls API via services (e.g. `adminApi`, `authApi`) with `accessToken` from `useAuthStore().accessToken`.
- Result is stored in that page’s state (useState).
- No shared cache or normalized store; returning to a page may refetch.

### Navigation and loading

- User clicks nav → `handleNavigate(page)` → `setPageLoading(true)` → `navigate(...)` → after a short delay → `setPageLoading(false)`.
- PageLayout / AdminPageLayout read `loading` from `useLoading()` and show skeleton when `loading === true`.

---

## 5. Files involved in state

```
Frontend/src/
├── store/
│   └── authStore.ts          # Zustand auth store
├── contexts/
│   └── LoadingContext.tsx    # Global loading state
├── hooks/
│   └── useAuth.ts            # Wraps authStore + authApi
├── App.tsx                   # Uses authStore + useLoading, route guards, silent refresh
└── main.tsx                  # LoadingProvider wraps app
```

---

## 6. Summary

- **Auth:** Single Zustand store (`authStore`) + `useAuthStore` / `useAuth`.
- **Navigation loading:** React Context `LoadingContext` + `useLoading`.
- **Page and UI data:** `useState` (and `useMemo` when needed) per page/component; no global server-state store.
- **Flow:** API → setState in page; auth via store + `insightcode:auth-expired` for session expiry.
