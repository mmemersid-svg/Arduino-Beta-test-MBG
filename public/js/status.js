// ═══════════════════════════════════════
//  status.js — export init, destroy, onData
// ═══════════════════════════════════════

export function init() {
  // Ambil status socket dari window._socket
  const socket = window._socket;
  if (socket) {
    setPill("st-socketPill", socket.connected ? "ONLINE" : "OFFLINE",
      socket.connected ? "online" : "offline");
    setText("st-socketId", socket.connected ? socket.id : "Tidak terhubung");
    setPill("st-arduino", socket.connected ? "ONLINE" : "OFFLINE",
      socket.connected ? "online" : "offline");
    setPill("st-sw420", socket.connected ? "AKTIF" : "OFFLINE",
      socket.connected ? "online" : "offline");
    setPill("st-ldr", socket.connected ? "AKTIF" : "OFFLINE",
      socket.connected ? "online" : "offline");
  }
  console.log("⚙️ Status init");
}

export function destroy() {
  console.log("⚙️ Status destroyed");
}

export function onData(entry) {
  if (!entry) return;

  // Raw JSON
  const raw = document.getElementById("rawBox");
  if (raw) raw.textContent = JSON.stringify(entry, null, 2);

  // Update status pills
  setPill("st-arduino", "ONLINE", "online");
  setPill("st-sw420",   "AKTIF",  "online");
  setPill("st-ldr",     "AKTIF",  "online");

  // Buzzer
  const buzzerOn = entry.gempa?.skala >= 3.0;
  setPill("st-buzzer", buzzerOn ? "AKTIF" : "STANDBY", buzzerOn ? "warn" : "");
}

function setPill(id, text, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className   = "sc-pill " + (cls || "");
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
