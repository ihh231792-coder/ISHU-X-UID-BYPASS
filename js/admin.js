// ============================================================
// DASHBOARD — role-based: owner / admin / normal user
// ============================================================
(function () {
  const CFG = window.__CONFIG;
  const $ = (id) => document.getElementById(id);

  // ---------- session guard ----------
  const sessRaw = localStorage.getItem("uid_session");
  if (!sessRaw) { window.location.href = "login.html"; return; }
  let SESSION;
  try { SESSION = JSON.parse(sessRaw); } catch (e) { window.location.href = "login.html"; return; }

  const isOwner = SESSION.role === "owner";
  const isAdmin = SESSION.role === "admin";
  const isUser = SESSION.role === "user";

  // display name: owner => ISHU_OXE
  const dispName = isOwner ? CFG.ownerName.toUpperCase() : SESSION.user.toUpperCase();
  $("disp-name").textContent = dispName;
  $("disp-role").textContent = isOwner ? "👑 OWNER (Full Access)" : isAdmin ? "🛡️ ADMIN" : "🟢 MEMBER";

  // contact line for normal users
  if (isUser) $("foot-contact").innerHTML = "⛔ " + CFG.contactMessage + " &nbsp;·&nbsp; ISHU X UID BYPASS © 2026";

  let data = null;
  let mode = "permanent";
  let newRole = "user";
  let pendingAction = null;
  let editUid = null;
  // member short-link unlock
  let unlocked = false;
  let gateUid = null, gateSecret = "", gateVisitor = "", gateId = null, gateBuilt = false;

  // ---------- toast ----------
  let toastTimer;
  function toast(msg, type) {
    const n = $("notify");
    n.textContent = msg;
    n.className = "notify show " + (type || "ok");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { n.className = "notify"; }, 3400);
  }

  // ---------- modal ----------
  function confirmModal(title, text, onYes) {
    $("modal-title").textContent = title;
    $("modal-text").textContent = text;
    pendingAction = onYes;
    $("modal").classList.add("show");
  }
  $("modal-yes").addEventListener("click", () => { $("modal").classList.remove("show"); if (pendingAction) { const f = pendingAction; pendingAction = null; f(); } });
  $("modal-no").addEventListener("click", () => { $("modal").classList.remove("show"); pendingAction = null; });

  // ---------- edit expiry modal ----------
  const editModal = $("modal-edit");
  $("edit-close").addEventListener("click", () => editModal.classList.remove("show"));
  $("edit-perm").addEventListener("click", async () => {
    if (!editUid || !data.uids[editUid]) return;
    data.uids[editUid].mode = "permanent";
    data.uids[editUid].expiry = null;
    await DB.addLog(data, `${SESSION.user} set UID ${editUid} to PERMANENT`);
    await DB.save(data);
    editModal.classList.remove("show");
    toast(`∞ UID ${editUid} ab permanent hai.`, "ok");
    render();
  });
  $("edit-apply").addEventListener("click", async () => {
    if (!editUid || !data.uids[editUid]) return;
    const d = $("edit-date").value, t = $("edit-time").value, y = $("edit-year").value;
    if (!d || !y) { toast("⚠️ Date aur year bharo.", "err"); return; }
    const dt = new Date(parseInt(y,10), parseInt(d.slice(5,7),10)-1, parseInt(d.slice(8,10),10));
    if (t) { const [hh,mm]=t.split(":"); dt.setHours(parseInt(hh,10), parseInt(mm,10)); }
    if (isNaN(dt.getTime())) { toast("❌ Invalid date.", "err"); return; }
    data.uids[editUid].mode = "expiry";
    data.uids[editUid].expiry = dt.getTime();
    await DB.addLog(data, `${SESSION.user} fixed expiry of UID ${editUid}`);
    await DB.save(data);
    editModal.classList.remove("show");
    toast(`⏱️ UID ${editUid} ka expiry fix ho gaya.`, "ok");
    render();
  });

  // ---------- member short-link gate ----------
  const gateModal = $("modal-gate");
  function setGateStatus(t) { $("gate-status").textContent = t || ""; }
  async function openGate(uid) {
    gateUid = uid;
    gateModal.classList.add("show");
    setGateStatus("Preparing short link...");
    try {
      if (!gateBuilt) {
        const r = await Shortener.build();
        gateId = r.id; gateSecret = r.secret; gateVisitor = r.visitor; gateBuilt = true;
      }
      setGateStatus("Link ready — " + (Shortener.isOn() ? "open karo aur poori karo." : "Shortener config nahi hai, admin se pucho."));
      $("gate-iframe").src = gateVisitor;
    } catch (e) { console.error(e); setGateStatus("⚠️ Server error: " + (e.message || e)); }
  }
  $("gate-open").addEventListener("click", () => { if (gateVisitor) window.open(gateVisitor, "_blank"); });
  $("gate-done").addEventListener("click", async () => {
    setGateStatus("Verifying... ✓");
    let ok = false;
    for (let i = 0; i < 6; i++) {
      try { const r = await Shortener.verify(gateId, gateSecret); if (r.ok) { ok = true; break; } } catch (e) {}
      await new Promise(res => setTimeout(res, 2500));
    }
    if (ok) {
      unlocked = true;
      gateModal.classList.remove("show");
      gateBuilt = false;
      toast("🔓 Unlocked! Ab next UID add kar sakte ho.", "ok");
      await doAddUserUid(gateUid);
    } else {
      setGateStatus("Abhi complete nahi hua. Link poora karo aur dobara dabao.");
    }
  });
  $("gate-cancel").addEventListener("click", () => { gateModal.classList.remove("show"); gateBuilt = false; });

  // ---------- tabs ----------
  function buildTabs() {
    const tabs = $("tabs");
    const defs = isUser
      ? [["add","➕ Add My UID"], ["manage","📋 My UIDs"]]
      : isAdmin
        ? [["add","➕ Add UID"], ["manage","🗂️ Manage UIDs"]]
        : [["add","➕ Add UID"], ["manage","🗂️ Manage UIDs"], ["users","🛡️ Users & Admins"], ["gen","🎁 Free Accounts"]];
    tabs.innerHTML = "";
    defs.forEach(([id,label], i) => {
      const b = document.createElement("button");
      b.className = "tab" + (i===0 ? " active" : "");
      b.dataset.panel = id;
      b.textContent = label;
      tabs.appendChild(b);
    });
    // show correct panels / hide owner-only
    const panels = ["add","manage","users","gen"];
    panels.forEach(p => { const el = $("panel-"+p); if (el) el.classList.remove("active"); });
    $("panel-" + defs[0][0]).classList.add("active");
    $("panel-users").classList.toggle("hidden", !isOwner);
    $("panel-gen").classList.toggle("hidden", !isOwner);
    // forms
    $("admin-add-form").classList.toggle("hidden", isUser);
    $("user-add-form").classList.toggle("hidden", !isUser);
    // stats
    $("stats-admin").classList.toggle("hidden", isUser);
    // status card sab roles ko dikhta hai (owner ko breakdown, member ko countdown)
    $("my-status").classList.remove("hidden");
  }
  $("tabs").addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (!t) return;
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    $("panel-" + t.dataset.panel).classList.add("active");
    render();
  });

  // ---------- role chips / mode toggles ----------
  document.querySelectorAll(".radio-card").forEach(c => c.addEventListener("click", () => {
    document.querySelectorAll(".radio-card").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected");
    mode = c.dataset.mode;
    $("expiry-fields").classList.toggle("hidden", mode !== "expiry");
  }));
  document.querySelectorAll("[data-newrole]").forEach(c => c.addEventListener("click", () => {
    document.querySelectorAll("[data-newrole]").forEach(x => x.classList.remove("active"));
    c.classList.add("active");
    newRole = c.dataset.newrole;
  }));

  // ---------- logout ----------
  $("logout-btn").addEventListener("click", () => { localStorage.removeItem("uid_session"); window.location.href = "login.html"; });

  // ---------- helpers ----------
  function fmtDate(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    const p = (x) => String(x).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function remaining(ts) {
    const diff = ts - Date.now();
    if (diff <= 0) return { txt: "EXPIRED", exp: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return { txt: `${h}h ${m}m left`, exp: false };
    const s = Math.floor((diff % 60000) / 1000);
    return { txt: `${m}m ${s}s left`, exp: false };
  }
  function myActiveUid() {
    const uids = data.uids || {};
    for (const u in uids) {
      const rec = uids[u];
      if (rec.addedBy === SESSION.user && rec.mode === "expiry") {
        if (rec.expiry && rec.expiry > Date.now()) return { uid: u, rec };
      }
    }
    return null;
  }
  function myAllUids() {
    const uids = data.uids || {};
    const out = [];
    for (const u in uids) if (uids[u].addedBy === SESSION.user) out.push({ uid: u, rec: uids[u] });
    return out;
  }

  // ---------- online tracking ----------
  const ONLINE_WINDOW = 3 * 60 * 1000; // 3 min andar lastSeen = online
  function isOnline(rec) { return rec && !rec.disabled && rec.lastSeen && (Date.now() - rec.lastSeen) <= ONLINE_WINDOW; }
  function roleCounts() {
    const users = data.users || {};
    const out = { members: 0, membersOn: 0, admins: 0, adminsOn: 0 };
    for (const u in users) {
      if (u === CFG.ownerUsername) continue;
      const r = users[u];
      if (r.role === "admin") { out.admins++; if (isOnline(r)) out.adminsOn++; }
      else if (r.role === "user") { out.members++; if (isOnline(r)) out.membersOn++; }
    }
    return out;
  }
  function uidByRole() {
    const uids = data.uids || {};
    const out = { owner: 0, admin: 0, member: 0 };
    for (const u in uids) {
      const r = uids[u].addedByRole;
      if (r === "admin") out.admin++;
      else if (r === "user") out.member++;
      else out.owner++;
    }
    return out;
  }

  // ---------- render ----------
  function renderStats() {
    const uids = data.uids || {};
    const users = data.users || {};
    let perm = 0, exp = 0;
    for (const u in uids) { if (uids[u].mode === "permanent") perm++; else exp++; }
    $("s-total").textContent = Object.keys(uids).length;
    $("s-perm").textContent = perm;
    $("s-exp").textContent = exp;
    $("s-users").textContent = Object.keys(users).length;
  }

  function renderMyStatus() {
    const box = $("status-box");
    if (isUser) {
      const active = myActiveUid();
      if (active) {
        box.innerHTML = `
          <div class="stat-line">Your UID: <b style="letter-spacing:1px">${active.uid}</b> &nbsp; <span class="pill expiry">ACTIVE</span></div>
          <div class="stat-line">Expiry: ${fmtDate(active.rec.expiry)}</div>
          <div class="stat-line countdown" id="cd" style="color:var(--cyan);font-size:22px;margin-top:8px">${remaining(active.rec.expiry).txt}</div>`;
      } else {
        box.innerHTML = `<div style="color:var(--muted)">Koi active UID nahi. <b>Niche "Add My UID"</b> se 24h ke liye ek UID add karo.</div>`;
      }
    } else {
      const users = data.users || {};
      const rc = isOwner ? roleCounts() : null;
      const uc = uidByRole();
      const o = `<div class="stat-line">👑 Owner UIDs: <b>${uc.owner}</b> &nbsp;·&nbsp; ⚙️ Admin UIDs: <b>${uc.admin}</b> &nbsp;·&nbsp; 🟢 Member UIDs: <b>${uc.member}</b></div>`;
      if (isOwner) {
        const totalAccounts = rc.members + rc.admins;
        box.innerHTML = `
          <div class="stat-line">🟢 Members online: <b style="color:var(--success)">${rc.membersOn} / ${rc.members}</b> &nbsp;·&nbsp; Offline: <b>${rc.members - rc.membersOn}</b></div>
          <div class="stat-line">🛡️ Admins online: <b style="color:var(--success)">${rc.adminsOn} / ${rc.admins}</b> &nbsp;·&nbsp; Offline: <b>${rc.admins - rc.adminsOn}</b></div>
          <div class="stat-line">👤 Total accounts: <b>${totalAccounts}</b> (members ${rc.members} + admins ${rc.admins})</div>
          ${o}
          <div class="stat-line">🧮 Total UIDs: <b>${Object.keys(data.uids||{}).length}</b></div>`;
      } else {
        let admins = 0, nusers = 0;
        for (const u in users) { if (users[u].disabled) continue; if (users[u].role === "admin") admins++; else if (users[u].role === "user") nusers++; }
        box.innerHTML = `<div class="stat-line">🛡️ Admins: <b>${admins}</b> &nbsp;·&nbsp; 🟢 Members: <b>${nusers}</b></div>${o}`;
      }
    }
  }

  function renderUids() {
    const body = $("uid-body");
    body.innerHTML = "";
    const uids = isUser ? myAllUids() : Object.keys(data.uids || {}).map(u => ({ uid: u, rec: data.uids[u] }));
    if (uids.length === 0) { $("uid-empty").classList.remove("hidden"); return; }
    $("uid-empty").classList.add("hidden");
    uids.sort((a,b) => (b.rec.addedAt||0)-(a.rec.addedAt||0)).forEach(({uid, rec}) => {
      const now = Date.now();
      const expired = rec.mode === "expiry" && rec.expiry && rec.expiry <= now;
      const pill = expired ? '<span class="pill expired">EXPIRED</span>'
        : rec.mode === "permanent" ? '<span class="pill permanent">∞ PERMANENT</span>'
        : `<span class="pill expiry">⏱ ${isUser ? remaining(rec.expiry).txt : fmtDate(rec.expiry)}</span>`;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-weight:700;letter-spacing:1px">${uid}</td>
        <td>${pill}</td>
        <td>${rec.mode === "permanent" ? "Never" : fmtDate(rec.expiry)}</td>
        <td>${(rec.addedBy||"❔").toUpperCase()}</td>
        <td class="mng-col">${isUser ? '<span style="color:var(--muted)">Read-only</span>' : `<button class="mini-btn edit-btn" data-uid="${uid}">✏️ Fix</button>
          <button class="mini-btn del-btn" data-uid="${uid}">Remove</button>`}</td>`;
      body.appendChild(tr);
    });
    body.querySelectorAll(".del-btn").forEach(b => b.addEventListener("click", () => {
      confirmModal("Remove UID", `UID "${b.dataset.uid}" ko delete karna hai?`, () => removeUid(b.dataset.uid));
    }));
    body.querySelectorAll(".edit-btn").forEach(b => b.addEventListener("click", () => openEdit(b.dataset.uid)));
  }

  function openEdit(uid) {
    const rec = data.uids[uid];
    if (!rec) return;
    editUid = uid;
    const d = rec.expiry ? new Date(rec.expiry) : new Date();
    const p = (x) => String(x).padStart(2, "0");
    $("edit-uid-label").textContent = "UID: " + uid;
    $("edit-date").value = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
    $("edit-time").value = `${p(d.getHours())}:${p(d.getMinutes())}`;
    $("edit-year").value = d.getFullYear();
    editModal.classList.add("show");
  }

  function renderUsers() {
    const body = $("user-body");
    body.innerHTML = "";
    const users = data.users || {};
    const ids = Object.keys(users);
    if (ids.length === 0) { body.innerHTML = '<tr><td colspan="4" class="empty">Koi account nahi</td></tr>'; return; }
    ids.filter(u => u !== CFG.ownerUsername).forEach(user => {
      const rec = users[user];
      const rolePill = rec.role === "admin" ? '<span class="pill admin">🛡️ ADMIN</span>' : '<span class="pill expiry">🟢 MEMBER</span>';
      const status = rec.disabled ? '<span class="pill expired">⛔ BLOCKED</span>' : '<span class="pill permanent">✔ ACTIVE</span>';
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-weight:700">${user}</td>
        <td>${rolePill}</td>
        <td>${status}</td>
        <td><button class="mini-btn block-btn" data-user="${user}">${rec.disabled ? "Unblock" : "Block"}</button>
            <button class="mini-btn del-btn" data-user="${user}">Remove</button></td>`;
      body.appendChild(tr);
    });
    body.querySelectorAll(".block-btn").forEach(b => b.addEventListener("click", () => {
      const user = b.dataset.user;
      data.users[user].disabled = !data.users[user].disabled;
      DB.save(data).then(async () => {
        await DB.addLog(data, `${SESSION.user} ${data.users[user].disabled ? "blocked" : "unblocked"} ${user}`);
        await DB.save(data);
        toast(data.users[user].disabled ? `⛔ ${user} block ho gaya.` : `✅ ${user} unblock ho gaya.`, "ok");
        render();
      });
    }));
    body.querySelectorAll(".del-btn").forEach(b => b.addEventListener("click", () => {
      const user = b.dataset.user;
      confirmModal("Remove Account", `"${user}" ko hatao? Hatane ke baad wo login nahi kar payega + contact wala msg dikhega.`, () => removeUser(user));
    }));
  }

  // ---------- generated free accounts (owner only) ----------
  function renderGen() {
    const body = $("gen-body");
    if (!body) return;
    body.innerHTML = "";
    const gens = Object.entries(data.users || {})
      .filter(([, r]) => r && r.generated)
      .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
    if (gens.length === 0) { $("gen-empty").classList.remove("hidden"); return; }
    $("gen-empty").classList.add("hidden");
    gens.forEach(([user, rec]) => {
      const tr = document.createElement("tr");
      const st = rec.disabled ? '<span class="pill expired">⛔ BLOCKED</span>' : '<span class="pill permanent">✔ ACTIVE</span>';
      const sw = rec.swid ? rec.swid.slice(0, 18) + "…" : "—";
      tr.innerHTML = `
        <td style="font-weight:700">${user}</td>
        <td><b style="color:var(--pink);letter-spacing:1px">${rec.pass}</b></td>
        <td>${fmtDate(rec.createdAt)}</td>
        <td style="font-size:12px;color:var(--muted)">${sw}</td>
        <td>${st}
          <button class="mini-btn reset-btn" data-user="${user}" title="Account is PC pe locked hai — isse reset karo to kisi aur PC pe use kar sakega">🔓 Reset SWID</button>
          <button class="mini-btn edit-btn" data-user="${user}" title="Is browser se naya account ban sakta hai">↻ New-Gen</button>
          <button class="mini-btn del-btn" data-user="${user}">Remove</button></td>`;
      body.appendChild(tr);
    });
    body.querySelectorAll(".edit-btn").forEach(b => b.addEventListener("click", () => {
      const user = b.dataset.user;
      confirmModal("Reset Access", `"${user}" ka browser lock reset karein? Iske baad us browser se naya FREE account ban sakta hai.`, () => resetGen(user));
    }));
    body.querySelectorAll(".reset-btn").forEach(b => b.addEventListener("click", () => {
      const user = b.dataset.user;
      confirmModal("Reset SWID", `"${user}" ka device lock reset karein? Iske baad ye account kisi bhi PC/device pe login karke use kar sakega (pehla login naye device ko bind karega).`, () => resetSwid(user));
    }));
    body.querySelectorAll(".del-btn").forEach(b => b.addEventListener("click", () => {
      const user = b.dataset.user;
      confirmModal("Remove Account", `"${user}" ko hatao? Account delete ho jayega. Browser lock REHTA hai — wahi browser dobara generate nahi kar payega.`, () => removeUser(user));
    }));
  }

  async function resetSwid(user) {
    const rec = data.users && data.users[user];
    if (!rec) return;
    rec.swid = null;
    await DB.addLog(data, `${SESSION.user} RESET SWID of ${user}`);
    await DB.save(data);
    toast(`🔓 ${user} ka SWID reset. Ab kisi bhi PC pe use kar sakta hai.`, "ok");
    render();
  }

  async function resetGen(user) {
    const rec = data.users && data.users[user];
    if (!rec) return;
    if (rec.deviceId) await DB.clearLock(rec.deviceId);
    await DB.addLog(data, `${SESSION.user} RESET free-account lock of ${user}`);
    await DB.save(data);
    toast(`↻ ${user} ka lock reset. Us browser se naya account ban sakta hai.`, "ok");
    render();
  }

  function render() {
    if (!data) return;
    renderStats();
    renderMyStatus();
    renderUids();
    if (isOwner) { renderUsers(); renderGen(); }
  }

  // ---------- add UID (admin/owner) ----------
  $("add-uid-btn").addEventListener("click", async () => {
    const uid = $("uid-input").value.trim();
    if (!uid || !/^[0-9]+$/.test(uid)) { toast("⚠️ Valid numeric UID daalo.", "err"); return; }
    if (data.uids[uid]) { toast("❌ Yeh UID pehle se add hai.", "err"); return; }
    let expiry = null;
    if (mode === "expiry") {
      const d = $("exp-date").value, t = $("exp-time").value, y = $("exp-year").value;
      if (!d || !y) { toast("⚠️ Expiry date aur year bharo.", "err"); return; }
      const dt = new Date(parseInt(y,10), parseInt(d.slice(5,7),10)-1, parseInt(d.slice(8,10),10));
      if (t) { const [hh,mm]=t.split(":"); dt.setHours(parseInt(hh,10), parseInt(mm,10)); }
      if (isNaN(dt.getTime())) { toast("❌ Invalid expiry.", "err"); return; }
      if (dt.getTime() <= Date.now()) { toast("⚠️ Expiry future me rakho.", "err"); return; }
      expiry = dt.getTime();
    }
    data.uids[uid] = { mode, expiry, addedBy: SESSION.user, addedByRole: SESSION.role, addedAt: Date.now() };
    // SAFE BY tool ke liye bhi users/<key>/uids me push karo
    const fbKey = await DB.pushUid(uid);
    if (fbKey) data.uids[uid].fbKey = fbKey;
    await DB.addLog(data, `${SESSION.user} added UID ${uid} (${mode})`);
    await DB.save(data);
    $("uid-input").value = ""; $("exp-date").value=""; $("exp-time").value=""; $("exp-year").value="";
    toast(`✅ UID ${uid} add ho gaya (${mode}).`, "ok");
    render();
  });

  // ---------- add my UID (member, 24h only) ----------
  async function doAddUserUid(uid) {
    const hrs = CFG.userUidDurationHours || 24;
    data.uids[uid] = {
      mode: "expiry",
      expiry: Date.now() + hrs * 3600000,
      addedBy: SESSION.user,
      addedByRole: "user",
      addedAt: Date.now()
    };
    const ur = data.users[SESSION.user] = data.users[SESSION.user] || {};
    ur.claims = (ur.claims || 0) + 1;
    // SAFE BY tool ke liye bhi push karo
    const fbKey = await DB.pushUid(uid);
    if (fbKey) data.uids[uid].fbKey = fbKey;
    await DB.addLog(data, `${SESSION.user} added their UID ${uid} (${hrs}h)`);
    await DB.save(data);
    unlocked = false;
    $("uid-input-user").value = "";
    toast(`✅ UID ${uid} add ho gaya — ${hrs} hour ke liye valid.`, "ok");
    render();
  }

  $("add-uid-user-btn").addEventListener("click", async () => {
    const uid = $("uid-input-user").value.trim();
    if (!uid || !/^[0-9]+$/.test(uid)) { toast("⚠️ Valid numeric UID daalo.", "err"); return; }
    if (data.uids[uid]) { toast("❌ Yeh UID pehle se hai. Dusra daalo.", "err"); return; }
    const active = myActiveUid();
    if (active) { toast("⛔ Pehle se ek active UID hai (24h). Tab tak add nahi kar sakte.", "err"); return; }
    // 1st UID free; next UID ke liye short link (VP Link) complete karna hoga
    const ur = data.users[SESSION.user] = data.users[SESSION.user] || {};
    const claims = ur.claims || 0;
    if (Shortener.isOn() && claims >= 1 && !unlocked) { openGate(uid); return; }
    await doAddUserUid(uid);
  });

  async function removeUid(uid) {
    const rec = data.uids[uid];
    if (rec && rec.fbKey) await DB.removeUidFb(rec.fbKey);
    delete data.uids[uid];
    await DB.addLog(data, `${SESSION.user} removed UID ${uid}`);
    await DB.save(data);
    toast(`🗑️ UID ${uid} remove kar diya.`, "ok");
    render();
  }
  async function removeUser(user) {
    // Account + uske by white-listed sare UIDs delete ho jayenge
    let removedUids = 0;
    for (const u in (data.uids || {})) {
      if (data.uids[u].addedBy === user) {
        if (data.uids[u].fbKey) await DB.removeUidFb(data.uids[u].fbKey);
        delete data.uids[u];
        removedUids++;
      }
    }
    delete data.users[user];
    await DB.addLog(data, `${SESSION.user} removed account ${user} (${removedUids} UIDs deleted)`);
    await DB.save(data);
    toast(`🗑️ "${user}" hataya. ${removedUids} UID bhi delete.`, "ok");
    render();
  }

  // ---------- create account (owner only) ----------
  $("create-acc-btn").addEventListener("click", async () => {
    const u = $("nu-user").value.trim();
    const p = $("nu-pass").value.trim();
    if (!u || !p) { toast("⚠️ Username aur password bharo.", "err"); return; }
    if (u === CFG.ownerUsername || data.users[u]) { toast("❌ Yeh username pehle se hai.", "err"); return; }
    data.users[u] = { pass: p, role: newRole, disabled: false, createdBy: SESSION.user, createdAt: Date.now() };
    await DB.addLog(data, `${SESSION.user} created ${newRole} "${u}"`);
    await DB.save(data);
    $("nu-user").value = ""; $("nu-pass").value = "";
    toast(`✅ ${newRole === "admin" ? "Admin" : "Member"} "${u}" create ho gaya.`, "ok");
    render();
  });

  // ---------- live search (admin/owner only) ----------
  $("search-uids").addEventListener("input", () => { if (!isUser) renderUids(); });

  // ---------- click guard: user ke liye search hidden / manage read-only ----
  // (already handled in renderUids)

  // ---------- live countdown for normal user ----------
  setInterval(() => {
    if (!isUser || !data) return;
    const cd = $("cd");
    if (!cd) return;
    const active = myActiveUid();
    if (active) cd.textContent = remaining(active.rec.expiry).txt;
  }, 1000);

  // ---------- heartbeat: lastSeen update + owner online refresh ----------
  setInterval(async () => {
    if (!data) return;
    try {
      await DB.touch(SESSION.user);
      if (isOwner) renderMyStatus();
    } catch (e) {}
  }, 25000);

  // ---------- init ----------
  (async function init() {
    buildTabs();
    try {
      data = await DB.init();
      // 2fa check: session role vs database (in case blocked while logged in)
      const users = data.users || {};
      if (SESSION.user !== CFG.ownerUsername) {
        const rec = users[SESSION.user];
        if (!rec || rec.disabled) {
          toast("⛔ " + CFG.contactMessage, "err");
          setTimeout(() => { localStorage.removeItem("uid_session"); window.location.href = "login.html"; }, 1400);
          return;
        }
      }
      // mark self online on load
      const me = data.users && data.users[SESSION.user];
      if (me) { me.lastSeen = Date.now(); await DB.save(data); }
      render();
    } catch (e) { console.error(e); toast("❌ Database init error.", "err"); }
  })();

})();