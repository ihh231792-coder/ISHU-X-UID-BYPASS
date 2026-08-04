// ============================================================
// SCREENLOCK — Admin/Owner security
// • Screen-share / camera capture block (getDisplayMedia/getUserMedia)
// • Screenshot / record shortcut detection + warning overlay
// • Login user ka visible watermark (traceable leaks)
// Sirf OWNER / ADMIN ke liye active (MEMBER pe nahi)
// ============================================================
(function () {
  let sess = null;
  try { sess = JSON.parse(localStorage.getItem("uid_session") || "null"); } catch (e) {}
  if (!sess || (sess.role !== "owner" && sess.role !== "admin")) return;

  // ---------- block screen / camera capture ----------
  try {
    const md = navigator.mediaDevices;
    if (md) {
      md.getDisplayMedia = async function () {
        warn("⚠️ Screen-share is BLOCKED in this secure section.");
        return Promise.reject(new Error("Screen sharing disabled for security."));
      };
      const oGum = md.getUserMedia ? md.getUserMedia.bind(md) : null;
      md.getUserMedia = async function (constraints) {
        if (constraints && constraints.video) {
          warn("⚠️ Camera / capture is BLOCKED in this secure section.");
          return Promise.reject(new Error("Capture disabled for security."));
        }
        return oGum ? oGum(constraints) : Promise.reject(new Error("Blocked"));
      };
    }
  } catch (e) {}

  // ---------- warning overlay ----------
  let warnT = null;
  function warn(msg) {
    let el = document.getElementById("sl-warn");
    if (!el) {
      el = document.createElement("div");
      el.id = "sl-warn";
      el.style.cssText = "position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;padding:12px 24px;border-radius:40px;background:#ff2d55;color:#fff;font-family:Orbitron,sans-serif;font-weight:700;letter-spacing:1px;font-size:13px;box-shadow:0 0 30px rgba(255,59,107,.7);pointer-events:none;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(warnT);
    warnT = setTimeout(() => { el.style.opacity = "0"; }, 2600);
  }

  // ---------- screenshot / record shortcut detection ----------
  window.addEventListener("keydown", function (e) {
    const k = (e.key || "").toLowerCase();
    const snap = e.key === "PrintScreen" || k === "prtscr";
    const sr = e.ctrlKey && k === "s";                    // win+shift+s path
    const xr = (e.metaKey || e.ctrlKey) && e.shiftKey && k === "s"; // win/mac screenshot
    const wr = (e.metaKey || e.ctrlKey) && e.shiftKey && k === "r"; // mac record
    const xbox = e.altKey && k === "tab";                 // alt-tab
    if (snap || sr || xr || wr || xbox) {
      warn("⛔ Screenshot / Recording is not allowed here.");
    }
  }, true);

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    warn("⛔ Right-click is disabled in this secure section.");
  });
})();