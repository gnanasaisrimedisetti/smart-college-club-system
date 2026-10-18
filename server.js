const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const initialData = {
  students: [
    { id: 1, name: "Aarav Kumar", rollNo: "CS001", department: "CSE", year: 2 },
    { id: 2, name: "Diya Sharma", rollNo: "CS002", department: "CSE", year: 2 },
    { id: 3, name: "Rohan Patel", rollNo: "DS003", department: "Data Science", year: 2 },
    { id: 4, name: "Ananya Das", rollNo: "IT004", department: "IT", year: 3 },
    { id: 5, name: "Ishaan Rao", rollNo: "CS005", department: "CSE", year: 1 }
  ],
  clubs: [
    { id: 1, name: "Coding Club", category: "Technology" },
    { id: 2, name: "Photography Club", category: "Arts" },
    { id: 3, name: "Eco Club", category: "Environment" }
  ],
  memberships: [
    { studentId: 1, clubId: 1 }, { studentId: 1, clubId: 2 },
    { studentId: 2, clubId: 1 }, { studentId: 2, clubId: 3 },
    { studentId: 3, clubId: 1 }, { studentId: 3, clubId: 2 },
    { studentId: 4, clubId: 2 }, { studentId: 4, clubId: 3 },
    { studentId: 5, clubId: 3 }
  ],
  events: [
    { id: 1, name: "Inter-College Hackathon", date: "2026-11-15", venue: "Innovation Lab", requiredClubIds: [1] },
    { id: 2, name: "Campus Photo Walk", date: "2026-11-20", venue: "Main Campus", requiredClubIds: [2] },
    { id: 3, name: "Green Campus Drive", date: "2026-11-25", venue: "Campus Garden", requiredClubIds: [3] },
    { id: 4, name: "Creative Tech Showcase", date: "2026-12-02", venue: "Auditorium", requiredClubIds: [1, 2] }
  ]
};

function normalizeText(value, fieldName) {
  if (value === undefined || value === null) throw new Error(`${fieldName} is required.`);
  const text = String(value).trim();
  if (!text) throw new Error(`${fieldName} is required.`);
  return text;
}

function normalizeId(value, fieldName) {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 1) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return numericValue;
}

