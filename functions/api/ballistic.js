const PI = Math.PI;
const STATUS = {
  Ok: 0,
  InvalidInput: 1,
  InitialResidualFailed: 2,
  JacobianFailed: 3,
  LMStepSingular: 4,
  ResidualFailedDuringSearch: 5,
  LineSearchRejected: 6,
  LambdaTriesExhausted: 7,
  MaxIterReached: 8,
};

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...init.headers,
    },
  });

const num = (value, fallback = NaN) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const v = (x = 0, y = 0, z = 0) => ({ x, y, z });
const add = (a, b) => v(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a, b) => v(a.x - b.x, a.y - b.y, a.z - b.z);
const mul = (s, a) => v(s * a.x, s * a.y, s * a.z);
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const norm = (a) => Math.hypot(a.x, a.y, a.z);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const radToDeg = (rad) => rad * 180 / PI;

const wrapPi = (angle) => {
  let out = (angle + PI) % (2 * PI);
  if (out < 0) out += 2 * PI;
  return out - PI;
};

const anglesToDir = (theta, phi) => {
  const ct = Math.cos(theta);
  return v(ct * Math.cos(phi), ct * Math.sin(phi), Math.sin(theta));
};

const vecToAngles = (r) => {
  const n = norm(r);
  if (n < 1e-12) return { theta: 0, phi: 0 };
  const d = mul(1 / n, r);
  return { theta: Math.asin(clamp(d.z, -1, 1)), phi: Math.atan2(d.y, d.x) };
};

const makeParams = (input) => {
  const preset = String(input.preset ?? "balanced").toLowerCase();
  const p = {
    g: num(input.gravity, 9.80665),
    wind: v(num(input.windX, 0), num(input.windY, 0), num(input.windZ, 0)),
    dt: num(input.dt, 0.01),
    tMax: num(input.maxTime, 20),
    tolMiss: num(input.tolMiss, 1e-2),
    beta: 1,
    maxIter: num(input.maxIter, 20),
    lambdaInit: 1e-6,
    lambdaMin: 1e-12,
    lambdaMax: 1e6,
    lambdaUpMul: 10,
    lambdaDownMul: 0.3,
    lambdaTries: 6,
    lineSearchTries: 10,
    alphaMin: 1e-4,
    thetaMin: -PI / 2,
    thetaMax: PI / 2,
    broydenMinDenom: 1e-12,
    missEps: 1e-12,
    fdScale: 1e-4,
    fdMin: 1e-6,
    fdMax: 1e-3,
    gsMaxIter: 20,
    gsTolAbs: 1e-8,
    gsTolRel: 1e-8,
  };

  if (preset === "fast" || preset === "0") {
    Object.assign(p, {
      dt: num(input.dt, 0.02),
      tolMiss: num(input.tolMiss, 5e-2),
      maxIter: num(input.maxIter, 12),
      lambdaTries: 4,
      lineSearchTries: 8,
      gsMaxIter: 12,
      gsTolAbs: 1e-7,
      gsTolRel: 1e-7,
    });
  } else if (preset === "precise" || preset === "2") {
    Object.assign(p, {
      dt: num(input.dt, 0.01),
      tolMiss: num(input.tolMiss, 1e-5),
      maxIter: num(input.maxIter, 80),
      lambdaTries: 10,
      lineSearchTries: 16,
      gsMaxIter: 40,
      gsTolAbs: 1e-10,
      gsTolRel: 1e-10,
      fdScale: 1e-5,
      fdMin: 1e-7,
      fdMax: 1e-4,
    });
  }

  return p;
};

const kDragFromPhysical = (input) => {
  if (input.kDrag !== undefined) return num(input.kDrag, 0);
  const rho = num(input.airDensity);
  const cd = num(input.dragCoefficient);
  const area = num(input.area);
  const mass = num(input.mass);
  if ([rho, cd, area, mass].every(Number.isFinite) && rho >= 0 && cd >= 0 && area >= 0 && mass > 0) {
    return 0.5 * rho * cd * area / mass;
  }
  return 0;
};

