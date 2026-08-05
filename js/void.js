// ============================================================
// DOMAIN EXPANSION :: INFINITE VOID (GOJO STYLE) — canvas bg
//  • Particle network (spatial grid = fast)
//  • Hollow-Purple energy core (pulsing)
//  • Expanding shockwave rings
//  • Random energy streaks
//  • Mobile-optimized: fewer particles, capped 60fps
// ============================================================
(function () {
  const canvas = document.getElementById("void-canvas");
  if (!canvas) return;
  // MOBILE: canvas animation band — CPU/GPU bacha kar site 100% smooth.
  // Background ab static CSS gradient se aata hai (style.css me).
  if (window.innerWidth < 768) { canvas.style.display = "none"; return; }
  const ctx = canvas.getContext("2d");
  let W, H, parts = [], streaks = [], rings = [], core = { x: 0, y: 0, r: 40 };
  let mouse = { x: -9999, y: -9999 };
  let linkDist, grid = {}, last = 0;
  let coreGrad1 = null, coreGrad2 = null;

  const IS_MOBILE = window.innerWidth < 768;
  const PALETTE = ["#00e5ff", "#3aa0ff", "#7c4dff", "#ff5ad1", "#b026ff"];
  const RING_COLORS = ["rgba(0,229,255,", "rgba(124,77,255,", "rgba(255,90,209,"];
  const PARTS = IS_MOBILE ? 38 : Math.min(95, Math.floor(window.innerWidth / 12));

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    core.x = W / 2;
    core.y = H * 0.38;
    core.r = Math.min(W, H) * 0.045 + 24;
    linkDist = IS_MOBILE ? 90 : 130;
    // gradients ko cache karo — har frame naya banana mehenga hai
    coreGrad1 = ctx.createRadialGradient(core.x, core.y, core.r * 0.2, core.x, core.y, core.r * 2.8);
    coreGrad1.addColorStop(0, "rgba(178,38,255,0.55)");
    coreGrad1.addColorStop(0.4, "rgba(124,77,255,0.28)");
    coreGrad1.addColorStop(1, "rgba(0,229,255,0)");
    coreGrad2 = ctx.createRadialGradient(core.x - core.r * 0.3, core.y - core.r * 0.3, core.r * 0.1, core.x, core.y, core.r);
    coreGrad2.addColorStop(0, "rgba(255,255,255,0.95)");
    coreGrad2.addColorStop(0.35, "rgba(0,229,255,0.9)");
    coreGrad2.addColorStop(0.7, "rgba(60,80,255,0.85)");
    coreGrad2.addColorStop(1, "rgba(124,77,255,0.4)");
  }
  window.addEventListener("resize", () => { resize(); }, { passive: true });
  window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener("mouseout", () => { mouse.x = -9999; mouse.y = -9999; });

  function spawnParts(n) {
    parts = [];
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      parts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        r: 1 + Math.random() * 2.4,
        c: PALETTE[(Math.random() * PALETTE.length) | 0],
        a: 0.3 + Math.random() * 0.5,
        star: r < 0.12,
        tw: Math.random() * Math.PI * 2
      });
    }
  }

  function spawnRing() {
    rings.push({
      x: core.x, y: core.y,
      r: core.r,
      max: Math.max(W, H) * 0.62,
      a: 0.75,
      c: RING_COLORS[(Math.random() * RING_COLORS.length) | 0],
      w: 1.5 + Math.random() * 1.6
    });
  }
  setInterval(spawnRing, IS_MOBILE ? 3600 : 2600);

  function spawnStreak() {
    const ang = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 8;
    streaks.push({
      x: core.x + (Math.random() - 0.5) * core.r * 2,
      y: core.y + (Math.random() - 0.5) * core.r * 2,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      life: 1,
      c: PALETTE[(Math.random() * PALETTE.length) | 0]
    });
  }
  setInterval(() => { if (Math.random() < 0.65) spawnStreak(); }, IS_MOBILE ? 1800 : 1200);

  // ---------- draw core (cached gradients) ----------
  function drawCore(t) {
    const pulse = 1 + 0.09 * Math.sin(t * 0.002);
    const rr = core.r * pulse;
    ctx.fillStyle = coreGrad1;
    ctx.beginPath();
    ctx.arc(core.x, core.y, core.r * 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = coreGrad2;
    ctx.beginPath();
    ctx.arc(core.x, core.y, rr, 0, Math.PI * 2);
    ctx.fill();
    // spinning arcs (limitless swirl)
    ctx.save();
    ctx.translate(core.x, core.y);
    for (let i = 0; i < 3; i++) {
      ctx.rotate(t * 0.0006 + i * 2.1);
      ctx.strokeStyle = `rgba(0,229,255,${0.5 - i * 0.12})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, rr * (1.25 + i * 0.35), 0, Math.PI * (1.1 + i * 0.15));
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- spatial grid: O(n) link check ----------
  function buildGrid() {
    grid = {};
    const cs = linkDist;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const k = ((p.x / cs) | 0) + "," + ((p.y / cs) | 0);
      (grid[k] = grid[k] || []).push(i);
    }
  }

  function drawLinks() {
    const cs = linkDist;
    const max2 = cs * cs;
    for (let i = 0; i < parts.length; i++) {
      const a = parts[i];
      const kx = (a.x / cs) | 0, ky = (a.y / cs) | 0;
      for (let gx = kx - 1; gx <= kx + 1; gx++) {
        for (let gy = ky - 1; gy <= ky + 1; gy++) {
          const cell = grid[gx + "," + gy];
          if (!cell) continue;
          for (const j of cell) {
            if (j <= i) continue;
            const b = parts[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < max2) {
              ctx.strokeStyle = a.c;
              ctx.globalAlpha = (1 - Math.sqrt(d2) / cs) * 0.22;
              ctx.lineWidth = 0.6;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < 150) {
        a.x += ((a.x - mouse.x) / dm) * 1.2;
        a.y += ((a.y - mouse.y) / dm) * 1.2;
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------- main loop (60fps cap) ----------
  function step(now) {
    if (now - last < 16.6) { requestAnimationFrame(step); return; }
    last = now;
    const t = now;
    ctx.clearRect(0, 0, W, H);

    drawCore(t);

    // rings
    for (let i = rings.length - 1; i >= 0; i--) {
      const rn = rings[i];
      rn.r += 4.2;
      rn.a *= 0.975;
      if (rn.r > rn.max || rn.a < 0.03) { rings.splice(i, 1); continue; }
      ctx.strokeStyle = rn.c + rn.a + ")";
      ctx.lineWidth = rn.w;
      ctx.beginPath();
      ctx.arc(rn.x, rn.y, rn.r, 0, Math.PI * 2);
      ctx.stroke();
      if (!IS_MOBILE) {
        ctx.strokeStyle = rn.c + (rn.a * 0.35) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rn.x, rn.y, rn.r * 0.85, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // streaks (no gradient, cheap stroke)
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      s.x += s.vx; s.y += s.vy;
      s.life -= 0.02;
      if (s.life <= 0 || s.x < -40 || s.x > W + 40 || s.y < -40 || s.y > H + 40) { streaks.splice(i, 1); continue; }
      ctx.globalAlpha = s.life * 0.8;
      ctx.strokeStyle = s.c;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 7, s.y - s.vy * 7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // particles
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      const tw = p.star ? 0.5 + 0.5 * Math.sin(t * 0.003 + p.tw) : 1;
      ctx.globalAlpha = p.a * tw;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * tw, 0, Math.PI * 2);
      ctx.fill();
    }

    buildGrid();
    drawLinks();

    requestAnimationFrame(step);
  }

  resize();
  spawnParts(PARTS);
  spawnRing();
  requestAnimationFrame(step);
})();
