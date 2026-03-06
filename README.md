# InsightCode

Online coding practice platform with automated judging and AI-powered code feedback.

---

## What's included

- **Users** – Register/login, pick problems, write code (Run / Submit), view test results and AI feedback, use AI chat for hints
- **Admins** – View stats, manage users / problems / announcements, browse submissions and AI insights
- **Judge** – Runs code against test cases (JavaScript/TypeScript), job queue via Redis + Worker
- **AI** – Code analysis (LLM + rule-based fallback), tutoring chat (OpenRouter)

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, React Router, Zustand, Tailwind, DaisyUI, CodeMirror |
| Backend | Node.js, Express, Prisma, PostgreSQL, JWT (access + refresh), BullMQ |
| Worker | Node.js, BullMQ (consumes Redis queue, calls internal judge API) |
| Queue | Redis (BullMQ backend) |
| AI | OpenRouter (Gemini/Claude etc.) for chat and code analysis |

---

## Project structure

```
InsightCode/
├── Backend/          # Express API, Prisma, queue
├── Frontend/         # React SPA (user + admin)
├── worker/           # BullMQ judge worker
├── docs/             # Architecture, PRD, guides
└── docker-compose.yml
```

---

## Quick start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (or Docker)

### Backend

```bash
cd Backend
cp .env.example .env   # Set DATABASE_URL, JWT secrets, REDIS_URL, OPENROUTER_API_KEY, etc.
npm install
npx prisma generate
npx prisma db push     # or migrate dev
npm run dev
```

Runs at `http://localhost:4000` by default.

### Worker (for judging submissions)

```bash
cd worker
cp .env.example .env   # REDIS_URL, BACKEND_URL, INTERNAL_JUDGE_TOKEN
npm install
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Redis (if not already running)

```bash
docker compose up -d redis
```

---

## Key environment variables

| Variable | Used by | Example |
|----------|---------|---------|
| `DATABASE_URL` | Backend | `postgresql://user:pass@localhost:5432/insightcode` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Backend | JWT signing secrets |
| `REDIS_URL` | Backend, Worker | `redis://localhost:6379` |
| `BACKEND_URL` | Worker | `http://localhost:4000` |
| `INTERNAL_JUDGE_TOKEN` | Backend, Worker | Secret for internal judge endpoint |
| `OPENROUTER_API_KEY` | Backend | AI chat and code analysis |

See `.env.example` in each folder for full lists.

---

## Documentation

All docs (architecture, PRD, Worker, Redis, Frontend, supported languages, etc.) live in **[docs/](docs/README.md)** — index at [docs/README.md](docs/README.md).

- **OpenAPI (Swagger)** – After starting Backend: [http://localhost:4000/api-docs/openapi.json](http://localhost:4000/api-docs/openapi.json)

---

## License

ISC (or as specified in the project)
