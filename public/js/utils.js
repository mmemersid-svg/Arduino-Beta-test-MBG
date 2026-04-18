// ═══════════════════════════════════════
//  utils.js — shared helper functions
// ═══════════════════════════════════════

export function formatTime(timestamp) {
  const d = timestamp ? new Date(timestamp) : new Date();
  return d.toLocaleTimeString("id-ID");
}

export function getStatusClass(sr) {
  if (sr < 3.0) return "safe";
  if (sr < 5.0) return "warn";
  return "danger";
}

export function getStatusColor(sr) {
  if (sr < 3.0) return "#059669";
  if (sr < 5.0) return "#d97706";
  return "#dc2626";
}
