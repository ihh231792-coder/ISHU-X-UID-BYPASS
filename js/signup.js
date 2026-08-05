// ============================================================
// FREE ACCOUNT GATE  —  YouTube Subscribe + Discord Join
//  1) YouTube open karo + subscribe + bell + wapas aao
//  2) Discord open karo + join + wapas aao
//  3) Tab hi Generate active -> sequential user/pass (OXC1/1231...)
//  4) Ek browser = ek account (web/locks/<deviceId>) — owner reset tak
//  SWID: account pehle login ke device pe lock ho jata hai
//  History: uid_mycreds localStorage me saved, wapas aake dekh sakte hain
// ============================================================
(function () {
  const $ = id => document.getElementById(id);
  const G = window.__CONFIG.taskGate || {};
  const YT = G.youtube || {}, DC = G.discord || {};

  function deviceId() {
    let d = localStorage.getItem("uid_device");
    if (!d) { d = "dev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); localStorage.setItem("uid_device", d); }
    return d;
  }
  const DID = deviceId();

  const ytStatus = $("yt-status"), dcStatus = $("dc-status");
  const ytName = $("yt-name"), dcName = $("dc-name");
  const genBtn = $("generate-btn"), countEl = $("count-down");

  // icons/names
  if (YT.channelName) ytName.textContent = "@" + YT.channelName + " subscribe karo";
  if (DC.serverName) dcName.textContent = DC.serverName + " server join karo";
  if (YT.icon) $("yt-icon").src = YT.icon;
  if (DC.icon) $("dc-icon").src = DC.icon;

  // local state (browser pe)
  const opened = { yt: localStorage.getItem("uid_yt_open") === "1", dc: localStorage.getItem("uid_dc_open") === "1" };
  const switched = { yt: localStorage.getItem("uid_yt_switch") === "1", dc: localStorage.getItem("uid_dc_switch") === "1" };

  function ytDone() { return opened.yt && switched.yt; }
  function dcDone() { return opened.dc && switched.dc; }
  function allDone() { return ytDone() && dcDone(); }

  function refresh() {
    ytStatus.textContent = ytDone() ? "✓ Done" : "Pending";
    ytStatus.className = "task-status" + (ytDone() ? " done" : "");
    dcStatus.textContent = dcDone() ? "✓ Done" : "Pending";
    dcStatus.className = "task-status" + (dcDone() ? " done" : "");
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
    if (!dcDone()) {
      toast("❌ You are NOT joined our Discord! Discord join karo.", "err");
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

      // history — is browser pe save (wapas aake dekh payenge)
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
