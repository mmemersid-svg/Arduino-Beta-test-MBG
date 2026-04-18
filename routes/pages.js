const express = require("express");
const router  = express.Router();
const path    = require("path");

const views = path.join(__dirname, "../views");

// ── Landing page ──
router.get("/", (req, res) => {
  res.sendFile(path.join(views, "index.html"));
});

// ── Shell (SPA wrapper + sidebar) ──
router.get("/app", (req, res) => {
  res.sendFile(path.join(views, "shell.html"));
});

// ── Pages (konten saja) ──
router.get("/pages/:id", (req, res) => {
  const { id } = req.params;
  
  // Daftar halaman yang diizinkan untuk di-load
  const allowed = ["dashboard", "gempa", "ldr", "status", "ai"];

  if (!allowed.includes(id)) {
    return res.status(404).json({ 
      success: false, 
      message: "Halaman tidak ditemukan" 
    });
  }

  // Kirim file html dari folder views/pages/
  res.sendFile(path.join(views, "pages", `${id}.html`));
});

module.exports = router;