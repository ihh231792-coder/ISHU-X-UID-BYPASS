// ============================================================
// ISHU X UID BYPASS - CONFIG
// ============================================================

const CONFIG = {
  websiteName: "ISHU X UID BYPASS",
  ownerName: "ISHU_OXE",          // Owner ka display naam
  tagline: "INCURSION WITH THE UNLIMITED / DOMAIN EXPANSION",

  // ---- OWNER LOGIN (username : password) ----
  ownerUsername: "OXE",
  ownerPassword: "OXE",

  // Owner ke liye extra security passcode (creds ke baad)
  ownerPasscode: "637135",

  // Normal user ko block hone par ye message dikhega
  contactMessage: "Contact to Owner: ISHU_OXE",

  // Normal user ki UID sirf 24 hour ke liye valid hogi
  userUidDurationHours: 24,

  // ---- VP LINK SHORTENER (income ke liye) ----
  // Member ka 1st UID FREE hota hai. Uske baad next UID add karne se pehle
  // ek short link complete karna padta hai (isase owner ko income milti hai).
  // VP Link dashboard se API key nikal kar yahan daalo.
  shortener: {
    enabled: true,
    name: "VP Link",
    apiKey: "3d22217f8c1b0d9faf78c89bccb1b35dd9ad3064",
    apiUrl: "https://YOUR-VPLINK-API/api",                 // <-- VP Link dashboard se API URL yahan daalo
    targetUrl: "https://yourwebsite.github.io/unlock.html", // <-- deployed site ka unlock page
    format: "json"
  },

  // ---- DATABASE ----
  useFirebase: false,
  firebase: {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  }
};

window.__CONFIG = CONFIG;