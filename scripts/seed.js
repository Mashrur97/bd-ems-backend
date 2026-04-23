require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Voter = require("../models/Voter");
const Officer = require("../models/Officer");
const Candidate = require("../models/Candidate");
const Booth = require("../models/Booth");
const Station = require("../models/Station");
const Constituency = require("../models/Constituency");
const ElectionState = require("../models/ElectionState");
const AuditLog = require("../models/AuditLog");
const FraudFlag = require("../models/FraudFlag");
const Incident = require("../models/Incident");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Clear everything
  await Promise.all([
    Voter.deleteMany({}),
    Officer.deleteMany({}),
    Candidate.deleteMany({}),
    Booth.deleteMany({}),
    Station.deleteMany({}),
    Constituency.deleteMany({}),
    ElectionState.deleteMany({}),
    AuditLog.deleteMany({}),
    FraudFlag.deleteMany({}),
    Incident.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // Candidates
  await Candidate.insertMany([
    { candidateId: 1, name: "Farida Khanam",  party: "Awami League", symbol: "🚢", color: "#2471a3", votes: 2341 },
    { candidateId: 2, name: "Kamal Hossain",  party: "BNP",          symbol: "🌾", color: "#922b21", votes: 1987 },
    { candidateId: 3, name: "Rina Akter",     party: "Jatiya Party", symbol: "⚙️", color: "#1e8449", votes: 876 },
    { candidateId: 4, name: "Zahir Uddin",    party: "Independent",  symbol: "⭐", color: "#7d3c98", votes: 432 },
  ]);
  console.log("Seeded candidates");

  // Constituencies
  await Constituency.insertMany([
    { constituencyId: 1, name: "Dhaka-1 (Dohar-Nawabganj)", stations: [1, 2, 3] },
    { constituencyId: 2, name: "Dhaka-2 (Motijheel)",       stations: [4, 5] },
  ]);
  console.log("Seeded constituencies");

  // Stations
  await Station.insertMany([
    { stationId: 1, name: "Motijheel Govt. School",      constituencyId: 1, booths: [1, 2, 3, 4], verified: false, submitted: false },
    { stationId: 2, name: "Farmgate Model High School",  constituencyId: 1, booths: [5, 6],       verified: true,  submitted: true  },
    { stationId: 3, name: "Gulshan Ideal School",        constituencyId: 1, booths: [7, 8],       verified: false, submitted: false },
  ]);
  console.log("Seeded stations");

  // Booths
  await Booth.insertMany([
    { boothId: 1, name: "Booth A-1", stationId: 1, issued: 850,  used: 0,   candidateVotes: { "1": 0,   "2": 0,   "3": 0,  "4": 0  }, submitted: false, flagged: false },
    { boothId: 2, name: "Booth A-2", stationId: 1, issued: 820,  used: 0,   candidateVotes: { "1": 0,   "2": 0,   "3": 0,  "4": 0  }, submitted: false, flagged: false },
    { boothId: 3, name: "Booth A-3", stationId: 1, issued: 790,  used: 0,   candidateVotes: { "1": 0,   "2": 0,   "3": 0,  "4": 0  }, submitted: false, flagged: false },
    { boothId: 4, name: "Booth A-4", stationId: 1, issued: 810,  used: 0,   candidateVotes: { "1": 0,   "2": 0,   "3": 0,  "4": 0  }, submitted: false, flagged: false },
    { boothId: 5, name: "Booth B-1", stationId: 2, issued: 760,  used: 580, candidateVotes: { "1": 250, "2": 190, "3": 88, "4": 52 }, submitted: true,  flagged: false },
    { boothId: 6, name: "Booth B-2", stationId: 2, issued: 800,  used: 612, candidateVotes: { "1": 280, "2": 175, "3": 101,"4": 56 }, submitted: true,  flagged: false },
    { boothId: 7, name: "Booth C-1", stationId: 3, issued: 700,  used: 0,   candidateVotes: { "1": 0,   "2": 0,   "3": 0,  "4": 0  }, submitted: false, flagged: false },
    { boothId: 8, name: "Booth C-2", stationId: 3, issued: 720,  used: 0,   candidateVotes: { "1": 0,   "2": 0,   "3": 0,  "4": 0  }, submitted: false, flagged: false },
  ]);
  console.log("Seeded booths");

  // Voters
  await Voter.insertMany([
    { nid: "1234567890123", name: "Mohammad Alam",  dob: "1985-03-12", district: "Dhaka",      boothId: 1, constituencyId: 1, voted: false },
    { nid: "9876543210123", name: "Fatema Begum",   dob: "1990-07-22", district: "Chittagong", boothId: 2, constituencyId: 1, voted: false },
    { nid: "1111222233334", name: "Rahim Khan",     dob: "1978-11-05", district: "Rajshahi",   boothId: 3, constituencyId: 1, voted: false },
  ]);
  console.log("Seeded voters");

  // Officers — store raw pin, pre-save hook hashes it
  const officers = [
    { officerId: "APO001", pinHash: "1111", name: "Nusrat Jahan",   role: "apo", stationId: 1, booths: [1, 2, 3, 4] },
    { officerId: "PO001",  pinHash: "2222", name: "Abdur Rahman",   role: "po",  stationId: 1 },
    { officerId: "ARO001", pinHash: "3333", name: "Dilruba Akter",  role: "aro", constituencyId: 1 },
    { officerId: "RO001",  pinHash: "4444", name: "Justice Mahbub", role: "ro",  constituencyId: 1 },
  ];
  // Create one by one so pre-save hook fires per document
  for (const o of officers) {
    await new Officer(o).save();
  }
  console.log("Seeded officers (PINs hashed)");

  // Election State
  await ElectionState.create({ constituencyCompiled: false, resultsDeclared: false, eligibleVoters: 8200 });
  console.log("Seeded election state");

  // Initial Audit Log
  await AuditLog.insertMany([
    { event: "Election polling opened nationally",         createdAt: new Date("2026-01-01T07:00:00Z") },
    { event: "APO001 submitted Booth B-1 results",        createdAt: new Date("2026-01-01T08:14:22Z") },
    { event: "APO001 submitted Booth B-2 results",        createdAt: new Date("2026-01-01T08:45:11Z") },
    { event: "PO Farmgate verified station result",       createdAt: new Date("2026-01-01T09:02:33Z") },
  ]);
  console.log("Seeded audit log");

  // Initial Fraud Flags
  await FraudFlag.insertMany([
    { booth: "Booth B-1", station: "Farmgate",   issue: "Vote count 8% below baseline",            severity: "low"  },
    { booth: "Booth A-4", station: "Motijheel",  issue: "Entered count exceeds issued ballots",     severity: "high" },
  ]);
  console.log("Seeded fraud flags");

  // Initial Incidents
  await Incident.insertMany([
    { center: "Motijheel Govt. School", type: "EVM Malfunction",        desc: "EVM in Booth A-3 stalled — resolved in 12 min",          status: "resolved", createdAt: new Date("2026-01-01T09:14:00Z") },
    { center: "Farmgate Model School",  type: "Identity Fraud Attempt", desc: "Voter attempted to cast vote with another's NID",         status: "active",   createdAt: new Date("2026-01-01T10:42:00Z") },
  ]);
  console.log("Seeded incidents");

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
