import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { connectDb } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.use(routes);

app.use(notFound);
app.use(errorHandler);

connectDb()
  .then(() => {
    app.listen(Number(env.PORT), () => {
      // eslint-disable-next-line no-console
      console.log(`Backend listening on :${env.PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to DB", err);
    process.exit(1);
  });