function sanitizeClubIds(value) {
  const rawIds = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return [...new Set(rawIds
    .map(item => Number(item))
    .filter(item => Number.isInteger(item) && item > 0)
  )];
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    return JSON.parse(JSON.stringify(initialData));
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
    if (!raw) throw new Error("Data file is empty.");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("Data file is invalid.");
    return {
      students: Array.isArray(parsed.students) ? parsed.students : JSON.parse(JSON.stringify(initialData.students)),
      clubs: Array.isArray(parsed.clubs) ? parsed.clubs : JSON.parse(JSON.stringify(initialData.clubs)),
      memberships: Array.isArray(parsed.memberships) ? parsed.memberships : [],
      events: Array.isArray(parsed.events) ? parsed.events : []
    };
  } catch (error) {
    const fallback = JSON.parse(JSON.stringify(initialData));
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}
let db = loadData();
function save() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }
function nextId(items) { return items.reduce((max, x) => Math.max(max, x.id || 0), 0) + 1; }
function studentById(id) { return db.students.find(s => s.id === Number(id)); }
function clubById(id) { return db.clubs.find(c => c.id === Number(id)); }
function memberIds(clubId) {
  return new Set(db.memberships.filter(m => m.clubId === Number(clubId)).map(m => m.studentId));
}
function studentList(ids) { return [...ids].map(studentById).filter(Boolean); }

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/students", (req, res) => res.json(db.students));
app.post("/api/students", (req, res) => {
  try {
    const { name, rollNo, department, year } = req.body;
    const safeName = normalizeText(name, "Name");
    const safeRollNo = normalizeText(rollNo, "Roll number");
    const safeDepartment = normalizeText(department, "Department");
    const safeYear = Number(year);
    if (!Number.isInteger(safeYear) || safeYear < 1) return res.status(400).json({ error: "Please provide a valid year." });
    if (db.students.some(s => s.rollNo.toLowerCase() === safeRollNo.toLowerCase())) return res.status(409).json({ error: "That roll number already exists." });
    const student = { id: nextId(db.students), name: safeName, rollNo: safeRollNo, department: safeDepartment, year: safeYear };
    db.students.push(student); save(); res.status(201).json(student);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
app.delete("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!studentById(id)) return res.status(404).json({ error: "Student not found." });
  db.students = db.students.filter(s => s.id !== id);
  db.memberships = db.memberships.filter(m => m.studentId !== id);
  save(); res.json({ message: "Student and their memberships removed." });
});

app.get("/api/clubs", (req, res) => res.json(db.clubs));
app.post("/api/clubs", (req, res) => {
  try {
    const { name, category } = req.body;
    const safeName = normalizeText(name, "Club name");
    const safeCategory = normalizeText(category, "Category");
    if (db.clubs.some(c => c.name.toLowerCase() === safeName.toLowerCase())) return res.status(409).json({ error: "A club with that name already exists." });
    const club = { id: nextId(db.clubs), name: safeName, category: safeCategory };
    db.clubs.push(club); save(); res.status(201).json(club);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
app.delete("/api/clubs/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!clubById(id)) return res.status(404).json({ error: "Club not found." });
  db.clubs = db.clubs.filter(c => c.id !== id);
  db.memberships = db.memberships.filter(m => m.clubId !== id);
  db.events.forEach(e => {
    e.requiredClubIds = Array.isArray(e.requiredClubIds) ? e.requiredClubIds.filter(cid => cid !== id) : [];
  });
  save(); res.json({ message: "Club and related memberships removed." });
});

app.get("/api/memberships", (req, res) => res.json(db.memberships.map(m => ({ ...m, student: studentById(m.studentId), club: clubById(m.clubId) }))));
app.post("/api/memberships", (req, res) => {
  try {
    const studentId = normalizeId(req.body.studentId, "Student");
    const clubId = normalizeId(req.body.clubId, "Club");
    if (!studentById(studentId) || !clubById(clubId)) return res.status(400).json({ error: "Choose an existing student and club." });
    if (db.memberships.some(m => m.studentId === studentId && m.clubId === clubId)) return res.status(409).json({ error: "This student is already a member of that club." });
    db.memberships.push({ studentId, clubId }); save(); res.status(201).json({ message: "Membership added." });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
app.delete("/api/memberships", (req, res) => {
  const studentId = Number(req.query.studentId), clubId = Number(req.query.clubId);
  const before = db.memberships.length;
  db.memberships = db.memberships.filter(m => !(m.studentId === studentId && m.clubId === clubId));
  if (before === db.memberships.length) return res.status(404).json({ error: "Membership not found." });
  save(); res.json({ message: "Membership removed." });
});

app.get("/api/events", (req, res) => res.json(db.events.map(e => ({ ...e, requiredClubs: e.requiredClubIds.map(clubById).filter(Boolean) }))));
app.post("/api/events", (req, res) => {
  try {
    const { name, date, venue, requiredClubIds = [] } = req.body;
    const safeName = normalizeText(name, "Event name");
    const safeDate = normalizeText(date, "Date");
    const safeVenue = normalizeText(venue, "Venue");
    const ids = sanitizeClubIds(requiredClubIds);
    if (ids.some(id => !clubById(id))) return res.status(400).json({ error: "One or more selected clubs do not exist." });
    const event = { id: nextId(db.events), name: safeName, date: safeDate, venue: safeVenue, requiredClubIds: ids };
    db.events.push(event); save(); res.status(201).json(event);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
app.delete("/api/events/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!db.events.some(e => e.id === id)) return res.status(404).json({ error: "Event not found." });
  db.events = db.events.filter(e => e.id !== id); save(); res.json({ message: "Event deleted." });
});

// Set operations: union, intersection, and A minus B.
app.get("/api/analysis", (req, res) => {
  const aId = Number(req.query.clubA), bId = Number(req.query.clubB);
  if (!clubById(aId) || !clubById(bId)) return res.status(400).json({ error: "Choose two valid clubs." });
  const A = memberIds(aId), B = memberIds(bId);
  const union = new Set([...A, ...B]);
  const intersection = new Set([...A].filter(id => B.has(id)));
  const onlyA = new Set([...A].filter(id => !B.has(id)));
  const onlyB = new Set([...B].filter(id => !A.has(id)));
  res.json({
    clubA: clubById(aId), clubB: clubById(bId),
    counts: { a: A.size, b: B.size, union: union.size, intersection: intersection.size, onlyA: onlyA.size, onlyB: onlyB.size },
    sets: { a: studentList(A), b: studentList(B), union: studentList(union), intersection: studentList(intersection), onlyA: studentList(onlyA), onlyB: studentList(onlyB) }
  });
});
app.get("/api/events/:id/eligible", (req, res) => {
  const event = db.events.find(e => e.id === Number(req.params.id));
  if (!event) return res.status(404).json({ error: "Event not found." });
  const requiredClubIds = Array.isArray(event.requiredClubIds) ? event.requiredClubIds : [];
  // Eligibility rule: student must belong to EVERY club required by the event.
  const eligible = db.students.filter(student => requiredClubIds.every(cid =>
    db.memberships.some(m => m.studentId === student.id && m.clubId === cid)
  ));
  res.json({ event, eligible, rule: "A student must be a member of every club required by this event." });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`Smart College Club System running at http://localhost:${PORT}`));