const readInput = (source) => ({
  relPos: v(num(source.px), num(source.py), num(source.pz)),
  relVel: v(num(source.vx, 0), num(source.vy, 0), num(source.vz, 0)),
  relAcc: v(num(source.ax, 0), num(source.ay, 0), num(source.az, 0)),
  speed: num(source.speed),
  kDrag: kDragFromPhysical(source),
  params: makeParams(source),
});

const validInput = (input) =>
  [input.relPos.x, input.relPos.y, input.relPos.z, input.relVel.x, input.relVel.y, input.relVel.z,
    input.relAcc.x, input.relAcc.y, input.relAcc.z, input.speed, input.kDrag,
    input.params.g, input.params.dt, input.params.tMax, input.params.tolMiss, input.params.maxIter]
    .every(Number.isFinite) &&
  input.speed > 0 &&
  input.kDrag >= 0 &&
  input.params.g > 0 &&
  input.params.dt > 0 &&
  input.params.tMax > 0 &&
  input.params.tolMiss > 0 &&
  input.params.maxIter > 0;

const deriv = (state, kDrag, p) => {
  const relAir = sub(state.vel, p.wind);
  const speed = norm(relAir);
  let acc = v(0, 0, -p.g);
  if (speed > 1e-12 && kDrag !== 0) {
    acc = sub(acc, mul(kDrag * speed, relAir));
  }
  return { pos: state.vel, vel: acc };
};

const rk4Step = (state, h, kDrag, p) => {
  const k1 = deriv(state, kDrag, p);
  const s2 = { pos: add(state.pos, mul(0.5 * h, k1.pos)), vel: add(state.vel, mul(0.5 * h, k1.vel)) };
  const k2 = deriv(s2, kDrag, p);
  const s3 = { pos: add(state.pos, mul(0.5 * h, k2.pos)), vel: add(state.vel, mul(0.5 * h, k2.vel)) };
  const k3 = deriv(s3, kDrag, p);
  const s4 = { pos: add(state.pos, mul(h, k3.pos)), vel: add(state.vel, mul(h, k3.vel)) };
  const k4 = deriv(s4, kDrag, p);

  return {
    pos: add(state.pos, mul(h / 6, add(add(k1.pos, mul(2, k2.pos)), add(mul(2, k3.pos), k4.pos)))),
    vel: add(state.vel, mul(h / 6, add(add(k1.vel, mul(2, k2.vel)), add(mul(2, k3.vel), k4.vel)))),
  };
};

const targetPos = (input, t) =>
  add(add(input.relPos, mul(t, input.relVel)), mul(0.5 * t * t, input.relAcc));

const targetVel = (input, t) => add(input.relVel, mul(t, input.relAcc));

const relVec = (projPos, input, t) => sub(projPos, targetPos(input, t));

const goldenSectionMin = (fn, dt, p) => {
  const invPhi = 0.6180339887498948;
  const invPhi2 = 0.3819660112501051;
  let a = 0;
  let b = dt;
  let x1 = a + invPhi2 * (b - a);
  let x2 = a + invPhi * (b - a);
  let f1 = fn(x1);
  let f2 = fn(x2);
  const tol = Math.max(p.gsTolAbs, p.gsTolRel * dt);

  for (let i = 0; i < p.gsMaxIter && b - a > tol; i += 1) {
    if (f2 < f1) {
      a = x1;
      x1 = x2;
      f1 = f2;
      x2 = a + invPhi * (b - a);
      f2 = fn(x2);
    } else {
      b = x2;
      x2 = x1;
      f2 = f1;
      x1 = a + invPhi2 * (b - a);
      f1 = fn(x1);
    }
  }

  return clamp(f1 <= f2 ? x1 : x2, 0, dt);
};

