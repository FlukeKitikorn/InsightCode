import { Queue } from "bullmq";

const connection = {
  connection: {
    url: process.env.REDIS_URL,
  },
};

export const judgeQueue = new Queue("submission-judge", {
  ...connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "fixed",
      delay: 5_000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

