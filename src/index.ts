import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/prisma.js";
import v1Router from "./routes/v1/index.js";
import { userUploadRouter, listingUploadRouter } from "./routes/v1/upload.routes.js";
import reviewsRouter from "./routes/v1/reviews.routes.js";
import { setupSwagger } from "./config/swagger.js";
import { authenticate } from "./middlewares/auth.middleware.js";
import { deleteReview } from "./controllers/reviews.controller.js";

const app = express();
const PORT = Number(process.env["PORT"]) || 3000;

app.use(compression());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
});

app.use(generalLimiter);
setupSwagger(app);
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date() });
});

app.use("/api/v1", v1Router);
app.use("/api/v1/users", userUploadRouter);
app.use("/api/v1/listings", listingUploadRouter);
app.use("/api/v1/listings/:id/reviews", reviewsRouter);
app.delete("/api/v1/reviews/:id", authenticate, deleteReview);

app.use("/auth", strictLimiter, (req: Request, res: Response) => {
  res.redirect(301, `/api/v1/auth${req.url}`);
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong." });
});

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(` Airbnb API running at http://localhost:${PORT}`);
    console.log(`   v1 API  → http://localhost:${PORT}/api/v1`);
    console.log(`   Health  → http://localhost:${PORT}/health`);
    console.log(`   Docs    → http://localhost:${PORT}/api-docs`);
  });
}

main();