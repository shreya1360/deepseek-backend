import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/user.route.js";
import promptRoutes from "./routes/prompt.route.js";
dotenv.config();
const app = express();
const port = process.env.PORT || 4001;

const MONGO_URL = process.env.MONGODB_URI;

// middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// db coonection code
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.log("MongoDB Connection Error:", error));
app.get("/", (req, res) => {
  res.send("Hello Rishabh mishra Shreya mishra!");
});

// routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/deepseekai", promptRoutes);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
