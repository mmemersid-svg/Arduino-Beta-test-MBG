// ═══════════════════════════════════════
//  gempa.js — export init, destroy, onData
// ═══════════════════════════════════════
import { formatTime } from "./utils.js";

const MAX_POINTS = 50;
const labels     = [];
const srData     = [];
let chart        = null;

export function init() {
  initChart();
  console.log("🌋 Gempa init");
}

export function destroy() {
  if (chart) { chart.destroy(); chart = null; }
  labels.length = 0;
  srData.length = 0;
  console.log("🌋 Gempa destroyed");
}

export function onData(entry) {
  if (!entry?.gempa) return;
  const { gempa, timestamp } = entry;

  const el = document.getElementById("gempaUpdate");
  if (el) el.textContent = formatTime(timestamp);

  updateRing(gempa);
  pushChart(gempa.skala, formatTime(timestamp));
}

function updateRing({ skala, status }) {
  const sr = parseFloat(skala).toFixed(1);

  setText("g-sr",     sr);
  setText("g-status", status);
  setText("g-desc",   getDesc(skala));

  const buzzerOn = skala >= 3.0;
  setText("g-buzzer", buzzerOn ? "ON" : "OFF");

  const ring   = document.getElementById("gempaRing");
  const valEl  = document.getElementById("g-sr");
  const statEl = document.getElementById("g-status");

  if (!ring) return;
  ring.className = "gempa-ring";

  if (skala >= 5.0) {
    ring.classList.add("danger");
    if (valEl)  valEl.style.color  = "#ef4444";
    if (statEl) statEl.style.color = "#ef4444";
  } else if (skala >= 3.0) {
    ring.classList.add("warn");
    if (valEl)  valEl.style.color  = "#f59e0b";
    if (statEl) statEl.style.color = "#d97706";
  } else {
    if (valEl)  valEl.style.color  = "var(--blue)";
    if (statEl) statEl.style.color = "#059669";
  }

  // Highlight baris BMKG
  document.querySelectorAll(".scale-row").forEach(row => {
    row.classList.remove("active-row");
    const min = parseFloat(row.dataset.min);
    const max = parseFloat(row.dataset.max);
    if (skala >= min && skala < max) row.classList.add("active-row");
  });
}

function pushChart(sr, label) {
  labels.push(label);
  srData.push(sr);
  if (labels.length > MAX_POINTS) { labels.shift(); srData.shift(); }
  if (!chart) return;
  chart.data.labels            = [...labels];
  chart.data.datasets[0].data = [...srData];
  chart.update("none");
}

function initChart() {
  const canvas = document.getElementById("chartGempa2");
  if (!canvas || typeof Chart === "undefined") return;

  chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "SR",
        data: [],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.08)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
        y: { min: 0, max: 9, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { maxTicksLimit: 6 } }
      }
    }
  });
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function getDesc(sr) {
  if (sr < 2.0) return "Tidak ada aktivitas seismik terdeteksi. Kondisi aman.";
  if (sr < 3.0) return "Getaran sangat kecil, hanya terdeteksi sensor sensitif.";
  if (sr < 4.0) return "Getaran ringan. Beberapa orang mungkin merasakan.";
  if (sr < 5.0) return "Getaran sedang. Benda-benda di rak bisa bergetar.";
  if (sr < 6.0) return "Getaran kuat! Keluar dari gedung, waspada!";
  if (sr < 7.0) return "Getaran sangat kuat! Segera berlindung!";
  return "BAHAYA! Gempa merusak! Evakuasi segera!";
}
