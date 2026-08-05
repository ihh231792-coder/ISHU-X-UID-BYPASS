// ============================================================
// FREE ACCOUNT GATE  —  YouTube Subscribe + Discord Join
//  1) dono tasks kholo (open + tab switch ho)
//  2) generate dabao -> 15s countdown -> auto user/pass banta hai
//  3) ek browser = ek account (web/locks/<deviceId>) — owner reset tak
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

  // icons/names config se
  if (YT.channelName) ytName.textContent = "@" + YT.channelName + " subscribe karo";
  if (DC.serverName) dcName.textContent = DC.serverName + " server join karo";
  const ytImg = $("yt-icon"), dcImg = $("dc-icon");
  if (ytImg && YT.icon) ytImg.src = YT.icon;
  if (dcImg && DC.icon) dcImg.src = DC.icon;

  // local task state (browser pe)
  const opened = {
    yt: localStorage.getItem("uid_yt_open") === "1",
    dc: localStorage.getItem("uid_dc_open") === "1"
  };
  const switched = {
    yt: localStorage.getItem("uid_yt_switch") === "1",
    dc: localStorage.getItem("uid_dc_switch") === "1"
  };

  function bothDone() { return (opened.yt && switched.yt) && (opened.dc && switched.dc); }

  function refresh() {
    const y = opened.yt && switched.yt, d = opened.dc && switched.dc;
    ytStatus.textContent = y ? "✓ Done" : "Pending";
    ytStatus.className = "task-status" + (y ? " done" : "");
    dcStatus.textContent = d ? "✓ Done" : "Pending";
    dcStatus.className = "task-status" + (d ? " done" : "");
    genBtn.disabled = !bothDone();
  }

  // tab se wapas aaye to mark "switched" (matlab task khula tha)
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

  function toast(msg, type) {
    let n = document.querySelector(".notify");
    if (!n) {
      n = document.createElement("div");
      n.id = "notify"; n.className = "notify";
      document.body.appendChild(n);
    }
    n.className = "notify show " + (type || "ok");
    n.textContent = msg;
    clearTimeout(n._t);
    n._t = setTimeout(() => { n.className = "notify"; }, 3400);
  }

  // ---------- already used check ----------
  async function checkLock() {
    try {
      const lock = await DB.getLock(DID);
      if (lock && lock.user) {
        $("task-box").classList.add("hidden");
        $("already-box").classList.remove("hidden");
        $("already-text").innerHTML = "Is browser se account <b>" + lock.user + "</b> pehle hi generate ho chuka hai." +
          "<br />Naya account tab tak nahi banega jab tak owner <b>Reset</b> na kare.";
      }
    } catch (e) {}
  }

  // ---------- generate ----------
  genBtn.addEventListener("click", () => {
    if (!opened.yt || !switched.yt) {
      toast("❌ You are NOT subscribed to our channel! Pehle subscribe karo.", "err");
      return;
    }
    if (!opened.dc || !switched.dc) {
      toast("❌ You are NOT joined our Discord! Pehle join karo.", "err");
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
      // double check lock (race se bachne ke liye)
      const lock = await DB.getLock(DID);
      if (lock && lock.user) {
        $("task-box").classList.add("hidden");
        $("already-box").classList.remove("hidden");
        $("already-text").innerHTML = "Is browser se account <b>" + lock.user + "</b> pehle hi generate ho chuka hai.";
        return;
      }
      const user = "OXE_" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const pass = Math.random().toString(36).slice(2, 8) + Math.floor(Math.random() * 90 + 10);
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

      $("gen-user").textContent = user;
      $("gen-pass").textContent = pass;
      $("task-box").classList.add("hidden");
      $("result-box").classList.remove("hidden");
      toast("🎉 Account ready!", "ok");
    } catch (e) {
      console.error(e);
      toast("❌ Error: " + (e.message || e), "err");
      genBtn.disabled = !bothDone();
    }
  }

  refresh();
  checkLock();
})();
