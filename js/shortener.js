// ============================================================
// VP LINK SHORTENER INTEGRATION (income / unlock gate)
// ============================================================
// Generic flow (common VP-Link / ODPVC style):
//   1) build()  ->  POST include api -> { id, url(visitor link), secret_key }
//   2) Member completes the visitor link (countdown/timer).
//   3) verify() ->  call getUrl with secret_key -> { status: "success" }
// Agar aapki VP Link ki fields alag hain to build()/verify() adjust karo
// ya mujhe dashboard ka API URL/fields batao.
// ============================================================

const Shortener = (function () {
  const CFG = window.__CONFIG;
  function cfg() { return CFG.shortener || null; }
  function isOn() { const s = cfg(); return !!(s && s.enabled); }

  // Step 1: short link banao
  async function build() {
    const s = cfg();
    const api = s.apiUrl.replace(/\/$/, "");
    const params = new URLSearchParams({
      api: s.apiKey,
      url: s.targetUrl,
      format: s.format || "json"
    });
    const data = await (await fetch(api + "?" + params.toString())).json();
    return {
      id: data.id,
      secret: data.secret_key || data.secret || "",
      visitor: data.url || (api + "?" + params.toString()),
      raw: data
    };
  }

  // Step 2: complete hone par verify karo
  async function verify(id, secret) {
    const s = cfg();
    const api = s.apiUrl.replace(/\/$/, "");
    const params = new URLSearchParams({
      api: s.apiKey,
      url: s.targetUrl,
      secret: secret || "",
      action: "getUrl",
      format: s.format || "json"
    });
    const data = await (await fetch(api + "?" + params.toString())).json();
    const ok = /success|ok|done|finished|active/i.test(data.status || "");
    return { ok, raw: data };
  }

  return { isOn, build, verify };
})();