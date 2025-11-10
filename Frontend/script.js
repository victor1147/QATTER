/* ===================================
   QATTER QR Attendance WebApp JS
   Backend Integrated Version
   =================================== */

const API_URL = "http://localhost:5000"; // Update if deployed

/* ---------- Navigation ---------- */
function goToLogin() { window.location.href = "login.html"; }
function goToSignUp() { window.location.href = "signup.html"; }

/* ---------- Signup ---------- */
async function signup(event) {
  event.preventDefault();
  const name = document.getElementById("name").value.trim();
  const matNo = document.getElementById("mat-no").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const messageDiv = document.getElementById("signupMessage");

  if (!name || !matNo || !password || !role) {
    messageDiv.style.color = "#ffd700";
    messageDiv.textContent = "All fields are required!";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, matNo, password, role })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);
    messageDiv.style.color = "lightgreen";
    messageDiv.textContent = "Sign-up successful! Redirecting...";
    setTimeout(() => goToLogin(), 1500);
  } catch (err) {
    messageDiv.style.color = "#ff6b6b";
    messageDiv.textContent = err.message;
  }
}

/* ---------- Login ---------- */
async function login(event) {
  event.preventDefault();
  const matNo = document.getElementById("mat-no").value.trim();
  const password = document.getElementById("password").value.trim();
  const messageDiv = document.getElementById("loginMessage");

  if (!matNo || !password) {
    messageDiv.style.color = "#ffd700";
    messageDiv.textContent = "All fields are required!";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matNo, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    // Store JWT and user info
    localStorage.setItem("token", data.token);
    localStorage.setItem("currentUser", JSON.stringify({ matNo, role: data.role, name: data.name }));

    messageDiv.style.color = "lightgreen";
    messageDiv.textContent = "Login successful! Redirecting...";
    setTimeout(() => {
      if (data.role === "student") window.location.href = "student-dashboard.html";
      else window.location.href = "lecturer-dashboard.html";
    }, 1000);
  } catch (err) {
    messageDiv.style.color = "#ff6b6b";
    messageDiv.textContent = err.message;
  }
}

/* ---------- Logout ---------- */
function logout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/* ---------- Display Current User ---------- */
function displayCurrentUser(elementId) {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (user) document.getElementById(elementId).textContent = `Welcome, ${user.name}`;
}

/* ---------- Lecturer: QR Generation & Attendance ---------- */
let qrSessionInterval = null;
let currentQRCode = "";

function generateQR() {
  const course = document.getElementById("course").value.trim();
  const courseError = document.getElementById("courseError");

  if (!course) {
    courseError.textContent = "Please enter a course code!";
    return;
  }
  courseError.textContent = "";

  updateQRCode(course);

  if (qrSessionInterval) clearInterval(qrSessionInterval);
  qrSessionInterval = setInterval(() => updateQRCode(course), 30000);
}

function updateQRCode(course) {
  const qrContainer = document.getElementById("qrcode");
  qrContainer.innerHTML = "";

  const canvas = document.createElement("canvas");
  qrContainer.appendChild(canvas);

  currentQRCode = course + "-" + Date.now();

  QRCode.toCanvas(canvas, currentQRCode, function (error) {
    if (error) console.error("QR generation error:", error);
  });

  let timeLeft = 30;
  const timer = document.getElementById("timer");
  timer.textContent = `QR expires in: ${timeLeft}s`;

  if (timer.countdownInterval) clearInterval(timer.countdownInterval);
  timer.countdownInterval = setInterval(() => {
    timeLeft--;
    timer.textContent = `QR expires in: ${timeLeft}s`;
    if (timeLeft <= 0) clearInterval(timer.countdownInterval);
  }, 1000);
}

/* ---------- Student: Scan QR & Mark Attendance ---------- */
function startStudentScanner() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) return;

  function onScanSuccess(decodedText) {
    markAttendanceBackend(currentUser.matNo, decodedText, currentUser.name);
  }

  const html5QrcodeScanner = new Html5Qrcode("reader");
  html5QrcodeScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    onScanSuccess
  ).catch(err => console.error(err));
}

async function markAttendanceBackend(matNo, sessionID, name) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ matNo, sessionID, name, course: sessionID.split("-")[0] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // Refresh tables
    updateLecturerTable();
    updateStudentTable();
  } catch (err) {
    console.error("Attendance error:", err.message);
  }
}

/* ---------- Fetch & Display Lecturer Table ---------- */
async function updateLecturerTable() {
  const tbody = document.querySelector("#attendanceTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/attendance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const attendanceData = await res.json();

    if (!attendanceData.length) {
      tbody.innerHTML = "<tr><td colspan='4'>No attendance yet</td></tr>";
      return;
    }

    attendanceData.forEach((entry, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.name}</td>
        <td>${entry.matNo}</td>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

/* ---------- Fetch & Display Student Table ---------- */
async function updateStudentTable() {
  const tbody = document.querySelector("#studentAttendanceTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/attendance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const attendanceData = await res.json();

    const studentRecords = attendanceData.filter(a => a.matNo === currentUser.matNo);
    if (!studentRecords.length) {
      tbody.innerHTML = "<tr><td colspan='4'>No attendance yet</td></tr>";
      return;
    }

    studentRecords.forEach((entry, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.name}</td>
        <td>${entry.matNo}</td>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

/* ---------- Export Functions (Lecturer) ---------- */
async function exportToExcel() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/attendance`, { headers: { Authorization: `Bearer ${token}` } });
    const attendanceData = await res.json();
    if (!attendanceData.length) return alert("No data to export");

    const ws = XLSX.utils.json_to_sheet(attendanceData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "attendance.xlsx");
  } catch (err) { console.error(err); }
}

async function exportToPDF() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/attendance`, { headers: { Authorization: `Bearer ${token}` } });
    const attendanceData = await res.json();
    if (!attendanceData.length) return alert("No data to export");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(12);
    doc.text("Attendance Sheet", 10, y);
    y += 10;

    attendanceData.forEach((entry, index) => {
      doc.text(`${index + 1}. ${entry.name} | ${entry.matNo} | ${new Date(entry.timestamp).toLocaleString()}`, 10, y);
      y += 8;
    });

    doc.save("attendance.pdf");
  } catch (err) { console.error(err); }
}

/* ---------- Initialize on Page Load ---------- */
document.addEventListener("DOMContentLoaded", () => {
  displayCurrentUser("welcomeMessage");
  updateLecturerTable();
  updateStudentTable();
  if (document.getElementById("reader")) startStudentScanner();
});
