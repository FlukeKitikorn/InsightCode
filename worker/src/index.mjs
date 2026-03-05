import { Worker, QueueEvents } from "bullmq";
import "dotenv/config";

const queueName = "submission-judge";

if (!process.env.REDIS_URL) {
  console.error("[worker] REDIS_URL is not set in .env");
  process.exit(1);
}

if (!process.env.BACKEND_URL) {
  console.error("[worker] BACKEND_URL is not set in .env");
  process.exit(1);
}

if (!process.env.INTERNAL_JUDGE_TOKEN) {
  console.error("[worker] INTERNAL_JUDGE_TOKEN is not set in .env");
  process.exit(1);
}

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
        if (data?.message) {
          message = data.message;
        }
      } catch {
        // ignore json parse errors
      }
      throw new Error(message);
    }

    const payload = await response.json();
    return payload;
  },
  { ...connection, lockDuration: 30_000 }
);

worker.on("completed", (job) => {
  // eslint-disable-next-line no-console
  console.log(`[worker] Job ${job.id} for submission ${job.data?.submissionId} completed`);
});

worker.on("failed", (job, err) => {
  // eslint-disable-next-line no-console
  console.error(
    `[worker] Job ${job?.id} for submission ${job?.data?.submissionId} failed:`,
    err?.message
  );
});

const events = new QueueEvents(queueName, connection);

events.on("waiting", ({ jobId }) => {
  // eslint-disable-next-line no-console
  console.log(`[worker] Job waiting: ${jobId}`);
});

events.on("active", ({ jobId }) => {
  // eslint-disable-next-line no-console
  console.log(`[worker] Job active: ${jobId}`);
});

events.on("completed", ({ jobId }) => {
  // eslint-disable-next-line no-console
  console.log(`[worker] Job completed (events): ${jobId}`);
});

events.on("failed", ({ jobId, failedReason }) => {
  // eslint-disable-next-line no-console
  console.error(`[worker] Job failed (events): ${jobId} – ${failedReason}`);
});

// eslint-disable-next-line no-console
console.log(`[worker] Listening on queue "${queueName}" with Redis ${process.env.REDIS_URL}`);

