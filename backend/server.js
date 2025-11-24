// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { fetchCourses } from "./fetchcompetitions.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files from ../frontend when in same repo
app.use(express.static(path.join(__dirname, "../frontend")));

// Simple in-memory cache
let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 1000 * 60 * 5); // 5 minutes default

app.get("/api/courses", async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && (now - cache.fetchedAt) < CACHE_TTL_MS) {
      return res.json(cache.data);
    }

    const start = Number(req.query.start || 0);
    const limit = Math.min(200, Number(req.query.limit || 100));
    const items = await fetchCourses({ start, limit });
    cache = { data: items, fetchedAt: Date.now() };
    res.json(items);
  } catch (err) {
    console.error("Error /api/courses:", err);
    res.status(502).json({ error: "Failed to fetch remote data", details: err.message });
  }
});

// Serve index.html for any unknown route (single page app)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
