# ⚡ ISHU X UID BYPASS

Premium UID Management Panel — **Gojo / Domain Expansion: Infinite Void** theme.

- **Owner:** `ISHU_OXE` (login: `OXE` / `OXE`, passcode: `637135`)
- **Roles:** 👑 Owner · 🛡️ Admin · 🟢 Member
- **Member:** apna EK UID, 24 hour valid, agle UID ke liye VP-Link short link.
- **Admin:** UID add/remove/fix expiry.
- **Owner:** accounts banata/block/remove karta hai + full stats (online/offline).

---

## 📁 Files

```
UID WEBSITE/
├── index.html        → Landing (Gojo animation bg + intro flash)
├── login.html        → Login (Owner/Admin/Member, remember me, passcode)
├── admin.html        → Dashboard (role-based)
├── unlock.html       → Short-link completion page
├── css/style.css
└── js/
    ├── config.js     → SITE NAME + OWNER + PASSCODE + SHORTENER + FIREBASE
    ├── storage.js    → Database layer (localStorage ya Firebase)
    ├── void.js       → Gojo Domain Expansion canvas animation
    ├── login.js      → Login + passcode + remember me
    ├── admin.js      → Dashboard logic
    ├── shortener.js  → VP Link API
    └── screenlock.js → Screen-share/record block (owner/admin)
```

---

## 🚀 Abhi kaise chalega (bina database)

Bas `index.html` kholo browser me. Data **localStorage** me save hota hai
(matlab sirf usi browser/device me). Phone + PC dono se same account ke liye
neeche **Firebase** connect karo.

---

## 📡 Step 1 — GitHub pe Host (GitHub Pages)

1. GitHub pe **naya repository** banao (e.g. `uid-website`).
2. `UID WEBSITE` folder ki **saari files** repo me upload karo
   (index.html, login.html, admin.html, css/, js/ — sab).
3. Repo → **Settings → Pages** (left menu me) →
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / `/ (root)` → **Save**
4. ~1-2 min me link mil jayega:
   `https://YOUR-USERNAME.github.io/uid-website/`
5. Mobile browser me bhi yehi link kholo — same site, same code.

---

## 🔥 Step 2 — Database (Firebase) → Phone & PC same accounts

GitHub Pages sirf static files deta hai, isliye **accounts/UIDs database** ke
liye **Firebase Realtime Database** (free) connect karo:

1. [https://console.firebase.google.com](https://console.firebase.google.com)
   → **Add project** (naam: `uid-website`) → Create.
2. Left me **Build → Realtime Database → Create database** →
   start in **test mode** → Enable.
3. **Project Settings ⚙️ → General → Your apps → Web (`</>`)**
   → App nickname: `uid-web` → Register → dikhega:
   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     databaseURL: "https://uid-website-default-rtdb.firebaseio.com",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
4. Ye values **`js/config.js`** me bharo:
   ```js
   useFirebase: true,
   firebase: {
     apiKey: "API_KEY_YAHAN",
     authDomain: "YAHAN",
     databaseURL: "YAHAN",
     projectId: "YAHAN",
     storageBucket: "YAHAN",
     messagingSenderId: "YAHAN",
     appId: "YAHAN"
   }
   ```
5. **Rules** (Realtime Database → Rules tab):
   ```json
   {
     "rules": { ".read": true, ".write": true }
   }
   ```
   > ⚠️ Demo ke liye open hai. Baad me Firebase Auth + rules tighten karna
   > secure hai (niche note).
6. Git repo me updated files **push** karo (config.js wali changes).
7. **Bas!** Ab:
   - Phone pe `https://...github.io/uid-website/` kholo → owner `OXE/OXE` login
   - PC pe same login — **same accounts, same admins, same UIDs**
   - Owner ne phone pe admin banaya → PC pe bhi dikhega; online/offline stats bhi cross-device kaam karegi.

> **Pehla login:** Firebase pe naya data khali hota hai. Ek baar kisi bhi device
> se **Owner `OXE/OXE`** login karo — `OXE` account khud ban jata hai. Phir owner
> se admin/member create karo.

---

## 🔗 VP Link Shortener (member income)

`js/config.js` me:
```js
shortener: {
  enabled: true,
  apiKey: "3d22217f8c1b0d9faf78c89bccb1b35dd9ad3064",
  apiUrl: "https://YOUR-VPLINK-API/api",   // <-- VP Link dashboard ka API URL
  targetUrl: "https://YOUR-USERNAME.github.io/uid-website/unlock.html",
  format: "json"
}
```
Member ka 1st UID FREE, agle UID se pehle short link complete karna padta hai.

---

## 🔐 Security notes

- Passwords client-side me hain (GitHub Pages pe backend nahi). Isliye **owner/admin pass
  strong rakho** aur kabhi bhi site ke source me mat dikhao (config.js browser me visible hota hai).
- **Passcode** `637135` owner ke login ka second gate hai (`config.js` me change kar sakte ho).
- Screen-share/record block + right-click lock owner/admin dashboard pe active hai.
- Firebase test-mode rules sabko read/write dete hain — live launch se pehle
  **Firebase Auth (email/password)** laga kar Rules tight karo.

---

## 🛠️ Customize
- Site naam, owner, passcode: `js/config.js`
- Colors/animation: `css/style.css` (CSS variables top pe)
- Roles/permissions: `js/admin.js`
