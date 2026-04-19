const express = require("express");
const router  = express.Router();
const Groq    = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── GET /api/data → data arduino ──
router.get("/data", (req, res) => {
  if (!global.latestData || Object.keys(global.latestData).length === 0) {
    return res.status(503).json({
      success: false,
      message: "Data Arduino belum tersedia",
      data: null
    });
  }
  res.json({ success: true, data: global.latestData });
});

// ── POST /api/chat → groq llama ──
router.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ success: false, message: "Pesan kosong" });
  }

  const d = global.latestData;

  try {
    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Kamu adalah asisten kebencanaan untuk sistem MBG (Monitoring Bencana Gawat).

TUGAS UTAMA:
1. Memberikan panduan evakuasi dan keselamatan saat gempa terjadi
2. Melaporkan data sensor realtime dari Arduino
3. Menjawab pertanyaan seputar gempa dan kebencanaan

DATA SENSOR SAAT INI:
- Kekuatan Gempa  : ${d?.gempa?.skala ?? 0} SR (${d?.gempa?.status ?? "Tidak Terasa"})
- Intensitas LDR 1 (Kanan Atas)  : ${d?.ldr?.ldr1 ?? 0} lux
- Intensitas LDR 2 (Kiri Atas)   : ${d?.ldr?.ldr2 ?? 0} lux
- Intensitas LDR 3 (Kanan Bawah) : ${d?.ldr?.ldr3 ?? 0} lux
- Intensitas LDR 4 (Kiri Bawah)  : ${d?.ldr?.ldr4 ?? 0} lux

PANDUAN RESPONS:
- Kalau gempa >= 3.0 SR → langsung kasih peringatan + langkah evakuasi
- Kalau ditanya kondisi sensor → laporkan data di atas
- Kalau ngobrol biasa → tetap fokus ke topik kebencanaan dan keselamatan
- Jawab pakai Bahasa Indonesia yang ramah tapi tegas
- Kalau darurat, respons singkat dan jelas`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const reply = result.choices[0].message.content;
    res.json({ success: true, reply });

  } catch (err) {
    console.error("❌ GROQ ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
