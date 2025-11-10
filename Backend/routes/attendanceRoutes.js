import express from "express";
import { markAttendance, getAttendance } from "../controllers/attendanceController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, markAttendance);
router.get("/", authenticate, getAttendance);

export default router;
