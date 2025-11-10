import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import { PORT } from "./config.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/attendance", attendanceRoutes);

// Test route
app.get("/auth/test", (req, res) => res.send("Backend is working!"));

// Start server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
