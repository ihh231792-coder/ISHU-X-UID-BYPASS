// ============================================================
// DOMAIN EXPANSION :: INFINITE VOID (GOJO STYLE) — canvas bg
//  • Particle network
//  • Hollow-Purple energy core (pulsing)
//  • Expanding shockwave rings
//  • Random energy streaks
// ============================================================
(function () {
  const canvas = document.getElementById("void-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, parts = [], streaks = [], rings = [], core = { x: 0, y: 0, r: 40 };
  let mouse = { x: -9999, y: -9999 };

  const PALETTE = ["#00e5ff", "#3aa0ff", "#7c4dff", "#ff5ad1", "#b026ff"];
  const RING_COLORS = ["rgba(0,229,255,", "rgba(124,77,255,", "rgba(255,90,209,"];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    core.x = W / 2;
    core.y = H * 0.38;          // hero eye ke peeche
    core.r = Math.min(W, H) * 0.045 + 24;
  }
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener("mouseout", () => { mouse.x = -9999; mouse.y = -9999; });

  function spawnParts(n) {
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
  setInterval(spawnRing, 2600);

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
  setInterval(() => { if (Math.random() < 0.65) spawnStreak(); }, 1200);

  // ---------- draw core (hollow purple orb) ----------
  function drawCore(t) {
    const pulse = 1 + 0.09 * Math.sin(t * 0.002);
    const rr = core.r * pulse;
    // outer glow
    const g = ctx.createRadialGradient(core.x, core.y, rr * 0.2, core.x, core.y, rr * 2.8);
    g.addColorStop(0, "rgba(178,38,255,0.55)");
    g.addColorStop(0.4, "rgba(124,77,255,0.28)");
    g.addColorStop(1, "rgba(0,229,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(core.x, core.y, rr * 2.8, 0, Math.PI * 2);
    ctx.fill();
    // inner disc
    const g2 = ctx.createRadialGradient(core.x - rr * 0.3, core.y - rr * 0.3, rr * 0.1, core.x, core.y, rr);
    g2.addColorStop(0, "rgba(255,255,255,0.95)");
    g2.addColorStop(0.35, "rgba(0,229,255,0.9)");
    g2.addColorStop(0.7, "rgba(60,80,255,0.85)");
    g2.addColorStop(1, "rgba(124,77,255,0.4)");
    ctx.fillStyle = g2;
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

  // ---------- main loop ----------
  function step() {
    const t = performance.now();
    ctx.clearRect(0, 0, W, H);

    drawCore(t);

    // rings (shockwaves)
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
      // double ring faint
      ctx.strokeStyle = rn.c + (rn.a * 0.35) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rn.x, rn.y, rn.r * 0.85, 0, Math.PI * 2);
      ctx.stroke();
    }

    // streaks
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      s.x += s.vx; s.y += s.vy;
      s.life -= 0.02;
      if (s.life <= 0 || s.x < -40 || s.x > W + 40 || s.y < -40 || s.y > H + 40) { streaks.splice(i, 1); continue; }
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 7, s.y - s.vy * 7);
      grad.addColorStop(0, s.c);
      grad.addColorStop(1, "transparent");
      ctx.strokeStyle = grad;
      ctx.globalAlpha = s.life * 0.8;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 7, s.y - s.vy * 7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // particles + network
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

    // links
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < parts.length; i++) {
      const a = parts[i];
      for (let j = i + 1; j < parts.length; j++) {
        const b = parts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 130 * 130) {
          ctx.strokeStyle = a.c;
          ctx.globalAlpha = (1 - Math.sqrt(d2) / 130) * 0.22;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < 150) {
        a.x += ((a.x - mouse.x) / dm) * 1.2;
        a.y += ((a.y - mouse.y) / dm) * 1.2;
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(step);
  }

  resize();
  spawnParts(Math.min(95, Math.floor(window.innerWidth / 12)));
  spawnRing();
  step();
})();