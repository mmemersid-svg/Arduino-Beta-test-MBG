const express = require("express");
const router  = express.Router();

// GET /api/data → return data terbaru dari Arduino
router.get("/data", (req, res) => {
  if (!global.latestData || Object.keys(global.latestData).length === 0) {
    return res.status(503).json({
      success: false,
      message: "Data Arduino belum tersedia",
      data: null
    });
  }

  res.json({
    success: true,
    data: global.latestData
  });
});

module.exports = router;