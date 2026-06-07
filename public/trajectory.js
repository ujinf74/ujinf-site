/* Re-integrates the ballistic trajectory in the browser using the same RK4 +
   quadratic-drag + wind model as functions/api/ballistic.js, then draws the
   low/high arcs and the target marker. Listens for solver:result from solver.js. */
(function () {
  const canvas = document.getElementById("traj-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let last = null;

  /* ---- physics (mirrors ballistic.js deriv) ------------------------- */
  function deriv(st, kDrag, g, wind) {
    const ax0 = st.v.x - wind.x,
      ay0 = st.v.y - wind.y,
      az0 = st.v.z - wind.z;
    const sp = Math.hypot(ax0, ay0, az0);
    return {
      dp: { x: st.v.x, y: st.v.y, z: st.v.z },
      dv: {
        x: -kDrag * sp * ax0,
        y: -kDrag * sp * ay0,
        z: -g - kDrag * sp * az0,
      },
    };
  }
  function advance(st, k, h) {
    return {
      p: { x: st.p.x + k.dp.x * h, y: st.p.y + k.dp.y * h, z: st.p.z + k.dp.z * h },
      v: { x: st.v.x + k.dv.x * h, y: st.v.y + k.dv.y * h, z: st.v.z + k.dv.z * h },
    };
  }
  function rk4(st, dt, kDrag, g, wind) {
    const k1 = deriv(st, kDrag, g, wind);
    const k2 = deriv(advance(st, k1, dt / 2), kDrag, g, wind);
    const k3 = deriv(advance(st, k2, dt / 2), kDrag, g, wind);
    const k4 = deriv(advance(st, k3, dt), kDrag, g, wind);
    const c = (a, b, cc, d) => (a + 2 * b + 2 * cc + d) / 6;
    return {
      p: {
        x: st.p.x + dt * c(k1.dp.x, k2.dp.x, k3.dp.x, k4.dp.x),
        y: st.p.y + dt * c(k1.dp.y, k2.dp.y, k3.dp.y, k4.dp.y),
        z: st.p.z + dt * c(k1.dp.z, k2.dp.z, k3.dp.z, k4.dp.z),
      },
      v: {
        x: st.v.x + dt * c(k1.dv.x, k2.dv.x, k3.dv.x, k4.dv.x),
        y: st.v.y + dt * c(k1.dv.y, k2.dv.y, k3.dv.y, k4.dv.y),
        z: st.v.z + dt * c(k1.dv.z, k2.dv.z, k3.dv.z, k4.dv.z),
      },
    };
  }
  function integrate(muzzle, input, tEnd) {
    const g = input.gravity,
      kDrag = input.kDrag || 0,
      dt = input.dt || 0.01;
    const wind = { x: input.windX || 0, y: input.windY || 0, z: input.windZ || 0 };
    let st = { p: { x: 0, y: 0, z: 0 }, v: { x: muzzle.x, y: muzzle.y, z: muzzle.z } };
    const pts = [{ r: 0, h: 0 }];
    const steps = Math.min(20000, Math.ceil(tEnd / dt) + 2);
    for (let i = 0; i < steps; i++) {
      st = rk4(st, dt, kDrag, g, wind);
      pts.push({ r: Math.hypot(st.p.x, st.p.y), h: st.p.z });
      if (st.p.z < -2 && i > 2) break;
    }
    return pts;
  }

  /* ---- render ------------------------------------------------------- */
  function render(detail) {
    last = detail;
    const { input, solutions } = detail;
    const css = getComputedStyle(document.documentElement);
    const colLow = (css.getPropertyValue("--accent") || "#4f7dff").trim();
    const colHigh = (css.getPropertyValue("--accent-3") || "#d55cff").trim();
    const colMuted = (css.getPropertyValue("--muted") || "#8893c0").trim();
    const colLine = (css.getPropertyValue("--border-soft") || "rgba(120,140,255,.2)").trim();

    const arcs = [];
    (solutions || []).forEach((s) => {
      if (!s || !s.muzzle_velocity) return;
      const tEnd = s.tStar && s.tStar > 0 ? s.tStar : input.maxTime || 30;
      arcs.push({
        pts: integrate(s.muzzle_velocity, input, tEnd),
        color: s.arc === "high" ? colHigh : colLow,
        ok: s.success,
      });
    });

    // target at each arc's tStar (use first reachable solution's tStar)
    const tHit = (solutions || []).find((s) => s && s.success);
    let target = null;
    if (tHit) {
      const t = tHit.tStar;
      const tx = input.px + t * input.vx,
        ty = input.py + t * input.vy,
        tz = input.pz + t * input.vz;
      target = { r: Math.hypot(tx, ty), h: tz };
    }

    // bounds
    let maxR = 1,
      minH = 0,
      maxH = 1;
    const scan = (p) => {
      if (p.r > maxR) maxR = p.r;
      if (p.h > maxH) maxH = p.h;
      if (p.h < minH) minH = p.h;
    };
    arcs.forEach((a) => a.pts.forEach(scan));
    if (target) scan(target);

    // canvas sizing
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 600;
    const cssH = Math.round(cssW * 0.46);
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const padL = 38,
      padR = 14,
      padT = 14,
      padB = 26;
    const plotW = cssW - padL - padR,
      plotH = cssH - padT - padB;
    const rangeH = maxH - minH || 1;
    const X = (r) => padL + (r / maxR) * plotW;
    const Y = (h) => padT + (1 - (h - minH) / rangeH) * plotH;

    // grid + ground (h=0)
    ctx.strokeStyle = colLine;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(padL, Y(0));
    ctx.lineTo(cssW - padR, Y(0));
    ctx.stroke();
    ctx.globalAlpha = 0.25;
    for (let k = 1; k <= 3; k++) {
      const gx = padL + (plotW * k) / 4;
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, padT + plotH);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // axis labels
    ctx.fillStyle = colMuted;
    ctx.font = "11px monospace";
    ctx.fillText("height (m)", 4, padT + 4);
    ctx.fillText("range " + maxR.toFixed(0) + " m", cssW - padR - 78, padT + plotH + 18);

    // arcs
    arcs.forEach((a) => {
      ctx.strokeStyle = a.color;
      ctx.globalAlpha = a.ok ? 0.95 : 0.35;
      ctx.setLineDash(a.ok ? [] : [4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      a.pts.forEach((p, i) => {
        const x = X(p.r),
          y = Y(p.h);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // origin
    ctx.fillStyle = colMuted;
    ctx.beginPath();
    ctx.arc(X(0), Y(0), 3, 0, 7);
    ctx.fill();

    // target marker
    if (target) {
      const tx = X(target.r),
        ty = Y(target.h);
      ctx.strokeStyle = colMuted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx - 9, ty);
      ctx.lineTo(tx + 9, ty);
      ctx.moveTo(tx, ty - 9);
      ctx.lineTo(tx, ty + 9);
      ctx.stroke();
    }
  }

  window.addEventListener("solver:result", (e) => render(e.detail));
  window.addEventListener("theme:change", () => {
    if (last) render(last);
  });
  window.addEventListener("resize", () => {
    if (last) render(last);
  });
})();
