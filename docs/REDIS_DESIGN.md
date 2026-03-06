## InsightCode – Redis design

This document describes how Redis is used in InsightCode and the design rationale.

---

### 1. Role of Redis in the system

In this system Redis is used mainly for:

1. **BullMQ queue backend**
   - Storage for the `submission-judge` job queue
   - Holds job data, status, retry, delay, etc.
2. (Future) Caching
   - Caching is not used yet; only the queue uses Redis.

Redis is not used for session storage or general application key-value storage in this version.

---

### 2. Redis configuration

In `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7
    container_name: coding_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

So:

- Redis runs in container `coding_redis`
- Port 6379 is exposed to the host at `localhost:6379`
- Data is persisted in volume `redis_data`

Environment variables:

- Backend: `REDIS_URL="redis://localhost:6379"`
- Worker: `REDIS_URL="redis://localhost:6379"`

---

### 3. Using Redis with BullMQ

- Backend creates `Queue("submission-judge")` using `REDIS_URL`
- Worker creates `Worker("submission-judge")` with the same connection
- BullMQ handles:
  - Job queue (waiting, active, completed, failed)
  - Retry, backoff, delay

#### 3.1 Job lifecycle

1. Backend `createSubmission` calls `judgeQueue.add("judge", { submissionId })`
2. BullMQ stores the new job in Redis (state `waiting`)
3. A worker subscribed to the queue picks the job (state `active`)
4. Worker runs its logic (calls Backend internal judge API)
   - On success: job → `completed` (then removeOnComplete=true → removed)
   - On failure: job → `failed`; BullMQ retries according to config

---

### 4. Monitoring Redis and the queue

`docker-compose.yml` can include:

```yaml
redisinsight:
  image: redis/redisinsight:latest
  container_name: redisinsight
  ports:
    - "5540:5540"
  depends_on:
    - redis
  volumes:
    - redisinsight_data:/db
```

RedisInsight is a UI for inspecting Redis and queue data:

- View Redis keys
- View BullMQ queue/job data
- Useful for debugging judge jobs, inspecting failed or pending jobs

---

### 5. Extending Redis usage

Possible future uses:

- **Caching**  
  Cache `/api/problems` or `/api/admin/stats` to reduce DB load (e.g. TTL keys like `problem:{id}`, `stats:admin`).

- **Rate limiting / throttling**  
  Count requests per IP/user per time window (e.g. for chat/submit abuse prevention).

- **Pub/Sub**  
  Push events to the frontend via a WebSocket gateway or other workers.

Current design focuses on Redis as the queue backend only, to keep the architecture clear and safe for heavy judge workloads.
