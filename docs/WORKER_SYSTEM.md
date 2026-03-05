## InsightCode – Worker System (Judge Queue)

เอกสารนี้อธิบายระบบ worker ที่ใช้ BullMQ + Redis สำหรับการ judge submission แยกออกจาก HTTP request หลัก

---

### 1. ภาพรวม

เป้าหมายของ worker system:

- ไม่ให้การ judge โค้ด (ซึ่งอาจช้า/เสี่ยง error) ไปบล็อก request หลักของผู้ใช้
- รันโค้ดใน process ที่แยกจาก backend API
- รองรับ retry / backoff / logging ของงาน judge

ส่วนประกอบหลัก:

- **Queue**: `submission-judge` (BullMQ)
- **Worker process**: `worker/src/index.mjs`
- **Internal judge endpoint**: `POST /api/submissions/internal/judge` (ใน Backend)
- **Redis**: เป็น message broker สำหรับ queue

---

### 2. การสร้าง Queue (Backend)

ไฟล์: `Backend/src/queue/judgeQueue.ts`

โค้ดสรุป:

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

คุณสมบัติ:

- ใช้ `REDIS_URL` จาก environment (เช่น `redis://localhost:6379`)
- ตั้งค่า:
  - timeout ต่อ job = 30 วินาที
  - attempts = 3 (retry ได้สูงสุด 3 ครั้ง)
  - backoff = 5 วินาทีระหว่าง retry
  - เก็บ job fail ไว้ดูภายหลัง (removeOnFail=false)

---

### 3. การใส่งานเข้า Queue (สร้าง submission)

ไฟล์: `Backend/src/controllers/submission.controller.ts` ฟังก์ชัน `createSubmission`

โค้ดสรุป:

```ts
export async function createSubmission(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { problemId, language, code } = req.body;

  // validate ...

  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId,
      language,
      code,
      status: "pending",
    },
    // select ...
  });

  await judgeQueue.add("judge", { submissionId: submission.id });

  res.status(201).json({ submission });
}
```

เมื่อ user กด Submit:

1. Backend สร้าง `Submission` status = `"pending"`
2. ส่ง job เข้า queue `submission-judge` ด้วยชื่อ job `"judge"`
3. Worker จะมารับงานต่อ

---

### 4. Worker Process

ไฟล์: `worker/src/index.mjs`

โค้ดสรุป:

```js
import { Worker, QueueEvents } from "bullmq";
import "dotenv/config";

const queueName = "submission-judge";

if (!process.env.REDIS_URL) { ... exit ... }
if (!process.env.BACKEND_URL) { ... exit ... }
if (!process.env.INTERNAL_JUDGE_TOKEN) { ... exit ... }

const connection = {
  connection: {
    url: process.env.REDIS_URL,
  },
};

const worker = new Worker(
  queueName,
  async (job) => {
    const submissionId = job.data?.submissionId;
    if (!submissionId) {
      throw new Error("Job is missing submissionId");
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/submissions/internal/judge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-judge-token": process.env.INTERNAL_JUDGE_TOKEN,
      },
      body: JSON.stringify({ submissionId }),
    });

    if (!response.ok) {
      let message = `Internal judge failed with status ${response.status}`;
      try {
        const data = await response.json();
        if (data?.message) message = data.message;
      } catch {}
      throw new Error(message);
    }

    const payload = await response.json();
    return payload;
  },
  connection
);

// log events: completed/failed/waiting/active
```

**หมายเหตุ**:

- Worker ไม่รัน judge logic เอง แต่เรียกกลับไปที่ Backend ผ่าน internal endpoint (decoupled logic)
- ใช้ `BACKEND_URL` จาก env (เช่น `http://localhost:4000`)
- ใช้ `INTERNAL_JUDGE_TOKEN` เป็น secret header

---

### 5. Internal Judge Endpoint

ไฟล์: `Backend/src/controllers/submission.controller.ts` – ฟังก์ชัน `internalJudgeSubmission`

หน้าที่:

1. ตรวจ header `x-internal-judge-token` ให้ตรงกับค่าใน `.env`
2. โหลด submission จาก DB (รวม problemId, code, language)
3. โหลด problem + testCases
4. เรียก `evaluate(problemId, language, code, includeHidden = true)`
5. ตัดสิน status (`accepted` / `wrong_answer`) และ update:
   - `Submission.status`
   - `Submission.executionTime`
6. เรียก `analyzeCode(code, language)` เพื่อสร้าง/อัปเดต `AiFeedback`
7. คืน JSON `{ submission, evaluation, aiFeedback }` ไปให้ worker (ใช้สำหรับ debug/monitor)

---

### 6. การตั้งค่า Environment

- **Backend/.env**
  - `REDIS_URL="redis://localhost:6379"`
  - `INTERNAL_JUDGE_TOKEN="..."`
  - `DATABASE_URL="postgresql://..."` (สำหรับ Prisma)

- **worker/.env**
  - `REDIS_URL="redis://localhost:6379"`
  - `BACKEND_URL="http://localhost:4000"`
  - `INTERNAL_JUDGE_TOKEN="..."` (ต้องตรงกับ Backend)

---

### 7. การขยายในอนาคต

- เพิ่มประเภทงานอื่นใน queue เดียวกัน หรือ queue ใหม่ (เช่น AI heavy jobs)
- ปรับ worker ให้รองรับการ judge หลายภาษา (เรียก Docker container ต่อภาษา)
- เก็บผล job (success/failure) อย่างละเอียดใน Redis หรือ DB แยกสำหรับ observability

