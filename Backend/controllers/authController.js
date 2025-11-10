import jwt from "jsonwebtoken";
import { SECRET } from "../config.js";
import { readDB, writeDB } from "../models/userModel.js";

// Register
export function register(req, res) {
  const { name, matNo, password, role } = req.body;
  if (!name || !matNo || !password || !role)
    return res.status(400).json({ message: "All fields are required" });

  const db = readDB();
  if (db.users.find(u => u.matNo === matNo))
    return res.status(400).json({ message: "Matric number already exists" });

  db.users.push({ name, matNo, password, role });
  writeDB(db);
  res.json({ message: "User registered successfully" });
}

// Login
export function login(req, res) {
  const { matNo, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.matNo === matNo && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ matNo: user.matNo, role: user.role, name: user.name }, SECRET, { expiresIn: "2h" });
  res.json({ message: "Login successful", token, role: user.role, name: user.name });
}
