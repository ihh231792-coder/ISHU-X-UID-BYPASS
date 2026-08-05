// ============================================================
// LOGIN LOGIC — auto-detect role (user / admin / owner)
// Default gate: NORMAL USER (MEMBER)
// Owner ke liye extra SECURITY PASSCODE gate.
// ============================================================
(function () {
  const CFG = window.__CONFIG;
  let gate = "user";          // selected chip (user / admin)
  let pendingOwner = false;   // owner passcode step

  const chips = document.querySelectorAll(".chip");
  const form = document.getElementById("login-form");
  const uName = document.getElementById("username");
  const pass = document.getElementById("password");
  const passcodeField = document.getElementById("passcode-field");
  const passcode = document.getElementById("passcode");
  const msgEl = document.getElementById("login-msg");
  const hintEl = document.getElementById("gate-hint");
  const remember = document.getElementById("remember");

  // ---------- auto-login: session already hai to seedha dashboard ----------
  try {
    const s = JSON.parse(localStorage.getItem("uid_session") || "null");
    if (s && s.user) { window.location.href = "admin.html"; return; }
  } catch (e) {}

  // ---------- remember me: prefilled creds ----------
  try {
    const saved = JSON.parse(localStorage.getItem("uid_remember") || "null");
    if (saved && saved.user) {
      uName.value = saved.user;
      pass.value = saved.pass || "";
    }
  } catch (e) {}

  // gate toggle
  chips.forEach(c => c.addEventListener("click", () => {
    chips.forEach(x => x.classList.remove("active"));
    c.classList.add("active");
    gate = c.dataset.role;
    pendingOwner = false;
    if (passcodeField) passcodeField.classList.add("hidden");
    passcode.value = "";
    if (hintEl) {
      hintEl.textContent = gate === "user"
        ? "Member access — ek UID add karo (24 hour valid)"
        : "Owner / Admin access — Full UID management";
    }
  }));

  // show/hide password (premium svg icon swap)
  const eyeOn = document.getElementById("eye-on");
  const eyeOff = document.getElementById("eye-off");
  document.getElementById("toggle-pass").addEventListener("click", () => {
    const show = pass.type === "password";
    pass.type = show ? "text" : "password";
    if (eyeOn && eyeOff) { eyeOn.style.display = show ? "none" : "block"; eyeOff.style.display = show ? "block" : "none"; }
  });

  function setMsg(txt, type) {
    msgEl.textContent = txt;
    msgEl.className = "toast-msg " + (type === "err" ? "err" : "ok");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ---- PASSCODE STEP (owner) ----
    if (pendingOwner) {
      const code = passcode.value.trim();
      if (code === String(CFG.ownerPasscode)) {
        pendingOwner = false;
        return grant("owner", uName.value.trim());
      }
      setMsg("❌ Galat passcode. Access denied.", "err");
      return;
    }

    const user = uName.value.trim();
    const pw = pass.value;
    if (!user || !pw) { setMsg("⚠️ Username aur password bharo.", "err"); return; }

    setMsg("");
    msgEl.innerHTML = '<span class="spin"></span> Authenticating...';

    try {
      const data = await DB.init();
      const users = data.users || {};

      // 1) OWNER check (creds correct -> passcode maango)
      if (user === CFG.ownerUsername && pw === CFG.ownerPassword) {
        pendingOwner = true;
        passcode.value = "";
        if (passcodeField) {
          passcodeField.classList.remove("hidden");
          passcode.focus();
          setMsg("👑 Owner verified. Ab Security Passcode daalo.", "ok");
        } else {
          return grant("owner", user);
        }
        return;
      }

      // 2) Registered user (admin / member)
      const rec = users[user];
      if (!rec || rec.pass !== pw) {
        setMsg("❌ Galat ya removed credentials. Access denied.", "err");
        return;
      }
      if (rec.disabled || rec.role === "owner") {
        setMsg("⛔ Access revoked. " + CFG.contactMessage, "err");
        return;
      }

      return grant(rec.role === "admin" ? "admin" : "user", user);
    } catch (err) {
      console.error(err);
      setMsg("❌ Error: " + (err.message || "unknown"), "err");
    }
  });

  async function grant(role, user) {
    const session = { user, role, t: Date.now() };
    localStorage.setItem("uid_session", JSON.stringify(session));
    // remember me: creds save/remove
    try {
      if (remember && remember.checked) {
        localStorage.setItem("uid_remember", JSON.stringify({ user, pass: pass.value }));
      } else {
        localStorage.removeItem("uid_remember");
      }
    } catch (e) {}
    // online/lastSeen track karo
    try {
      await DB.touch(user);
    } catch (e) {}
    // DOMAIN EXPANSION flash (har user ko login par)
    const ov = document.getElementById("exp-overlay");
    if (ov) {
      ov.classList.add("show");
      setTimeout(() => { window.location.href = "admin.html"; }, 1850);
    } else {
      setTimeout(() => { window.location.href = "admin.html"; }, 400);
    }
  }
})();