## InsightCode – Worker system (judge queue)

This document describes the worker that uses BullMQ + Redis to judge submissions outside the main HTTP request path.

---

### 1. Overview

Goals of the worker system:

- Avoid blocking user requests with slow or error-prone judge work
- Run judge logic in a separate process from the backend API
- Support retry, backoff, and logging for judge jobs

Main pieces:

- **Queue:** `submission-judge` (BullMQ)
- **Worker process:** `worker/src/index.mjs`
- **Internal judge endpoint:** `POST /api/submissions/internal/judge` (on Backend)
- **Redis:** Message broker for the queue

---

### 2. Creating the queue (Backend)

File: `Backend/src/queue/judgeQueue.ts`

Summary:

```ts
import { Queue } from "bullmq";

const connection = {
  connection: {
    url: process.env.REDIS_URL,
  },
};

export const judgeQueue = new Queue("submission-judge", {
  ...connection,
  defaultJobOptions: {
    timeout: 30_000,
    attempts: 3,
    backoff: {
      type: "fixed",
      delay: 5_000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
```

- Uses `REDIS_URL` from environment (e.g. `redis://localhost:6379`)
- Timeout per job: 30s; attempts: 3; backoff: 5s between retries
- Failed jobs are kept for inspection (removeOnFail: false)

---

### 3. Adding jobs to the queue (create submission)

File: `Backend/src/controllers/submission.controller.ts`, function `createSubmission`

When the user clicks Submit:

1. Backend creates a `Submission` with status `"pending"` (or `"queued"`)
2. Adds a job to the `submission-judge` queue with name `"judge"` and data `{ submissionId }`
3. A worker picks up the job

---

### 4. Worker process

File: `worker/src/index.mjs`

The worker:

- Connects to the same Redis with `REDIS_URL`
- Instantiates `Worker("submission-judge", async (job) => { ... })`
- For each job: reads `submissionId`, then `fetch`es `POST ${BACKEND_URL}/api/submissions/internal/judge` with header `x-internal-judge-token` and body `{ submissionId }`
- If the response is not OK, throws so BullMQ can retry
- Returns the JSON payload from the judge endpoint

Note: The worker does not run judge logic itself; it delegates to the Backend internal endpoint (logic stays in one place).

---

### 5. Internal judge endpoint

File: `Backend/src/controllers/submission.controller.ts` – `internalJudgeSubmission`

Responsibilities:

1. Check header `x-internal-judge-token` against `.env`
2. Load submission from DB (problemId, code, language)
3. Load problem + test cases
4. Call `evaluate(problemId, language, code, includeHidden = true)`
5. Set status (`accepted` / `wrong_answer`) and update `Submission.status`, `Submission.executionTime`
6. Call `analyzeCodeWithLLM` (or fallback `analyzeCode`) to create/update `AiFeedback`
7. Return JSON `{ submission, evaluation, aiFeedback }` to the worker

---

### 6. Environment

- **Backend/.env**  
  `REDIS_URL`, `INTERNAL_JUDGE_TOKEN`, `DATABASE_URL`

- **worker/.env**  
  `REDIS_URL`, `BACKEND_URL`, `INTERNAL_JUDGE_TOKEN` (must match Backend)

---

### 7. Future extensions

- Add other job types to the same or new queues (e.g. heavy AI jobs)
- Run per-language executors (e.g. Docker per language) from the worker
- Store job outcome (success/failure) in Redis or a separate DB for observability
