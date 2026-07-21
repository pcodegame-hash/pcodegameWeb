import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import { setServers } from "node:dns/promises";
setServers(["8.8.8.8", "1.1.1.1"]); // Uses Google and Cloudflare public DNS

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codegame";

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  message: "Too many requests from this IP, please try again after 15 minutes",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: "Too many authentication requests from this IP, please try again after 15 minutes",
});

app.use(limiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/forum", forumRoutes);

const connectToDatabase = async () => {
  const candidates = [MONGO_URI];
  if (!candidates.includes("mongodb://127.0.0.1:27017/codegame")) {
    candidates.push("mongodb://127.0.0.1:27017/codegame");
  }

  let lastError;

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB Connected via ${uri}`);
      return uri;
    } catch (err) {
      lastError = err;
      console.warn(`MongoDB connection failed for ${uri}: ${err.message}`);
    }
  }

  console.warn("No MongoDB server reachable; auth data will use the local file store fallback.");
  return null;
};

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("Failed to start server", err);
    process.exit(1);
  });