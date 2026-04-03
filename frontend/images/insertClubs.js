const mongoose = require('mongoose');
const Club = require('../models/Clubs');

mongoose.connect('mongodb://127.0.0.1:27017/kmit-clubs', { useNewUrlParser: true, useUnifiedTopology: true });

const clubs = [
  {
    name: "Organisation Committee",
    slug: "organisation-committee",
    description: "Handles all event organization.",
    image: "organisation.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Public Relations",
    slug: "public-relations",
    description: "Manages PR and outreach.",
    image: "publicrelation.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Aalap",
    slug: "aalap",
    description: "Music and club.",
    image: "Aalap.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Abhinaya",
    slug: "abhinaya",
    description: "Drama and theatre club.",
    image: "Abhinaya.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Aakarshan",
    slug: "aakarshan",
    description: "Art club.",
    image: "akarshan.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Kreeda Sports Club",
    slug: "kreeda-sports-club",
    description: "Sports and games club.",
    image: "Kreeda.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Mudra",
    slug: "mudra",
    description: "Dance club.",
    image: "Mudra.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Traces of Lenses",
    slug: "traces-of-lenses",
    description: "Photography club.",
    image: "Traces.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Kaivalya",
    slug: "kaivalya",
    description: "Yoga and wellness club.",
    image: "Kaivalya.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Kmitra",
    slug: "kmitra",
    description: "Innovation and technology club.",
    image: "Kmitra.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Recurse",
    slug: "recurse",
    description: "Coding and algorithms club.",
    image: "Recurse.png",
     headUsername: "org-committee-head"
  },
  {
    name: "Vachan",
    slug: "vachan",
    description: "Literature and reading club.",
    image: "vachan.png",
     headUsername: "org-committee-head"
  }
];

async function insertClubs() {
  await Club.deleteMany({});
  await Club.insertMany(clubs);
  console.log("Clubs inserted!");
  mongoose.disconnect();
}

insertClubs();
