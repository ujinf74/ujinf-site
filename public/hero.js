/* Home hero: mouse-reactive particle/star canvas + typewriter tagline.
   Colors are read from CSS variables so they follow the theme. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- typewriter --------------------------------------------------- */
  const typed = document.getElementById("hero-typed");
  if (typed) {
    const curLang = () => document.documentElement.getAttribute("data-lang") || "en";
    const fullText = () =>
      typed.getAttribute("data-type-" + curLang()) ||
      typed.getAttribute("data-type-en") ||
      "";
    let timer;
    function type() {
      clearTimeout(timer);
      const full = fullText();
      if (reduce) {
        typed.textContent = full;
        return;
      }
      typed.textContent = "";
      let i = 0;
      (function step() {
        typed.textContent = full.slice(0, i);
        if (i <= full.length) {
          i++;
          timer = setTimeout(step, 40);
        }
      })();
    }
    type();
    window.addEventListener("lang:change", type);
  }

  /* ---- particle field ----------------------------------------------- */
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W = 0,
    H = 0,
    dpr = 1,
    particles = [],
    raf = null,
    accent = "#4f7dff",
    accent3 = "#d55cff";
  const mouse = { x: -9999, y: -9999 };

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    accent = (cs.getPropertyValue("--accent") || "#4f7dff").trim();
    accent3 = (cs.getPropertyValue("--accent-3") || "#d55cff").trim();
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width || 600;
    H = r.height || 360;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function initParticles() {
    const n = Math.max(28, Math.min(90, Math.floor((W * H) / 13000)));
    particles = [];
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
      });
    }
  }
  function drawDots() {
    for (const p of particles) {
      ctx.fillStyle = p.r > 1.4 ? accent3 : accent;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      const dx = mouse.x - p.x,
        dy = mouse.y - p.y,
        d2 = dx * dx + dy * dy;
      if (d2 < 14000) {
        const f = (1 - d2 / 14000) * 0.05;
        const inv = 1 / Math.sqrt(d2 + 1);
        p.vx += dx * inv * f;
        p.vy += dy * inv * f;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.vy *= 0.99;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x));
      p.y = Math.max(0, Math.min(H, p.y));
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i],
          b = particles[j];
        const dx = a.x - b.x,
          dy = a.y - b.y,
          d2 = dx * dx + dy * dy;
        if (d2 < 9000) {
          ctx.globalAlpha = (1 - d2 / 9000) * 0.22;
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    drawDots();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf && !reduce) raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }
  function staticDraw() {
    ctx.clearRect(0, 0, W, H);
    drawDots();
  }

  readColors();
  resize();
  initParticles();
  if (reduce) staticDraw();
  else start();

  window.addEventListener("resize", () => {
    resize();
    initParticles();
    if (reduce) staticDraw();
  });
  const host = canvas.parentElement;
  host.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  host.addEventListener("pointerleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });
  window.addEventListener("theme:change", () => {
    readColors();
    if (reduce) staticDraw();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
})();
