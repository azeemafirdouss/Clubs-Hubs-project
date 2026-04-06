require('dotenv').config();
// ADD THESE LINES FOR THE TEST
console.log("--- DOTENV TEST ---");
console.log("MONGO_URI Variable:", process.env.MONGO_URI);
console.log("JWT_SECRET Variable:", process.env.JWT_SECRET);
console.log("---------------------");

const express = require("express");
const path = require('path');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// Make sure you have this middleware file
const { authenticateToken } = require("./middleware");
const Event = require('./models/eventModel');

const app = express();
app.use(express.static(path.join(__dirname, '../frontend')));

// Configure 
// const JWT_SECRET = process.env.JWT_SECRET;
// // const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kmit_club_azeem";
// MONGO_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxx.mongodb.net/kmit_club_azeem
// Configure 
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-testing";
const MONGO_URI = process.env.MONGO_URI ;
app.use(bodyParser.json());
app.use(cors());
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing!");
  process.exit(1);
}

// Serve the frontend files from the frontend/ folder so you can open pages at
// http://localhost:5000/register.html and avoid file:// origin / CORB issues.
// app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB connection
mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Simple health endpoint to verify server is up    
// app.get('/', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handlers to help diagnose crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // optional: process.exit(1);
});

// Validation functions
const validateStudentRollNo = (rollNo) => {
  const pattern = /^(22|23|24|25)BD1A05[A-G][0-9]$/;
  return pattern.test(rollNo);
};

const validateFacultyEmail = (email) => {
  const pattern = /^[A-Za-z]{5,15}[0-9]{0,3}@gmail\.com$/;
  return pattern.test(email);
};

const validateFacultyName = (name) => {
  const pattern = /^[A-Za-z]{1,20}$/;
  return pattern.test(name);
};

const validateFacultyPassword = (password) => {
  const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{10,}$/;
  return pattern.test(password);
};

const validateClubPassword = (password) => {
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  return pattern.test(password);
};

const validateClubHeadUsername = (username) => {
  // allow either "-Head" or "-head" (case-insensitive)
  const pattern = /^[A-Za-z]+-Head$/i;
  return pattern.test(username);
};

// Helper to escape user-controlled strings before placing into RegExp
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Student Schema
const studentSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    name: String,
    rollNumber: String,
    joinedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
    isActive: { type: Boolean, default: true }  // ← ADD THIS
});
const Student = mongoose.model("Student", studentSchema);

// Faculty Schema
const facultySchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    name: String,
    email: String,
     isActive: { type: Boolean, default: true } 
});
const Faculty = mongoose.model("Faculty", facultySchema);

// ClubHead Schema
const clubHeadSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    name: String,
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
     isActive: { type: Boolean, default: true } 
});
const ClubHead = mongoose.model("ClubHead", clubHeadSchema);

// Admin Schema
const adminSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    name: String
});
const Admin = mongoose.model("Admin", adminSchema);

// Club Schema
const clubSchema = new mongoose.Schema({
    name: String,
    slug: { type: String, unique: true, required: true },
    headUsername: { type: String, unique: true, sparse: true }, // sparse allows null
    password: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    description: String,
    image: String
});
const Club = mongoose.model("Club", clubSchema);

