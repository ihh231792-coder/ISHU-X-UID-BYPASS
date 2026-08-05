// ============================================================
// DATABASE LAYER  (Firebase Realtime DB via REST + localStorage fallback)
//  • Website ka apna data ->  node "web"  (users/uids/log)
//  • SAFE BY tool ke liye UID -> node "users"  (users/<key>/uids[])
//  • Public rules wale Firebase pe bina auth ke chal jata hai
// ============================================================

const DB = (function () {
  const KEY = "uid_bypass_db_v2";
  const CFG = window.__CONFIG;
  const FB = (CFG.useFirebase && CFG.firebase && CFG.firebase.databaseURL)
    ? CFG.firebase.databaseURL.replace(/\/+$/, "") : "";

  // ---------- Default structure ----------
  function empty() {
    return {
      users: {},  // username -> { pass, role: owner|admin|user, disabled, createdBy, createdAt, lastSeen, claims }
      uids: {},   // uid -> { mode, expiry, addedBy, addedByRole, addedAt, fbKey }
      log: []
    };
  }

  // ---------- Firebase REST helpers ----------
  async function fbGet(path) {
    const r = await fetch(FB + path + ".json", { cache: "no-store" });
    if (!r.ok) throw new Error("fb read " + r.status);
    return r.json();
  }
  async function fbPatch(path, val) {
    const r = await fetch(FB + path + ".json", { method: "PATCH", body: JSON.stringify(val) });
    if (!r.ok) throw new Error("fb patch " + r.status);
  }
  async function fbPost(path, val) {
    const r = await fetch(FB + path + ".json", { method: "POST", body: JSON.stringify(val) });
    if (!r.ok) throw new Error("fb post " + r.status);
    return (await r.json()).name;
  }
  async function fbDelete(path) {
    const r = await fetch(FB + path + ".json", { method: "DELETE" });
    if (!r.ok) throw new Error("fb delete " + r.status);
  }

  // ---------- read ----------
  async function read() {
    if (!FB) return readLocal();
    try {
      const snap = await fbGet("/web");
      if (!snap) return empty();
      snap.users = snap.users || {};
      snap.uids = snap.uids || {};
      snap.log = snap.log || [];
      return snap;
    } catch (e) {
      console.warn("Firebase read failed, local fallback:", e);
      return readLocal();
    }
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      return JSON.parse(raw);
    } catch (e) { return empty(); }
  }

  // ---------- write ----------
  async function write(data) {
    // expired UIDs: tool-side (users/<key>) bhi delete karo
    const now = Date.now();
    const expKeys = [];
    for (const uid in (data.uids || {})) {
      const u = data.uids[uid];
      if (u.mode !== "permanent" && u.expiry && u.expiry <= now && u.fbKey) expKeys.push(u.fbKey);
    }
    data.uids = pruneExpired(data.uids);
    if (!FB) { writeLocal(data); return; }
    try {
      // top-level keys merge karo -> alag devices ke writes ek dusre ko nahi udate
      await fbPatch("/web", {
        users: data.users || {},
        uids: data.uids || {},
        log: (data.log || []).slice(0, 60)
      });
      for (const k of expKeys) { try { await fbDelete("/users/" + k); } catch (e) {} }
    } catch (e) {
      console.warn("Firebase write failed, local fallback:", e);
      writeLocal(data);
    }
  }

  function writeLocal(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  // ---------- targeted lastSeen update (heartbeat) ----------
  async function touch(user) {
    if (!FB) return;
    try { await fbPatch("/web/users/" + user, { lastSeen: Date.now() }); } catch (e) {}
  }

  // ---------- SAFE BY tool sync ----------
  // Tool is format padhta hai:  users/<key>/uids -> [{"uid": "...", "added": ts}]
  async function pushUid(uid) {
    if (!FB) return null;
    try {
      return await fbPost("/users", { uids: [{ uid: String(uid), added: Date.now() }] });
    } catch (e) { console.warn("pushUid failed:", e); return null; }
  }

  async function removeUidFb(fbKey) {
    if (!FB || !fbKey) return;
    try { await fbDelete("/users/" + fbKey); } catch (e) {}
  }

  // ---------- device lock (free-account one-time gate) ----------
  // har browser ka apna deviceId -> web/locks/<deviceId> = username
  async function getLock(deviceId) {
    if (!FB || !deviceId) return null;
    try { return (await fbGet("/web/locks/" + deviceId)) || null; } catch (e) { return null; }
  }
  async function setLock(deviceId, username) {
    if (!FB || !deviceId) return;
    try { await fbPatch("/web/locks/" + deviceId, { user: username, at: Date.now() }); } catch (e) {}
  }
  async function clearLock(deviceId) {
    if (!FB || !deviceId) return;
    try { await fbDelete("/web/locks/" + deviceId); } catch (e) {}
  }

  // ---------- sequential counter (OXC1, OXC2, ...) ----------
  async function getCounter() {
    if (!FB) return 0;
    try { return (await fbGet("/web/counter")) || 0; } catch (e) { return 0; }
  }
  async function setCounter(n) {
    if (!FB) return;
    try { await fbPatch("/web/counter", n); } catch (e) {}
  }

  // ---------- helpers ----------
  function pruneExpired(uids) {
    const out = {};
    const now = Date.now();
    for (const uid in uids) {
      const u = uids[uid];
      if (u.mode === "permanent") { out[uid] = u; continue; }
      if (u.expiry && u.expiry <= now) continue;
      out[uid] = u;
    }
    return out;
  }

  // ---------- public API ----------
  return {
    async init() {
      let data = await read();
      data.users = data.users || {};
      // Ensure owner hamesha present ho
      if (!data.users[CFG.ownerUsername]) {
        data.users[CFG.ownerUsername] = {
          pass: CFG.ownerPassword, role: "owner", disabled: false,
          createdBy: "SYSTEM", createdAt: Date.now()
        };
        await write(data);
      }
      return data;
    },
    async get() { return read(); },
    async save(data) { return write(data); },
    async addLog(data, msg) {
      data.log = data.log || [];
      data.log.unshift({ msg, at: Date.now() });
      data.log = data.log.slice(0, 60);
    },
    touch,
    pushUid,
    removeUidFb,
    getLock,
    setLock,
    clearLock,
    getCounter,
    setCounter
  };
})();
