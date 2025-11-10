import { readDB, writeDB } from "../models/userModel.js";

// Record attendance
export function markAttendance(req, res) {
  const { sessionID, course } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.matNo === req.user.matNo);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Prevent duplicate
  if (db.attendance.some(a => a.sessionID === sessionID && a.studentID === user.matNo))
    return res.status(400).json({ message: "Attendance already marked" });

  db.attendance.push({
    serial: db.attendance.length + 1,
    name: user.name,
    studentID: user.matNo,
    sessionID,
    course,
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ message: "Attendance recorded successfully" });
}

// Get attendance list
export function getAttendance(req, res) {
  const db = readDB();
  res.json(db.attendance);
}
