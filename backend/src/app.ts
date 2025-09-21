import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/error-handler";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (_, callback) => callback(null, true),
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "tiny"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", apiRouter);

app.use(errorHandler);
