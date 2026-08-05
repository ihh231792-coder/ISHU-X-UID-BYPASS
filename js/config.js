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

  // ---- FREE ACCOUNT GATE (YouTube Subscribe + Discord Join) ----
  // Normal user free account lene ke liye dono tasks poorne honge:
  // 1) YouTube channel subscribe, 2) Discord server join.
  // Tabhi auto user/pass generate hoga (ek browser = ek account, owner reset tak).
  taskGate: {
    enabled: true,
    // Discord REAL verification ka backend (backend/server.py deploy karke)
    // yahan apna public URL daalo. Placeholder rehne par verification on nahi hoga.
    backendUrl: "https://YOUR-BACKEND-URL",
    youtube: {
      channelName: "Ishu_yt7",
      url: "https://www.youtube.com/@Ishu_yt7?sub_confirmation=1",
      icon: "https://static.vecteezy.com/system/resources/previews/065/386/840/non_2x/youtube-icon-logo-yt-app-editable-transparent-background-premium-social-media-design-for-digital-download-free-png.png"
    },
    discord: {
      serverName: "ISHU X Discord",
      url: "https://discord.gg/hkp7XAmerS",
      icon: "https://freepnglogo.com/images/all_img/1708701266discord-logo-transparent.png"
    }
  },

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

  // ---- DATABASE (FIREBASE REALTIME DB) ----
  // Ye DB SAFE BY tool se bhi jude hai — UID add karne par wahi
  // users/<key>/uids format me bhi likha jata hai, taaki tool usse authorize kare.
  useFirebase: true,
  firebase: {
    apiKey: "AIzaSyC5idUrdGsoHldNJS1Pt5AGVmMglMXOlzA",
    authDomain: "ishu-uid.firebaseapp.com",
    databaseURL: "https://ishu-uid-default-rtdb.firebaseio.com",
    projectId: "ishu-uid",
    storageBucket: "ishu-uid.firebasestorage.app",
    messagingSenderId: "724245089190",
    appId: "1:724245089190:web:4bd8b21c5de22965eadd67",
    measurementId: "G-LY5WWRJ2WX"
  }
};

window.__CONFIG = CONFIG;