
require('dotenv').config({ path: '../backend/.env' }); // adjust relative path
         // load .env
const mongoose = require('mongoose');
const Club = require('../models/Clubs');  // adjust path if needed

const MONGO_URI = process.env.MONGO_URI; // use Atlas URI

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const clubs = [
  { name: "Organisation Committee", slug: "organisation-committee", description: "Handles all event organization.", image: "organisation.png", headUsername: "org-committee-head" },
  { name: "Public Relations", slug: "public-relations", description: "Manages PR and outreach.", image: "publicrelation.png", headUsername: "Publicrelation-head" },
  { name: "Aalap", slug: "aalap", description: "Music and club.", image: "Aalap.png", headUsername: "Alap-head" },
  { name: "Abhinaya", slug: "abhinaya", description: "Drama and theatre club.", image: "Abhinaya.png", headUsername: "Abhinaya-head" },
  { name: "Aakarshan", slug: "aakarshan", description: "Art club.", image: "akarshan.png", headUsername: "Akarshan-head" },
  { name: "Kreeda Sports Club", slug: "kreeda-sports-club", description: "Sports and games club.", image: "Kreeda.png", headUsername: "Kreeda-sports-head" },
  { name: "Mudra", slug: "mudra", description: "Dance club.", image: "Mudra.png", headUsername: "Mudra-head" },
  { name: "Traces of Lenses", slug: "traces-of-lenses", description: "Photography club.", image: "Traces.png", headUsername: "Traces-head" },
  { name: "Kaivalya", slug: "kaivalya", description: "Yoga and wellness club.", image: "Kaivalya.png", headUsername: "Kaivalya-head" },
  { name: "Kmitra", slug: "kmitra", description: "Innovation and technology club.", image: "Kmitra.png", headUsername: "Kmitra-head" },
  { name: "Recurse", slug: "recurse", description: "Coding and algorithms club.", image: "Recurse.png", headUsername: "Rescurse-head" },
  { name: "Vachan", slug: "vachan", description: "Literature and reading club.", image: "vachan.png", headUsername: "Vachan-head" }
];

async function insertClubs() {
  try {
       // optional: clears old data
    await Club.insertMany(clubs);
    console.log("✅ Clubs inserted into Atlas!");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

insertClubs();
