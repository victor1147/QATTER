import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/attendance", attendanceRoutes);

// Test endpoint
app.get("/auth/test", (req, res) => res.send("Backend is working!"));

// Use Render's PORT or fallback to 5000 for local dev
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
