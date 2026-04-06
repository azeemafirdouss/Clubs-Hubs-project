require('dotenv').config();

const express = require("express");
const path = require('path');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { authenticateToken } = require("./middleware");
const Event = require('./models/eventModel');

const app = express();

// ✅ Middleware
app.use(bodyParser.json());
app.use(cors());

// ✅ Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ ENV VARIABLES
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kmit_club_azeem";

// ✅ Debug logs
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("JWT_SECRET:", process.env.JWT_SECRET);

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

// ✅ ROOT ROUTE (Frontend)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ================== SCHEMAS ==================

const studentSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    name: String,
    rollNumber: String,
    joinedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
    isActive: { type: Boolean, default: true }
});
const Student = mongoose.model("Student", studentSchema);

const facultySchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    name: String,
    email: String,
    isActive: { type: Boolean, default: true }
});
const Faculty = mongoose.model("Faculty", facultySchema);

const clubHeadSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    name: String,
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    isActive: { type: Boolean, default: true }
});
const ClubHead = mongoose.model("ClubHead", clubHeadSchema);

const adminSchema = new mongoose.Schema({
    username: String,
    password: String,
    name: String
});
const Admin = mongoose.model("Admin", adminSchema);

const clubSchema = new mongoose.Schema({
    name: String,
    slug: { type: String, unique: true },
    headUsername: String,
    password: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    description: String,
    image: String
});
const Club = mongoose.model("Club", clubSchema);

// ================== AUTH ==================

app.post("/register", async (req, res) => {
  try {
    const { role } = req.body;

    if (role === "student") {
      const { studentUsername, studentPassword } = req.body;

      const hashed = await bcrypt.hash(studentPassword, 10);
      await Student.create({
        username: studentUsername,
        password: hashed,
        name: studentUsername,
        rollNumber: studentUsername
      });

      return res.json({ message: "Student registered" });
    }

    if (role === "faculty") {
      const { facultyEmail, facultyPassword, name } = req.body;

      const hashed = await bcrypt.hash(facultyPassword, 10);
      await Faculty.create({
        username: facultyEmail,
        password: hashed,
        name,
        email: facultyEmail
      });

      return res.json({ message: "Faculty registered" });
    }

    res.status(400).json({ error: "Invalid role" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { role, username, password } = req.body;

    let user;

    if (role === "student") {
      user = await Student.findOne({ username });
    } else if (role === "faculty") {
      user = await Faculty.findOne({ username });
    } else if (role === "admin") {
      if (username === "admin" && password === "admin123$") {
        const token = jwt.sign({ role: "admin" }, JWT_SECRET);
        return res.json({ token });
      }
      return res.status(401).json({ error: "Invalid admin" });
    }

    if (!user) return res.status(401).json({ error: "Invalid user" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user._id, role }, JWT_SECRET);

    res.json({ token, role });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================== CLUBS ==================

app.get("/clubs", async (req, res) => {
  const clubs = await Club.find();
  res.json(clubs);
});

// ================== EVENTS ==================

app.post("/clubhead/events", authenticateToken, async (req, res) => {
  try {
    const clubHead = await ClubHead.findById(req.user.id);

    const event = new Event({
      ...req.body,
      club: clubHead.club,
      status: "pending"
    });

    await event.save();
    res.json({ message: "Event created" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/events/approved", async (req, res) => {
  const events = await Event.find({ status: "approved" }).populate('club', 'name');
  res.json(events);
});

// ================== SERVER ==================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));