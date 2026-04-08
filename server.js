const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/queueDB")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ✅ Schema
const patientSchema = new mongoose.Schema({
  name: String,
  token: Number,
  status: String,
  time: Date
});

const Patient = mongoose.model("Patient", patientSchema);

// ✅ Token Logic
let currentToken = 1;

// 🔹 Book Appointment
app.post("/book", async (req, res) => {
  const patient = new Patient({
    name: req.body.name,
    token: currentToken++,
    status: "waiting",
    time: new Date()
  });

  await patient.save();

  io.emit("queueUpdate");

  res.json(patient);
});

// 🔹 Get Queue
app.get("/queue", async (req, res) => {
  const data = await Patient.find({ status: "waiting" });
  res.json(data);
});

// 🔹 Next Patient
app.post("/next", async (req, res) => {
  const patient = await Patient.findOneAndUpdate(
    { status: "waiting" },
    { status: "done" }
  );

  io.emit("queueUpdate");

  res.json(patient);
});

// 🔹 Socket
io.on("connection", (socket) => {
  console.log("User connected");
});

// ✅ Start Server
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});