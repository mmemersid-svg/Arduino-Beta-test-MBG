// ═══════════════════════════════════════
//  ai.js — export init, destroy
// ═══════════════════════════════════════

export function init() {
  const sendBtn   = document.getElementById("sendChat");
  const chatInput = document.getElementById("chatInput");
  const display   = document.getElementById("chatDisplay");

  if (!sendBtn || !chatInput || !display) return;

  // Pesan sambutan
  appendBubble(display, "ai", "Halo! Saya asisten MBG. Tanya apapun soal data sensor gempa atau cahaya.");

  const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    // User bubble
    appendBubble(display, "user", text);
    chatInput.value = "";
    scrollDown(display);

    // Loading bubble
    const loadId = "load-" + Date.now();
    appendBubble(display, "ai", "<i>Mengetik...</i>", loadId);
    scrollDown(display);

    try {
      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text })
      });

      const data = await res.json();
      document.getElementById(loadId)?.remove();

      if (data.success) {
        appendBubble(display, "ai", data.reply);
      } else {
        appendBubble(display, "ai error", "Error: " + data.message);
      }

    } catch (err) {
      document.getElementById(loadId)?.remove();
      appendBubble(display, "ai error", "Gagal konek ke server.");
    }

    scrollDown(display);
  };

  // Event listeners
  sendBtn.onclick = sendMessage;
  chatInput.onkeydown = (e) => { if (e.key === "Enter") sendMessage(); };

  console.log("🤖 AI init");
}

export function destroy() {
  // Hapus event listeners dengan replace element
  const sendBtn   = document.getElementById("sendChat");
  const chatInput = document.getElementById("chatInput");
  if (sendBtn)   sendBtn.replaceWith(sendBtn.cloneNode(true));
  if (chatInput) chatInput.replaceWith(chatInput.cloneNode(true));
  console.log("🤖 AI destroyed");
}

// ── Helpers ──
function appendBubble(display, type, html, id = "") {
  const row = document.createElement("div");
  row.className = `chat-row ${type}`;
  if (id) row.id = id;
  row.innerHTML = `<div class="bubble">${html}</div>`;
  display.appendChild(row);
}

function scrollDown(el) {
  el.scrollTop = el.scrollHeight;
}