const findClosestApproach = (projVel0, input, arcMode) => {
  const p = input.params;
  let prev = { pos: v(), vel: projVel0 };
  let tPrev = 0;
  const rel0 = relVec(prev.pos, input, 0);
  let qPrev = dot(rel0, sub(prev.vel, targetVel(input, 0)));

  while (tPrev < p.tMax) {
    const h = Math.min(p.dt, p.tMax - tPrev);
    const curr = rk4Step(prev, h, input.kDrag, p);
    const tCurr = tPrev + h;
    const relCurr = relVec(curr.pos, input, tCurr);
    const qCurr = dot(relCurr, sub(curr.vel, targetVel(input, tCurr)));
    const allowCheck = arcMode === "low" || curr.vel.z <= 0;

    if (allowCheck && qPrev <= 0 && qCurr >= 0) {
      const tauStar = goldenSectionMin((tau) => {
        const st = tau > 1e-15 ? rk4Step(prev, tau, input.kDrag, p) : prev;
        return dot(relVec(st.pos, input, tPrev + tau), relVec(st.pos, input, tPrev + tau));
      }, h, p);
      const stStar = tauStar > 1e-15 ? rk4Step(prev, tauStar, input.kDrag, p) : prev;
      const tStar = tPrev + tauStar;
      return { tStar, relMiss: relVec(stStar.pos, input, tStar) };
    }

    prev = curr;
    tPrev = tCurr;
    qPrev = qCurr;
  }

  return { tStar: tPrev, relMiss: relVec(prev.pos, input, tPrev) };
};

const vacuumArcAnglesToPoint = (point, speed, arcMode, g) => {
  const rxy = Math.hypot(point.x, point.y);
  const phi = Math.atan2(point.y, point.x);
  if (rxy < 1e-12) return { ok: true, theta: (point.z >= 0 ? 1 : -1) * PI / 4, phi };

  const v2 = speed * speed;
  const disc = v2 * v2 - g * (g * rxy * rxy + 2 * point.z * v2);
  if (disc < 0) return { ok: false, theta: Math.atan2(point.z, rxy), phi };

  const root = Math.sqrt(disc);
  const tanTheta = (arcMode === "high" ? v2 + root : v2 - root) / (g * rxy);
  const theta = Math.atan(tanTheta);
  return Number.isFinite(theta) ? { ok: true, theta, phi } : { ok: false, theta: Math.atan2(point.z, rxy), phi };
};

const initialGuess = (input, arcMode) => {
  const t0 = norm(input.relPos) / Math.max(input.speed, 1e-6);
  const aim = targetPos(input, t0);
  return vacuumArcAnglesToPoint(aim, input.speed, arcMode, input.params.g);
};

const computeResidual = (theta, phi, input, arcMode) => {
  const dir = anglesToDir(theta, phi);
  const closest = findClosestApproach(mul(input.speed, dir), input, arcMode);
  const miss = norm(closest.relMiss);
  const aim = targetPos(input, closest.tStar);
  const aimCorr = sub(aim, mul(input.params.beta, closest.relMiss));
  let a0 = vacuumArcAnglesToPoint(aim, input.speed, arcMode, input.params.g);
  let a1 = vacuumArcAnglesToPoint(aimCorr, input.speed, arcMode, input.params.g);

  if (!a0.ok || !a1.ok) {
    a0 = vecToAngles(aim);
    a1 = vecToAngles(aimCorr);
  }

  const residual = [a1.theta - a0.theta, wrapPi(a1.phi - a0.phi)];
  if (![residual[0], residual[1], miss].every(Number.isFinite)) return null;
  return { residual, miss, relMiss: closest.relMiss, tStar: closest.tStar };
};

const solveLmStep = (jac, residual, lambda) => {
  const a00 = jac[0][0] * jac[0][0] + jac[1][0] * jac[1][0] + lambda;
  const a01 = jac[0][0] * jac[0][1] + jac[1][0] * jac[1][1];
  const a11 = jac[0][1] * jac[0][1] + jac[1][1] * jac[1][1] + lambda;
  const b0 = -(jac[0][0] * residual[0] + jac[1][0] * residual[1]);
  const b1 = -(jac[0][1] * residual[0] + jac[1][1] * residual[1]);
  const det = a00 * a11 - a01 * a01;
  if (Math.abs(det) < 1e-18) return null;
  const dtheta = (b0 * a11 - b1 * a01) / det;
  const dphi = (a00 * b1 - a01 * b0) / det;
  return [dtheta, dphi].every(Number.isFinite) ? { dtheta, dphi } : null;
};

