import { Queue, Worker } from "bullmq";
import { getRedis } from "../config/redis.js";
import { processSubmission } from "../services/submissionProcessor.js";

const QUEUE_NAME = "submissions";

let queue: Queue | null = null;
let worker: Worker | null = null;

function getQueue() {
  if (queue) {
    return queue;
  }
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  queue = new Queue(QUEUE_NAME, { connection: redis });
  return queue;
}

export async function addSubmissionJob(submissionId: string) {
  const q = getQueue();
  if (!q) {
    await processSubmission(submissionId);
    return;
  }
  await q.add("process", { submissionId }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
}

export function initSubmissionWorker() {
  const redis = getRedis();
  if (!redis || worker) {
    return;
  }
  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const submissionId = job.data.submissionId as string;
      await processSubmission(submissionId);
    },
    { connection: redis }
  );
}
