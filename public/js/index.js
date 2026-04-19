// Redirect ke /app setelah animasi splash selesai
// Total timing:
//   0.0s → konten naik masuk
//   0.15s → subjudul naik masuk
//   2.8s → splash mulai slide up (animation-delay di CSS)
//   0.6s → durasi slide up
//   = redirect di 3.4s

setTimeout(() => {
  window.location.href = "/app";
}, 3400);
