import "dotenv/config";
import express, { Request, Response } from "express";
import { connectDB } from "./config/prisma.js";
import authRouter from "./routes/auth.routes.js";
import usersRouter from "./routes/users.routes.js";
import listingsRouter from "./routes/listings.routes.js";
import bookingsRouter from "./routes/bookings.routes.js";
import { userUploadRouter, listingUploadRouter } from "./routes/upload.routes.js";
import { setupSwagger } from "./config/swagger.js";
const app = express();
const PORT = 3000;
setupSwagger(app);
app.use(express.json());
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/users", userUploadRouter);
app.use("/listings", listingsRouter);
app.use("/listings", listingUploadRouter);
app.use("/bookings", bookingsRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(` Airbnb API running at http://localhost:${PORT}`);
    console.log(`   Auth     → http://localhost:${PORT}/auth`);
    console.log(`   Users    → http://localhost:${PORT}/users`);
    console.log(`   Listings → http://localhost:${PORT}/listings`);
    console.log(`   Bookings → http://localhost:${PORT}/bookings`);
  });
}

main();