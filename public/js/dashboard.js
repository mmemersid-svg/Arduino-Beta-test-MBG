// ═══════════════════════════════════════
//  dashboard.js — export init, destroy, onData
// ═══════════════════════════════════════
import { getStatusColor, getStatusClass, formatTime } from "./utils.js";

const MAX_POINTS = 50;
const labels     = [];
const srData     = [];
const ldr1Data   = [], ldr2Data = [], ldr3Data = [], ldr4Data = [];

let charts = {};

// ══════════════════════════
export function init() {
  initCharts();
  console.log("📊 Dashboard init");
}

// ══════════════════════════
export function destroy() {
  Object.values(charts).forEach(c => { if (c) c.destroy(); });
  charts = {};
  labels.length   = 0;
  srData.length   = 0;
  ldr1Data.length = 0;
  ldr2Data.length = 0;
  ldr3Data.length = 0;
  ldr4Data.length = 0;
  console.log("📊 Dashboard destroyed");
}

// ══════════════════════════
export function onData(entry) {
  if (!entry) return;
  const { gempa, ldr, timestamp } = entry;

  // Update waktu
  const t = formatTime(timestamp);
  const el = document.getElementById("lastUpdate");
  if (el) el.textContent = t;

  if (gempa) updateGempa(gempa);
  if (ldr)   updateLDR(ldr);

  // Push ke chart
  pushChart(gempa?.skala ?? 0, ldr, t);
}

// ── Gempa ──
function updateGempa({ skala, status }) {
  const sr = parseFloat(skala).toFixed(1);

  setText("mc-sr", sr);
  setText("mc-status", status);

  const buzzerOn = skala >= 3.0;
  setText("mc-buzzer", buzzerOn ? "ON" : "OFF");
  const buzzerBadge = document.getElementById("mc-buzzer-badge");
  if (buzzerBadge) {
    buzzerBadge.textContent = buzzerOn ? "Aktif" : "Standby";
    buzzerBadge.className   = "mc-badge " + (buzzerOn ? "warn" : "");
  }

  // Warna badge status
  const badge = document.getElementById("mc-status");
  const card  = document.getElementById("mc-gempa");
  if (badge) badge.className = "mc-badge " + getStatusClass(skala);
  if (card) {
    card.className = "metric-card";
    if (skala >= 5.0) {
      card.classList.add("danger-card");
      window.showToast?.(`GEMPA ${sr} SR — ${status}! Segera waspada!`);
    } else if (skala >= 3.0) {
      card.classList.add("warn-card");
      window.showToast?.(`Getaran ${sr} SR terdeteksi — ${status}`);
    }
  }
}

// ── LDR ──
function updateLDR({ ldr1, ldr2, ldr3, ldr4 }) {
  const vals = [ldr1, ldr2, ldr3, ldr4];
  const avg  = Math.round(vals.reduce((a, b) => a + b, 0) / 4);
  const max  = Math.max(...vals);

  setText("mc-avg",    avg);
  setText("mc-maxldr", max);

  // Update pie
  if (charts.pie) {
    charts.pie.data.datasets[0].data = [ldr1, ldr2, ldr3, ldr4];
    charts.pie.update("none");
  }
}

// ── Push chart data ──
function pushChart(sr, ldr, label) {
  labels.push(label);
  srData.push(sr);
  ldr1Data.push(ldr?.ldr1 ?? 0);
  ldr2Data.push(ldr?.ldr2 ?? 0);
  ldr3Data.push(ldr?.ldr3 ?? 0);
  ldr4Data.push(ldr?.ldr4 ?? 0);

  if (labels.length > MAX_POINTS) {
    labels.shift(); srData.shift();
    ldr1Data.shift(); ldr2Data.shift();
    ldr3Data.shift(); ldr4Data.shift();
  }

  refreshChart(charts.gempa,  labels, [srData]);
  refreshChart(charts.ldrTop, labels, [ldr1Data, ldr2Data]);
  refreshChart(charts.ldrBot, labels, [ldr3Data, ldr4Data]);
}

function refreshChart(chart, labels, datasets) {
  if (!chart) return;
  chart.data.labels = [...labels];
  datasets.forEach((d, i) => { chart.data.datasets[i].data = [...d]; });
  chart.update("none");
}

// ── Init Charts ──
function initCharts() {
  if (typeof Chart === "undefined") {
    console.error("Chart.js belum dimuat");
    return;
  }

  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size   = 11;
  Chart.defaults.color       = "#94a3b8";

  const grid = { color: "rgba(0,0,0,0.04)", drawBorder: false };

  charts.gempa = makeLineChart("chartGempa", [
    makeDS("SR", "#ef4444", "rgba(239,68,68,0.08)")
  ], { max: 9, grid, yLabel: "SR" });

  charts.pie = new Chart(document.getElementById("chartPie"), {
    type: "doughnut",
    data: {
      labels: ["LDR 1", "LDR 2", "LDR 3", "LDR 4"],
      datasets: [{
        data: [1, 1, 1, 1],
        backgroundColor: ["#6366f1", "#f59e0b", "#10b981", "#ef4444"],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 10, padding: 12 } }
      },
      cutout: "62%"
    }
  });

  charts.ldrTop = makeLineChart("chartLDRTop", [
    makeDS("LDR 1", "#6366f1", "rgba(99,102,241,0.07)"),
    makeDS("LDR 2", "#f59e0b", "rgba(245,158,11,0.07)")
  ], { grid });

  charts.ldrBot = makeLineChart("chartLDRBot", [
    makeDS("LDR 3", "#10b981", "rgba(16,185,129,0.07)"),
    makeDS("LDR 4", "#ef4444", "rgba(239,68,68,0.07)")
  ], { grid });
}

function makeLineChart(id, datasets, { max, grid, yLabel } = {}) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  return new Chart(canvas, {
    type: "line",
    data: { labels: [], datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true, position: "top", labels: { boxWidth: 10, padding: 12 } }
      },
      scales: {
        x: { grid, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
        y: {
          grid, min: 0,
          max: max || undefined,
          ticks: { maxTicksLimit: 6 },
          title: yLabel ? { display: true, text: yLabel, font: { size: 10 } } : { display: false }
        }
      }
    }
  });
}

function makeDS(label, color, bg) {
  return {
    label, data: [],
    borderColor: color,
    backgroundColor: bg,
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    pointHoverRadius: 4
  };
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
