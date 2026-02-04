import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/db.js";
import { initSubmissionWorker } from "./queue/submissionQueue.js";

async function bootstrap() {
  await connectMongo();
  initSubmissionWorker();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`API listening on :${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