// REGISTER endpoint
app.post("/register", async (req, res) => {
  try {
    const { role } = req.body;
    
    if (role === "student") {
      const { studentUsername, studentPassword } = req.body;
      
      // Validate format
      if (!validateStudentRollNo(studentUsername)) {
        return res.status(400).json({ error: "❌ Invalid Roll No format. Use format like: 23BD1A05C7" });
      }
      
      // Check if password matches roll no
      if (studentPassword !== studentUsername) {
        return res.status(400).json({ error: "❌ Password must match Roll No" });
      }
      
      // Check if user already exists
      const existingStudent = await Student.findOne({ username: studentUsername });
      if (existingStudent) {
        return res.status(400).json({ error: "❌ Student already exists" });
      }

      const hashedPassword = await bcrypt.hash(studentPassword, 10);
      const student = new Student({
        username: studentUsername,
        password: hashedPassword,
        name: studentUsername,
        rollNumber: studentUsername
      });
      await student.save();
      return res.json({ message: "✅ Student registration successful" });
    }
    if (role === "faculty") {
  const { facultyEmail, facultyPassword, name } = req.body;

  // Validate formats
  if (!validateFacultyEmail(facultyEmail)) {
    return res.status(400).json({ error: "❌ Invalid email format. Use: 5-15 letters + optional digits + @gmail.com" }); // FIXED MESSAGE
  }
  
  if (!validateFacultyName(name)) {
    return res.status(400).json({ error: "❌ Invalid name format. Only letters (1-20 characters)" });
  }
  
  if (!validateFacultyPassword(facultyPassword)) {
    return res.status(400).json({ error: "❌ Invalid password format. Must contain uppercase, lowercase, number, and special character" }); // FIXED MESSAGE
  }
  

      // Check if faculty already exists
      const existingFaculty = await Faculty.findOne({ username: facultyEmail });
      if (existingFaculty) {
        return res.status(400).json({ error: "❌ Faculty already exists" });
      }

      const hashedPassword = await bcrypt.hash(facultyPassword, 10);
      const faculty = new Faculty({
        username: facultyEmail,
        password: hashedPassword,
        name,
        email: facultyEmail
      });
      await faculty.save();
      return res.json({ message: "✅ Faculty registration successful" });
    }

    
// PASTE THIS NEW BLOCK IN ITS PLACE

if (role === "clubhead") {
    const { clubUsername, clubPassword } = req.body;

    // 1. Validate the username format (e.g., "Mudra-Head")
    if (!validateClubHeadUsername(clubUsername)) {
        return res.status(400).json({ error: "❌ Invalid club username format. Use: Clubname-Head" });
    }
    
    // 2. Validate the password format
    if (!validateClubPassword(clubPassword)) {
        return res.status(400).json({ error: "❌ Invalid password format." });
    }

    // 3. Check if the club is configured to have a head with this username
    // This uses a case-insensitive search to be more user-friendly
    const club = await Club.findOne({ headUsername: { $regex: new RegExp(`^${escapeRegex(clubUsername)}$`, 'i') } });
    if (!club) {
        return res.status(400).json({ error: "❌ This club is not configured for a head or the username is incorrect." });
    }

    // 4. Check if a head is already registered
    const existingHead = await ClubHead.findOne({ username: { $regex: new RegExp(`^${escapeRegex(clubUsername)}$`, 'i') } });
    if (existingHead) {
        return res.status(400).json({ error: "❌ This club already has a head assigned." });
    }

    const hashedPassword = await bcrypt.hash(clubPassword, 10);
    const clubHead = new ClubHead({
        username: clubUsername,
        password: hashedPassword,
        name: clubUsername.replace(/-head$/i, '') + " Head", // Auto-generates a name like "Mudra Head"
        club: club._id
    });
    await clubHead.save();
    return res.json({ message: "✅ Club Head registration successful" });
}

    if (role === "admin") {
      const { adminId, adminPassword } = req.body;

      // Validate admin ID format
      if (!/^[a-zA-Z0-9]{4,20}$/.test(adminId)) {
        return res.status(400).json({ error: "❌ Invalid Admin ID format. Use 4-20 alphanumeric characters" });
      }

      // Validate admin password format
      if (!validateClubPassword(adminPassword)) {
        return res.status(400).json({ error: "❌ Invalid password format. Must contain uppercase, lowercase, number, and special character" });
      }

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ username: adminId });
      if (existingAdmin) {
        return res.status(400).json({ error: "❌ Admin already exists" });
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = new Admin({
        username: adminId,
        password: hashedPassword,
        name: "Admin " + adminId
      });
      await admin.save();
      return res.json({ message: "✅ Admin registration successful" });
    }
    
    res.status(400).json({ error: "❌ Invalid role" });
  } catch (err) {
    console.error("Registration error:", err);
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `❌ ${field} already exists` });
    }
    
    res.status(500).json({ error: "❌ Server error during registration" });
  }
});


