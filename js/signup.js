// ============================================================
// FREE ACCOUNT GATE  —  YouTube Subscribe + Discord Join
//  1) YouTube: open karo + subscribe karo + wapas aao
//  2) Discord: join karo + backend bot se username VERIFY (100% real)
//  3) Tab hi Generate active -> short user/pass banta hai
//  4) Ek browser = ek account (web/locks/<deviceId>) — owner reset tak
//  History: uid_mycreds localStorage me saved, wapas aake dekh sakte hain
// ============================================================
(function () {
  const $ = id => document.getElementById(id);
  const G = window.__CONFIG.taskGate || {};
  const YT = G.youtube || {}, DC = G.discord || {};
  const BACKEND = (G.backendUrl || "").trim();

  function deviceId() {
    let d = localStorage.getItem("uid_device");
    if (!d) { d = "dev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); localStorage.setItem("uid_device", d); }
    return d;
  }
  const DID = deviceId();

  const ytStatus = $("yt-status"), dcStatus = $("dc-status");
  const ytName = $("yt-name"), dcName = $("dc-name");
  const genBtn = $("generate-btn"), countEl = $("count-down");
  const dcVerify = $("dc-verify"), dcTag = $("dc-tag"), dcMsg = $("dc-verify-msg"), dcVerifyBtn = $("dc-verify-btn");

  // icons/names
  if (YT.channelName) ytName.textContent = "@" + YT.channelName + " subscribe karo";
  if (DC.serverName) dcName.textContent = DC.serverName + " server join karo";
  if (YT.icon) $("yt-icon").src = YT.icon;
  if (DC.icon) $("dc-icon").src = DC.icon;

  // local state
  const opened = { yt: localStorage.getItem("uid_yt_open") === "1", dc: localStorage.getItem("uid_dc_open") === "1" };
  const switched = { yt: localStorage.getItem("uid_yt_switch") === "1", dc: localStorage.getItem("uid_dc_switch") === "1" };
  let dcVerified = localStorage.getItem("uid_dc_verified") === "1";

  function ytDone() { return opened.yt && switched.yt; }
  function allDone() { return ytDone() && dcVerified; }

  function refresh() {
    ytStatus.textContent = ytDone() ? "✓ Done" : "Pending";
    ytStatus.className = "task-status" + (ytDone() ? " done" : "");
    dcStatus.textContent = dcVerified ? "✓ Verified" : "Pending";
    dcStatus.className = "task-status" + (dcVerified ? " done" : "");
    genBtn.disabled = !allDone();
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      switched.yt = true; localStorage.setItem("uid_yt_switch", "1");
      switched.dc = true; localStorage.setItem("uid_dc_switch", "1");
      refresh();
    }
  });

  $("open-yt").addEventListener("click", () => {
    opened.yt = true; localStorage.setItem("uid_yt_open", "1");
    window.open(YT.url || "https://www.youtube.com/", "_blank");
    refresh();
  });
  $("open-dc").addEventListener("click", () => {
    opened.dc = true; localStorage.setItem("uid_dc_open", "1");
    dcVerify.classList.remove("hidden");
    window.open(DC.url || "https://discord.gg/", "_blank");
    refresh();
  });
  $("go-login").addEventListener("click", () => { window.location.href = "login.html"; });

  // ---------- copy helper ----------
  function copyText(txt, btn) {
    const done = () => { if (btn) { const o = btn.textContent; btn.textContent = "✅ Copied!"; setTimeout(() => btn.textContent = o, 1500); } };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
    } else fallbackCopy(txt, done);
  }
  function fallbackCopy(txt, done) {
    const ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }
  $("copy-user").addEventListener("click", e => copyText($("gen-user").textContent, e.target));
  $("copy-pass").addEventListener("click", e => copyText($("gen-pass").textContent, e.target));
  $("copy-saved-user").addEventListener("click", e => copyText($("saved-user").textContent, e.target));
  $("copy-saved-pass").addEventListener("click", e => copyText($("saved-pass").textContent, e.target));

  function toast(msg, type) {
    let n = document.querySelector(".notify");
    if (!n) { n = document.createElement("div"); n.id = "notify"; n.className = "notify"; document.body.appendChild(n); }
    n.className = "notify show " + (type || "ok");
    n.textContent = msg;
    clearTimeout(n._t);
    n._t = setTimeout(() => { n.className = "notify"; }, 3400);
  }

  // ---------- DISCORD REAL VERIFICATION ----------
  dcVerifyBtn.addEventListener("click", async () => {
    const tag = (dcTag.value || "").trim();
    if (!tag) { dcMsg.textContent = "❌ Pehle apna Discord username daalo."; dcMsg.style.color = "var(--danger)"; return; }
    if (!BACKEND || BACKEND.startsWith("https://YOUR-BACKEND-URL")) {
      dcMsg.textContent = "⚠️ Verification service abhi configured nahi hai — owner se bolo backend start kare (backend/server.py).";
      dcMsg.style.color = "var(--gold)";
      return;
    }
    dcMsg.textContent = "⏳ Bot se check ho raha hai...";
    dcMsg.style.color = "var(--cyan)";
    dcVerifyBtn.disabled = true;
    try {
      const r = await fetch(BACKEND + "/api/verify_discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag })
      });
      const j = await r.json();
      if (j.joined) {
        dcVerified = true;
        localStorage.setItem("uid_dc_verified", "1");
        dcMsg.innerHTML = "✅ Verified! Server member: <b>@" + j.member + "</b>";
        dcMsg.style.color = "var(--success)";
        toast("🔓 Discord verified!", "ok");
      } else {
        dcMsg.innerHTML = "❌ Tum abhi <b>Discord server me nahi ho</b>. Pehle join karo, phir wapas verify karo.";
        dcMsg.style.color = "var(--danger)";
      }
    } catch (e) {
      dcMsg.textContent = "⚠️ Verify error: " + (e.message || e) + " — backend on hai?";
      dcMsg.style.color = "var(--danger)";
    }
    dcVerifyBtn.disabled = false;
    refresh();
  });

  // ---------- already used / saved history ----------
  function showSavedCreds() {
    try {
      const saved = JSON.parse(localStorage.getItem("uid_mycreds") || "null");
      if (saved && saved.user) {
        $("saved-user").textContent = saved.user;
        $("saved-pass").textContent = saved.pass;
        $("saved-box").classList.remove("hidden");
      }
    } catch (e) {}
  }
  async function checkLock() {
    try {
      const lock = await DB.getLock(DID);
      if (lock && lock.user) {
        $("task-box").classList.add("hidden");
        $("already-box").classList.remove("hidden");
        $("already-text").innerHTML = "Is browser se account <b>" + lock.user + "</b> pehle hi generate ho chuka hai." +
          "<br />Naya account tab tak nahi banega jab tak owner <b>Reset</b> na kare.";
        showSavedCreds();
      }
    } catch (e) {}
  }

  // ---------- generate ----------
  genBtn.addEventListener("click", () => {
    if (!ytDone()) {
      toast("❌ You are NOT subscribed to our channel! YouTube pe subscribe karo.", "err");
      return;
    }
    if (!dcVerified) {
      toast("❌ You are NOT joined/verified in our Discord! Username verify karo.", "err");
      return;
    }
    let n = 15;
    countEl.classList.remove("hidden");
    countEl.textContent = "⏳ Generating in " + n + "s...";
    genBtn.disabled = true;
    const iv = setInterval(async () => {
      n--;
      if (n <= 0) {
        clearInterval(iv);
        countEl.textContent = "";
        await doGenerate();
      } else {
        countEl.textContent = "⏳ Generating in " + n + "s...";
      }
    }, 1000);
  });

  async function doGenerate() {
    try {
      const lock = await DB.getLock(DID);
      if (lock && lock.user) {
        $("task-box").classList.add("hidden");
        $("already-box").classList.remove("hidden");
        $("already-text").innerHTML = "Is browser se account <b>" + lock.user + "</b> pehle hi generate ho chuka hai.";
        showSavedCreds();
        return;
      }
      // SEQUENTIAL user/pass: OXC1/1231, OXC2/1232, OXC3/1233 ...
      const n = (await DB.getCounter()) + 1;
      const user = "OXC" + n;
      const pass = "123" + n;
      const data = await DB.init();
      if (data.users[user]) { toast("Retry — dobara dabao.", "err"); return; }
      data.users[user] = {
        pass, role: "user", disabled: false,
        generated: true, deviceId: DID,
        createdBy: "TASK_GATE", createdAt: Date.now()
      };
      await DB.addLog(data, "FREE ACCOUNT generated: " + user);
      await DB.save(data);
      await DB.setLock(DID, user);
      await DB.setCounter(n);

      // history — ye browser pe save (wapas aake dekh payenge)
      try { localStorage.setItem("uid_mycreds", JSON.stringify({ user, pass, at: Date.now() })); } catch (e) {}

      $("gen-user").textContent = user;
      $("gen-pass").textContent = pass;
      $("task-box").classList.add("hidden");
      $("result-box").classList.remove("hidden");
      toast("🎉 Account ready!", "ok");
    } catch (e) {
      console.error(e);
      toast("❌ Error: " + (e.message || e), "err");
      genBtn.disabled = !allDone();
    }
  }

  refresh();
  checkLock();
})();