const pickFdStep = (x, p) => clamp(p.fdScale * (1 + Math.abs(x)), p.fdMin, p.fdMax);

const jacobianFd = (theta, phi, baseResidual, input, arcMode) => {
  const p = input.params;
  const j = [[NaN, NaN], [NaN, NaN]];
  const hTheta = pickFdStep(theta, p);
  const canMinus = theta - hTheta >= p.thetaMin;
  const canPlus = theta + hTheta <= p.thetaMax;

  if (canMinus && canPlus) {
    const plus = computeResidual(theta + hTheta, phi, input, arcMode);
    const minus = computeResidual(theta - hTheta, phi, input, arcMode);
    if (!plus || !minus) return null;
    j[0][0] = (plus.residual[0] - minus.residual[0]) / (2 * hTheta);
    j[1][0] = wrapPi(plus.residual[1] - minus.residual[1]) / (2 * hTheta);
  } else if (canPlus) {
    const plus = computeResidual(theta + hTheta, phi, input, arcMode);
    if (!plus) return null;
    j[0][0] = (plus.residual[0] - baseResidual[0]) / hTheta;
    j[1][0] = wrapPi(plus.residual[1] - baseResidual[1]) / hTheta;
  } else if (canMinus) {
    const minus = computeResidual(theta - hTheta, phi, input, arcMode);
    if (!minus) return null;
    j[0][0] = (baseResidual[0] - minus.residual[0]) / hTheta;
    j[1][0] = wrapPi(baseResidual[1] - minus.residual[1]) / hTheta;
  } else {
    return null;
  }

  const hPhi = pickFdStep(phi, p);
  const plus = computeResidual(theta, wrapPi(phi + hPhi), input, arcMode);
  const minus = computeResidual(theta, wrapPi(phi - hPhi), input, arcMode);
  if (!plus || !minus) return null;
  j[0][1] = (plus.residual[0] - minus.residual[0]) / (2 * hPhi);
  j[1][1] = wrapPi(plus.residual[1] - minus.residual[1]) / (2 * hPhi);

  return j.flat().every(Number.isFinite) ? j : null;
};

const updateJacobianBroyden = (jac, step, y, p) => {
  const denom = step[0] * step[0] + step[1] * step[1];
  if (denom <= p.broydenMinDenom) return jac;
  const js0 = jac[0][0] * step[0] + jac[0][1] * step[1];
  const js1 = jac[1][0] * step[0] + jac[1][1] * step[1];
  const u0 = (y[0] - js0) / denom;
  const u1 = (y[1] - js1) / denom;
  return [
    [jac[0][0] + u0 * step[0], jac[0][1] + u0 * step[1]],
    [jac[1][0] + u1 * step[0], jac[1][1] + u1 * step[1]],
  ];
};

