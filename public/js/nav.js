// ═══════════════════════════════════════════
//  nav.js — SPA Navigation + Lifecycle Manager
//  type="module" → ES Module, browser auto cache
// ═══════════════════════════════════════════

// ── Socket shared instance ──
const socket = io();
window._socket = socket;

// ── State ──
const pageModules = {};
let activePage    = null;
let isLoading     = false;
let toastTimeout  = null;

const pageNames = {
  dashboard: "Ringkasan",
  gempa:     "Sensor Gempa",
  ldr:       "Solar Tracking",
  status:    "Status Sistem"
};

// ── Socket events ──
socket.on("connect", () => {
  setConn(true);
  console.log("🟢 Socket terhubung:", socket.id);
});

socket.on("disconnect", () => {
  setConn(false);
  console.log("🔴 Socket terputus");
});

socket.on("data", (entry) => {
  // distribute ke halaman aktif
  if (pageModules[activePage]?.onData) {
    pageModules[activePage].onData(entry);
  }
});

// ── Nav buttons ──
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    if (target === activePage || isLoading) return;
    navigateTo(target);
    if (window.innerWidth <= 768) 
    closeSidebar();
  });
});

// ── Mobile sidebar toggle ──
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

// buat overlay gelap
const overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.inset = "0";
overlay.style.background = "rgba(0,0,0,0.35)";
overlay.style.zIndex = "95";
overlay.style.display = "none";
document.body.appendChild(overlay);

function isMobile() {
  return window.innerWidth <= 768;
}

function openSidebar() {
  sidebar.classList.add("open");
  if (isMobile()) overlay.style.display = "block";
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.style.display = "none";
}

menuBtn.addEventListener("click", () => {
  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

// klik area gelap = tutup
overlay.addEventListener("click", closeSidebar);

// kalau resize ke desktop, reset
window.addEventListener("resize", () => {
  if (!isMobile()) {
    overlay.style.display = "none";
    sidebar.classList.remove("open");
  }
});

// ── Clock ──
setInterval(() => {
  document.getElementById("topbarTime").textContent =
    new Date().toLocaleTimeString("id-ID");
}, 1000);

// ══════════════════════════════════════════
//  NAVIGATE
// ══════════════════════════════════════════
async function navigateTo(page) {
  if (isLoading) return;
  isLoading = true;

  try {
    // 1. Destroy halaman aktif
    if (activePage && pageModules[activePage]?.destroy) {
      pageModules[activePage].destroy();
    }

    // 2. Ganti CSS (1 tag, ganti href saja — tidak numpuk)
    document.getElementById("page-css").href = `/css/${page}.css`;

    // 3. Update sidebar active state
    document.querySelectorAll(".nav-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.target === page);
    });

    // 4. Update breadcrumb
    document.getElementById("bcActive").textContent = pageNames[page] || page;

    // 5. Fetch HTML → inject (tampilkan loading dulu)
    const container = document.getElementById("pageContent");
    container.innerHTML = `
      <div class="page-loading">
        <div class="spinner"></div>
        <span>Memuat halaman...</span>
      </div>
    `;

    const res = await fetch(`/pages/${page}`);
    if (!res.ok) throw new Error(`Halaman ${page} tidak ditemukan`);
    const html = await res.text();

    container.innerHTML = html;
    container.firstElementChild?.classList.add("page-enter");

    // 6. Load JS halaman (import dynamic — browser cache otomatis)
    if (!pageModules[page]) {
      const mod = await import(`/js/${page}.js`);
      pageModules[page] = mod;
    }

    // 7. Init halaman
    if (pageModules[page]?.init) {
      pageModules[page].init();
    }

    // 8. Fetch data awal dari API
    fetchInitial(page);

    activePage = page;

  } catch (err) {
    console.error("❌ Gagal load halaman:", err);
    document.getElementById("pageContent").innerHTML = `
      <div class="page-loading">
        <span>Gagal memuat halaman.</span>
      </div>
    `;
  } finally {
    isLoading = false;
  }
}

// ══════════════════════════════════════════
//  FETCH DATA AWAL
// ══════════════════════════════════════════
async function fetchInitial(page) {
  try {
    const res  = await fetch("/api/data");
    const json = await res.json();

    if (json.success && json.data && pageModules[page]?.onData) {
      pageModules[page].onData(json.data);
    }
  } catch (e) {
    console.log("Fetch awal gagal:", e.message);
  }
}

// ══════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════
function setConn(online) {
  const dot   = document.getElementById("connDot");
  const label = document.getElementById("connLabel");
  const role  = document.getElementById("profileRole");

  dot.className = "conn-dot " + (online ? "online" : "offline");
  label.textContent = online ? "Terhubung" : "Terputus";

  role.className    = "profile-role " + (online ? "online" : "");
  role.innerHTML    = `<span class="role-dot"></span> ${online ? "Online" : "Offline"}`;
}

// Toast global — bisa dipanggil dari halaman mana saja
window.showToast = function(msg) {
  const t = document.getElementById("toast");
  t.textContent   = msg;
  t.style.display = "block";
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { t.style.display = "none"; }, 5000);
};

// ── Load halaman default ──
navigateTo("dashboard");
