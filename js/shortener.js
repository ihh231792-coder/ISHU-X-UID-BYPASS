// ============================================================
// VP LINK SHORTENER INTEGRATION (income / unlock gate)
// ============================================================
// VP Link API (dashboard se):
//   GET https://vplink.in/api?api=TOKEN&url=LONG_URL&alias=X&format=json
//   success -> { "status":"success", "shortenedUrl":"..." }
//   error   -> { "status":"error", "message":"..." }
// Flow:
//   1) build()  -> short link banata hai (shortenedUrl)
//   2) Member short link kholta hai, countdown/ads complete karta hai
//   3) VP Link member ko targetUrl (unlock.html) pe redirect karta hai
//   4) unlock.html localStorage me "vplink_done" flag set karta hai
//   5) verify() -> usi flag ko check karta hai => UNLOCK
// ============================================================

const Shortener = (function () {
  const CFG = window.__CONFIG;
  const DONE_KEY = "vplink_done";

  function cfg() { return CFG.shortener || null; }
  function isOn() {
    const s = cfg();
    return !!(s && s.enabled && s.apiKey && s.apiUrl && !/YOUR-VPLINK/i.test(s.apiUrl));
  }

  // Step 1: short link banao
  async function build() {
    const s = cfg();
    const api = s.apiUrl.replace(/\/$/, "");
    const params = new URLSearchParams({
      api: s.apiKey,
      url: s.targetUrl,
      format: "json"
    });
    const url = api + "?" + params.toString();
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.status === "error") {
      throw new Error(data.message || "VP Link error");
    }
    const visitor = (data && data.shortenedUrl) || (data && data.url) || url;
    // naya link -> pehle purana completion flag clear
    try { localStorage.removeItem(DONE_KEY); } catch (e) {}
    return { id: "", secret: "", visitor, raw: data };
  }

  // Step 2: complete hone par verify karo
  async function verify() {
    let ok = false;
    try { ok = localStorage.getItem(DONE_KEY) === "1"; } catch (e) {}
    return { ok, raw: { source: "local" } };
  }

  return { isOn, build, verify };
})();
