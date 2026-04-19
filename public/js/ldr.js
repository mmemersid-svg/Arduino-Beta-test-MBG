// ═══════════════════════════════════════
//  ldr.js — export init, destroy, onData
// ═══════════════════════════════════════
import { formatTime } from "./utils.js";

const MAX_POINTS = 50;
const labels     = [];
const d1 = [], d2 = [], d3 = [], d4 = [];
let chart = null;

export function init() {
  initChart();
  console.log("☀️ LDR init");
}

export function destroy() {
  if (chart) { chart.destroy(); chart = null; }
  labels.length = 0;
  d1.length = d2.length = d3.length = d4.length = 0;
  console.log("☀️ LDR destroyed");
}

export function onData(entry) {
  if (!entry?.ldr) return;
  const { ldr, timestamp } = entry;

  const el = document.getElementById("ldrUpdate");
  if (el) el.textContent = formatTime(timestamp);

  updateCards(ldr);
  pushChart(ldr, formatTime(timestamp));
}

function updateCards({ ldr1, ldr2, ldr3, ldr4 }) {
  setText("sl1", ldr1);
  setText("sl2", ldr2);
  setText("sl3", ldr3);
  setText("sl4", ldr4);

  setText("cp1", ldr1);
  setText("cp2", ldr2);
  setText("cp3", ldr3);
  setText("cp4", ldr4);

  updateSun(ldr1, ldr2, ldr3, ldr4);
}

function updateSun(l1, l2, l3, l4) {
  const m = Math.max(l1, l2, l3, l4);
  let tx = 0, ty = 0;
  if      (m === l1) { tx =  20; ty = -20; }
  else if (m === l2) { tx = -20; ty = -20; }
  else if (m === l3) { tx =  20; ty =  20; }
  else               { tx = -20; ty =  20; }

  const sun = document.getElementById("sunDot");
  if (sun) sun.style.transform = `translate(${tx}px, ${ty}px)`;
}

function pushChart({ ldr1, ldr2, ldr3, ldr4 }, label) {
  labels.push(label);
  d1.push(ldr1); d2.push(ldr2);
  d3.push(ldr3); d4.push(ldr4);

  if (labels.length > MAX_POINTS) {
    labels.shift(); d1.shift(); d2.shift(); d3.shift(); d4.shift();
  }

  if (!chart) return;
  chart.data.labels = [...labels];
  chart.data.datasets[0].data = [...d1];
  chart.data.datasets[1].data = [...d2];
  chart.data.datasets[2].data = [...d3];
  chart.data.datasets[3].data = [...d4];
  chart.update("none");
}

function initChart() {
  const canvas = document.getElementById("chartAllLDR");
  if (!canvas || typeof Chart === "undefined") return;

  chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDS("LDR 1", "#6366f1", "rgba(99,102,241,0.07)"),
        makeDS("LDR 2", "#f59e0b", "rgba(245,158,11,0.07)"),
        makeDS("LDR 3", "#10b981", "rgba(16,185,129,0.07)"),
        makeDS("LDR 4", "#ef4444", "rgba(239,68,68,0.07)")
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true, position: "top", labels: { boxWidth: 10, padding: 12 } }
      },
      scales: {
        x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
        y: { min: 0, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { maxTicksLimit: 6 } }
      }
    }
  });
}

function makeDS(label, color, bg) {
  return {
    label, data: [],
    borderColor: color, backgroundColor: bg,
    borderWidth: 2, fill: true, tension: 0.4,
    pointRadius: 0, pointHoverRadius: 4
  };
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
