const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const path       = require("path");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

// ── Static files ──
app.use(express.static(path.join(__dirname, "public")));

// ── Router ──
app.use("/",    require("./routes/pages"));
app.use("/api", require("./routes/api"));

// ── Socket.IO ──
io.on("connection", (socket) => {
  console.log("🟢 Client terhubung:", socket.id);

  if (global.latestData && Object.keys(global.latestData).length > 0) {
    socket.emit("data", global.latestData);
  }

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnect:", socket.id);
  });
});

// ── SerialPort + ReadlineParser ──
const port   = new SerialPort({ path: "COM3", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

port.on("open",  () => console.log("🔌 COM3 terhubung ke Arduino"));
port.on("error", (err) => console.log("❌ Serial error:", err.message));
port.on("close", () => console.log("⚠️ COM3 terputus"));

parser.on("data", (raw) => {
  try {
    if (!raw.includes("GEMPA:") || !raw.includes("LDR:")) {
      console.log("⚠️ Format tidak dikenal:", raw);
      return;
    }

    const parts = raw.trim().split("|");
    if (parts.length < 2) return;

    const skala     = parseFloat(parts[0].split(":")[1]);
    const ldrValues = parts[1].split(":")[1].split(",");

    if (isNaN(skala) || ldrValues.length < 4) return;

    const entry = {
      gempa: { skala, status: getStatus(skala) },
      ldr: {
        ldr1: parseInt(ldrValues[0]),
        ldr2: parseInt(ldrValues[1]),
        ldr3: parseInt(ldrValues[2]),
        ldr4: parseInt(ldrValues[3]),
      },
      timestamp: Date.now(),
    };

    global.latestData = entry;
    console.log("📡 data ->", entry);
    io.emit("data", entry);

  } catch (e) {
    console.log("❌ Gagal parse:", raw);
  }
});

function getStatus(sr) {
  if (sr < 2.0) return "Tidak Terasa";
  if (sr < 3.0) return "Sangat Ringan";
  if (sr < 4.0) return "Ringan";
  if (sr < 5.0) return "Sedang";
  if (sr < 6.0) return "Kuat";
  if (sr < 7.0) return "Sangat Kuat";
  return "Merusak";
}

// ── Start ──
server.listen(3000, () => {
  console.log("🚀 MBG Server jalan di http://localhost:3000");
});