// LOGIN endpoint
app.post("/login", async (req, res) => {
	try {
  let { role, username, password } = req.body || {};
  username = (username || '').trim();
  console.log('DEBUG /login payload (raw):', { role, usernameProvided: username });
  let user, userModel;
	if (role === "student") userModel = Student;
	else if (role === "faculty") userModel = Faculty;
	else if (role === "clubhead") userModel = ClubHead;
	// else if (role === "admin") userModel = Admin;
	// else return res.status(400).json({ error: "Invalid role" });
else if (role === "admin") {
  // Fixed admin credentials
  if (username === "admin" && password === "admin123$") {
    const token = jwt.sign(
      { id: "admin-fixed", role: "admin", username: "admin", name: "Super Admin" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    return res.json({ token, role: "admin" });
  } else {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }
} else {
  return res.status(400).json({ error: "Invalid role" });
}




  // perform case-insensitive username lookup to avoid case/format mismatches
  if (role === 'clubhead') {
    // Normalize clubhead username: collapse duplicate '-head' suffixes
    const normalized = username.replace(/(-head)+$/i, '-head');
    const withoutSuffix = normalized.replace(/-head$/i, '');
    // Try matching several common variants (case-insensitive): exact normalized, without suffix, withoutSuffix+"-head"
    user = await userModel.findOne({ $or: [
      { username: { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' } },
      { username: { $regex: `^${escapeRegex(withoutSuffix)}$`, $options: 'i' } },
      { username: { $regex: `^${escapeRegex(withoutSuffix)}-head$`, $options: 'i' } }
    ], isActive: true  // ✅ ADDED for clubhead// 
    });
  } else {
    user = await userModel.findOne({ username: { $regex: `^${escapeRegex(username)}$`, $options: 'i' },
    isActive: true  // ✅ ADDED for student and faculty
   });
  }
  if (!user) {
    console.log('Login failed: user not found for', username, 'role', role);
  }
	if (!user) return res.status(401).json({ error: "Invalid credentials" });
	const valid = await bcrypt.compare(password, user.password);
	if (!valid) return res.status(401).json({ error: "Invalid credentials" });
		const token = jwt.sign({ id: user._id, role, username: user.username, name: user.name }, JWT_SECRET, { expiresIn: "1h" });

		res.json({ token, role });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Server error" });
	}
});
app.get("/student/dashboard", authenticateToken, async (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ error: "Unauthorized" });
    const student = await Student.findOne({ username: req.user.username })
        .populate('joinedClubs')
        .populate('pendingRequests');
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
});
app.get("/clubs", async (req, res) => {
    try {
        const clubs = await Club.find({}, 'name description image slug _id headUsername members pendingRequests');
        res.json(clubs);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// DEV: debug endpoint to list ClubHead documents (username and club name)
// Only enabled when not in production
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/clubheads', async (req, res) => {
    try {
      const heads = await ClubHead.find({}).populate('club', 'name');
      const out = heads.map(h => ({ id: h._id, username: h.username, clubId: h.club?._id, clubName: h.club?._doc?.name || h.club?.name || null }));
      res.json(out);
    } catch (err) {
      console.error('Error in /debug/clubheads', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
}
// Add these 3 new endpoints to your server.js file

// 1. STUDENT: REQUEST TO JOIN A CLUB
app.post("/student/join-club", authenticateToken, async (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ error: "Unauthorized" });

    try {
        const { clubId } = req.body;
        const studentId = req.user.id; // From the JWT

        // Add request to the Club's pending list
        // Using $addToSet prevents adding duplicate requests
        await Club.findByIdAndUpdate(clubId, { $addToSet: { pendingRequests: studentId } });
        
        // Also add the club to the Student's pending list to keep them in sync
        await Student.findByIdAndUpdate(studentId, { $addToSet: { pendingRequests: clubId } });

        res.json({ message: "Request sent successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 2. CLUB HEAD: GET DASHBOARD DATA (INCL. REQUESTS AND MEMBERS)
app.get("/clubhead/dashboard", authenticateToken, async (req, res) => {
    if (req.user.role !== "clubhead") return res.status(403).json({ error: "Unauthorized" });

    try {
        // Find the club head to know which club they manage
        const clubHead = await ClubHead.findById(req.user.id);
         console.log("DEBUG: Checking Club Head:", clubHead); 
        if (!clubHead) return res.status(404).json({ error: "Club head not found" });


        // Find the club and populate the details of students in pendingRequests and members
        const clubData = await Club.findById(clubHead.club)
            .populate('pendingRequests', 'name username rollNumber') // Get student details
            .populate('members', 'name username rollNumber');        // Get member details

        if (!clubData) return res.status(404).json({ error: "Club data not found" });
        
        res.json(clubData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 3. CLUB HEAD: RESPOND TO A JOIN REQUEST (ACCEPT/REJECT)
app.post("/clubhead/respond", authenticateToken, async (req, res) => {
    if (req.user.role !== "clubhead") return res.status(403).json({ error: "Unauthorized" });
    
    try {
        const { studentId, action } = req.body; // action can be "accept" or "reject"
        const clubHead = await ClubHead.findById(req.user.id);
        const clubId = clubHead.club;

        // Step A: Remove student from the pending list in both Club and Student documents
        await Club.findByIdAndUpdate(clubId, { $pull: { pendingRequests: studentId } });
        await Student.findByIdAndUpdate(studentId, { $pull: { pendingRequests: clubId } });

        // Step B: If accepted, add student to the members list in both documents
        if (action === "accept") {
            await Club.findByIdAndUpdate(clubId, { $addToSet: { members: studentId } });
            await Student.findByIdAndUpdate(studentId, { $addToSet: { joinedClubs: clubId } });
        }

        res.json({ message: `Request has been ${action}ed.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// --- EVENT PROPOSAL & APPROVAL APIS ---


// CLUB HEAD: Create a new event proposal
// In server.js, replace your existing /clubhead/events endpoint with this one

// CLUB HEAD: Create a new event proposal
app.post("/clubhead/events", authenticateToken, async (req, res) => {
    if (req.user.role !== "clubhead") {
        return res.status(403).json({ error: "Unauthorized" });
    }
    try {
        const { title, description, date, fundRequest} = req.body;

        // Find the club head from the token
        const clubHead = await ClubHead.findById(req.user.id);
        
        // --- THIS IS THE FIX ---
        // Add a check to ensure the club head and their club link exist
        if (!clubHead || !clubHead.club) {
            return res.status(404).json({ error: "Could not find the club for this user." });
        }

        const newEvent = new Event({
            title,
            description,
            date,
            club: clubHead.club, 
            status: 'pending',
            fundRequest: fundRequest || 0 
        });

        await newEvent.save();
        res.status(201).json({ message: "Event proposal submitted successfully!" });

    } catch (err) {
        console.error("Error creating event:", err); 
        res.status(500).json({ error: "Server error while creating event." });
    }
});

app.get("/clubhead/my-events", authenticateToken, async (req, res) => {
    if (req.user.role !== "clubhead") return res.status(403).json({ error: "Unauthorized" });
    try {
        const clubHead = await ClubHead.findById(req.user.id);
        const events = await Event.find({ club: clubHead.club });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});



// FACULTY: Get all data for the dashboard in one call
app.get("/faculty/dashboard", authenticateToken, async (req, res) => {
    if (req.user.role !== "faculty") return res.status(403).json({ error: "Unauthorized" });
    try {
        const pendingEvents = await Event.find({ status: 'pending' }).populate('club', 'name');
        
        const clubs = await Club.find({}).populate({
            path: 'members',
            select: 'username' // Only select the username for members
        });

        const students = await Student.find({}, 'username');
        const clubHeads = await ClubHead.find({}, 'username');
        
        // Combine users cleanly for the table
        const allUsers = [
            ...students.map(s => ({ username: s.username, role: 'Student' })),
            ...clubHeads.map(ch => ({ username: ch.username, role: 'Club Head' }))
        ];

        res.json({ pendingEvents, clubs, allUsers });
    } catch (err) {
        console.error("Error in /faculty/dashboard:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// FACULTY: Respond to an event proposal
app.post("/faculty/events/respond", authenticateToken, async (req, res) => {
    if (req.user.role !== "faculty") return res.status(403).json({ error: "Unauthorized" });
    try {
        const { eventId, action } = req.body;
        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ error: "Invalid action." });
        }
        const updatedEvent = await Event.findByIdAndUpdate(eventId, { status: action }, { new: true });
        if (!updatedEvent) return res.status(404).json({ error: "Event not found." });
        res.json({ message: `Event has been successfully ${action}.` });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// PUBLIC: Get all approved events for students
// app.get("/events/approved", async (req, res) => {
//     try {
//         const approvedEvents = await Event.find({ status: 'approved' }).sort({ date: 1 }).populate('club', 'name');
//         res.json(approvedEvents);
//     } catch (err) {
//         res.status(500).json({ error: "Server error" });
//     }
// });
// PUBLIC: Get all approved events for students
app.get("/events/approved", async (req, res) => {
    try {
        const approvedEvents = await Event.find({ status: 'approved' })
            .sort({ date: 1 })                     // Sort events by date (ascending)
            .populate('club', 'name');             // Replace club ObjectId with club name

        res.json(approvedEvents);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// 1. Get all users (COMPLETE THIS)
app.get("/admin/users", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    
    
    try {
        // ✅ ADD isActive: true FILTER
        const students = await Student.find({ isActive: true }, 'username name email');
        const faculty = await Faculty.find({ isActive: true }, 'username name email');
        const clubHeads = await ClubHead.find({ isActive: true }, 'username name email');
        
        const allUsers = [
            ...students.map(s => ({ ...s._doc, role: 'student' })),
            ...faculty.map(f => ({ ...f._doc, role: 'faculty' })),
            ...clubHeads.map(ch => ({ ...ch._doc, role: 'clubhead' }))
        ];
        res.json(allUsers);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// 2. Admin event approval (COMPLETE THIS)
app.post("/admin/events/:eventId/approve", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.eventId, 
            { status: 'approved' },
            { new: true }
        );
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json({ message: "Event approved", event });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// 3. Admin event rejection
app.post("/admin/events/:eventId/reject", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.eventId, 
            { status: 'rejected' },
            { new: true }
        );
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json({ message: "Event rejected", event });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// ADMIN: Get ALL events (pending, approved, rejected) with funds
// ADMIN: Get ALL events
app.get("/admin/events", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    try {
        const events = await Event.find({})
            .populate('club', 'name')
            .sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ADMIN: Get fund requests
app.get("/admin/fund-requests", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    try {
        const eventsWithFunds = await Event.find({ fundRequest: { $gt: 0 } })
            .populate('club', 'name')
            .sort({ createdAt: -1 });
        res.json(eventsWithFunds);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// ADMIN: Deactivate user (soft delete)
app.post("/admin/users/:id/deactivate", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    
    try {
        const { id } = req.params;
        
        // Try to find and deactivate in all user collections
        let user = await Student.findByIdAndUpdate(id, { isActive: false });
        if (!user) user = await Faculty.findByIdAndUpdate(id, { isActive: false });
        if (!user) user = await ClubHead.findByIdAndUpdate(id, { isActive: false });
        
        if (!user) return res.status(404).json({ error: "User not found" });
        
        res.json({ message: "User deactivated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// ADMIN: Hard delete user (PERMANENT - COMPLETELY REMOVES FROM DATABASE)
app.delete("/admin/users/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    
    try {
        const { id } = req.params;
        
        // Try to delete from all collections
        let result = await Student.findByIdAndDelete(id);
        if (!result) result = await Faculty.findByIdAndDelete(id);
        if (!result) result = await ClubHead.findByIdAndDelete(id);
        
        if (!result) return res.status(404).json({ error: "User not found" });
        
        res.json({ message: "✅ User permanently deleted from database" });
    } catch (err) {
        console.error("Hard delete error:", err);
        res.status(500).json({ error: "Server error during deletion" });
    }
});

// ADMIN: Update approved fund amount
app.post("/admin/events/:id/update-funds", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    
    try {
        const { approvedFund } = req.body;
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { approvedFund: approvedFund },
            { new: true }
        );
        
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json({ message: "Approved funds updated successfully", event });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ADMIN: Get detailed clubs information with members and heads
app.get("/admin/clubs-detailed", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    
    try {
        const clubs = await Club.find({})
            .populate('members', 'username name')
            .populate('pendingRequests', 'username name');
        res.json(clubs);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// Server running
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
