# InsightCode – Frontend

React SPA for users and admins of the InsightCode platform (coding practice + judge + AI feedback).

---

## Stack

- **React 19** + **Vite 7**
- **React Router** – main routing
- **Zustand** – global auth state
- **Tailwind CSS** + **DaisyUI**
- **CodeMirror** (via `@uiw/react-codemirror`) – code editor

---

## How to run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (or the port Vite reports).

Backend must be running at `http://localhost:4000` (or update `API_BASE` in `src/services/*.ts`).

---

## Main structure

```
src/
├── App.tsx           # Routes, auth guard, silent refresh
├── main.tsx          # Entry (LoadingProvider, BrowserRouter)
├── pages/            # Main pages (Auth, Problems, Workspace, Analytics, Profile, Admin)
├── components/       # layout (Navbar, Footer, PageLayout), chat, ui
├── services/         # API calls (authApi, problemsApi, submissionApi, adminApi, chatApi, notificationApi)
├── store/            # authStore (Zustand)
├── hooks/            # useAuth
├── contexts/         # LoadingContext
└── types/            # TypeScript types
```

---

## Build

```bash
npm run build
```

Output in `dist/` for deployment to a static host or behind a reverse proxy to the Backend.
