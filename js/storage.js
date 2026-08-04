// ============================================================
// DATABASE LAYER  (localStorage abhi / Firebase baad)
// ============================================================

const DB = (function () {
  const KEY = "uid_bypass_db_v2";
  const CFG = window.__CONFIG;

  // ---------- Default structure ----------
  function empty() {
    return {
      users: {},  // username -> { pass, role: owner|admin|user, disabled, createdBy, createdAt }
      uids: {},   // uid -> { mode, expiry, addedBy, addedByRole, addedAt }
      log: []
    };
  }

  // ---------- Firebase setup (async) ----------
  async function ensureFirebase() {
    if (window.__fbReady) return true;
    if (!CFG.useFirebase) return false;
    if (!CFG.firebase.apiKey) return false;
    try {
      const mod = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const dbMod = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
      const app = mod.initializeApp(CFG.firebase);
      const db = dbMod.getDatabase(app);
      window.__fb = { app, db, ref: dbMod.ref, get: dbMod.get, set: dbMod.set,
                      update: dbMod.update, remove: dbMod.remove, onValue: dbMod.onValue };
      window.__fbReady = true;
      return true;
    } catch (e) { console.warn("Firebase init failed", e); return false; }
  }

  // ---------- read ----------
  async function read() {
    if (CFG.useFirebase) {
      if (!(await ensureFirebase())) return readLocal();
      const snap = await window.__fb.get(window.__fb.ref(window.__fb.db, "data"));
      if (!snap.exists()) return empty();
      return snap.val();
    }
    return readLocal();
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
    data.uids = pruneExpired(data.uids);
    if (CFG.useFirebase) {
      if (!(await ensureFirebase())) { writeLocal(data); return; }
      // update() top-level keys (users/uids/log) ko merge karta hai,
      // isliye phone + PC alag-alag write kar rahe hoon to bhi data nahi udta.
      await window.__fb.update(window.__fb.ref(window.__fb.db, "data"), data);
      return;
    }
    writeLocal(data);
  }

  function writeLocal(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  // ---------- helpers ----------
  function pruneExpired(uids) {
    const out = {};
    const now = Date.now();
    for (const uid in uids) {
      const u = uids[uid];
      // permanent UIDs: kabhi expire nahi
      if (u.mode === "permanent") { out[uid] = u; continue; }
      // expiry UIDs: sirf uno< now hatao
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
    }
  };
})();