const solveArc = (input, arcMode) => {
  const p = input.params;
  if (!validInput(input) || p.thetaMin >= p.thetaMax) {
    return { arc: arcMode, success: false, status: STATUS.InvalidInput, message: "InvalidInput" };
  }

  const guess = initialGuess(input, arcMode);
  let theta = clamp(guess.theta, p.thetaMin, p.thetaMax);
  let phi = wrapPi(guess.phi);
  let current = computeResidual(theta, phi, input, arcMode);
  if (!current) return { arc: arcMode, success: false, status: STATUS.InitialResidualFailed, message: "InitialResidualFailed", theta, phi };

  let best = { theta, phi, ...current };
  let jac = jacobianFd(theta, phi, current.residual, input, arcMode);
  if (!jac) return { arc: arcMode, success: false, status: STATUS.JacobianFailed, message: "JacobianFailed", theta, phi, miss: current.miss, tStar: current.tStar };

  let lambda = clamp(p.lambdaInit, p.lambdaMin, p.lambdaMax);
  let status = STATUS.MaxIterReached;
  let message = "MaxIterReached";
  let iterations = 0;
  let acceptedSteps = 0;

  for (let it = 0; it < p.maxIter; it += 1) {
    iterations = it + 1;
    if (current.miss <= p.tolMiss) {
      status = STATUS.Ok;
      message = "Ok";
      break;
    }

    let accepted = false;
    for (let lt = 0; lt < p.lambdaTries; lt += 1) {
      const step = solveLmStep(jac, current.residual, lambda);
      if (!step) {
        status = STATUS.LMStepSingular;
        message = "LMStepSingular";
        break;
      }

      let alpha = 1;
      let bestTrial = null;
      for (let ls = 0; ls < p.lineSearchTries && alpha >= p.alphaMin; ls += 1) {
        const trialTheta = clamp(theta + alpha * step.dtheta, p.thetaMin, p.thetaMax);
        const trialPhi = wrapPi(phi + alpha * step.dphi);
        const trial = computeResidual(trialTheta, trialPhi, input, arcMode);
        if (trial && (!bestTrial || trial.miss < bestTrial.miss)) {
          bestTrial = { theta: trialTheta, phi: trialPhi, ...trial };
        }
        if (trial && trial.miss <= current.miss + p.missEps) break;
        alpha *= 0.5;
      }

      if (!bestTrial || bestTrial.miss >= current.miss) {
        lambda = clamp(lambda * p.lambdaUpMul, p.lambdaMin, p.lambdaMax);
        continue;
      }

      const old = current;
      const oldTheta = theta;
      const oldPhi = phi;
      theta = bestTrial.theta;
      phi = bestTrial.phi;
      current = bestTrial;
      accepted = true;
      acceptedSteps += 1;
      if (current.miss < best.miss) best = { theta, phi, ...current };
      if (current.miss < old.miss - p.missEps) lambda = clamp(lambda * p.lambdaDownMul, p.lambdaMin, p.lambdaMax);

      jac = updateJacobianBroyden(
        jac,
        [theta - oldTheta, wrapPi(phi - oldPhi)],
        [current.residual[0] - old.residual[0], wrapPi(current.residual[1] - old.residual[1])],
        p,
      );
      break;
    }

    if (status === STATUS.LMStepSingular) break;
    if (!accepted) {
      status = STATUS.LambdaTriesExhausted;
      message = "LambdaTriesExhausted";
      break;
    }
  }

  const success = best.miss <= p.tolMiss;
  if (success) {
    status = STATUS.Ok;
    message = "Ok";
  }

  return {
    arc: arcMode,
    success,
    status,
    message,
    theta: best.theta,
    phi: best.phi,
    pitch_deg: radToDeg(best.theta),
    yaw_deg: radToDeg(best.phi),
    miss: best.miss,
    tStar: best.tStar,
    relMissAtStar: best.relMiss,
    iterations,
    acceptedSteps,
    muzzle_velocity: mul(input.speed, anglesToDir(best.theta, best.phi)),
  };
};

const solve = (input) => {
  const low = solveArc(input, "low");
  const high = solveArc(input, "high");
  return {
    ok: true,
    model: "ballistic_solver_rk4_drag_wind_lm",
    units: { position: "m", velocity: "m/s", acceleration: "m/s^2", angle: "rad and deg", time: "s" },
    input: {
      relPos: input.relPos,
      relVel: input.relVel,
      relAcc: input.relAcc,
      speed: input.speed,
      kDrag: input.kDrag,
      gravity: input.params.g,
      wind: input.params.wind,
      dt: input.params.dt,
      maxTime: input.params.tMax,
      tolMiss: input.params.tolMiss,
      maxIter: input.params.maxIter,
    },
    reachable: low.success || high.success,
    solutions: [low, high],
  };
};

export function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request }) {
  const input = readInput(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!validInput(input)) {
    return json({ ok: false, error: "Invalid input. Required: px, py, pz, speed. Optional: vx, vy, vz, ax, ay, az, kDrag, gravity, windX, windY, windZ, dt, maxTime, tolMiss, maxIter, preset." }, { status: 400 });
  }
  return json(solve(input));
}

export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const input = readInput(body);
  if (!validInput(input)) {
    return json({ ok: false, error: "Invalid input. Required: px, py, pz, speed. Optional: vx, vy, vz, ax, ay, az, kDrag, gravity, windX, windY, windZ, dt, maxTime, tolMiss, maxIter, preset." }, { status: 400 });
  }
  return json(solve(input));
}
