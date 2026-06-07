const solverForm = document.querySelector("#solver-form");

const setSolution = (prefix, solution) => {
  const pitch = document.querySelector(`#${prefix}-pitch`);
  const detail = document.querySelector(`#${prefix}-detail`);

  if (!pitch || !detail) return;
  if (!solution) {
    pitch.textContent = "-";
    detail.textContent = "no solution";
    return;
  }

  const state = solution.success ? "hit" : solution.message;
  pitch.textContent = `${solution.pitch_deg.toFixed(3)} deg`;
  detail.textContent = `yaw ${solution.yaw_deg.toFixed(3)} deg / t ${solution.tStar.toFixed(4)} s / miss ${solution.miss.toExponential(3)} m / ${state}`;
};

const readSolverInputs = () => {
  if (!solverForm) return;

  const values = Object.fromEntries(new FormData(solverForm).entries());
  const number = (name) => Number(values[name]);

  return {
    px: number("px"),
    py: number("py"),
    pz: number("pz"),
    vx: number("vx"),
    vy: number("vy"),
    vz: number("vz"),
    speed: number("speed"),
    kDrag: number("kDrag"),
    gravity: number("gravity"),
    windX: number("windX"),
    windY: number("windY"),
    windZ: number("windZ"),
    preset: values.preset || "balanced",
    dt: number("dt"),
    maxTime: number("maxTime"),
    tolMiss: number("tolMiss"),
    maxIter: number("maxIter"),
  };
};

const validSolverInputs = (input) =>
  input &&
  Object.entries(input).every(([key, value]) => key === "preset" || Number.isFinite(value)) &&
  input.speed > 0 &&
  input.kDrag >= 0 &&
  input.gravity > 0 &&
  input.dt > 0 &&
  input.maxTime > 0 &&
  input.tolMiss > 0 &&
  input.maxIter > 0;

const updateSolver = async () => {
  if (!solverForm) return;

  const status = document.querySelector("#solver-status");
  const input = readSolverInputs();

  if (!validSolverInputs(input)) {
    setSolution("low", null);
    setSolution("high", null);
    if (status) status.textContent = "Check the input values.";
    return;
  }

  const started = performance.now();
  try {
    const response = await fetch("/api/ballistic", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);

    const low = data.solutions.find((solution) => solution.arc === "low");
    const high = data.solutions.find((solution) => solution.arc === "high");
    const elapsed = performance.now() - started;

    setSolution("low", low);
    setSolution("high", high);
    window.dispatchEvent(
      new CustomEvent("solver:result", { detail: { input, solutions: data.solutions } })
    );
    if (status) {
      status.textContent = data.reachable
        ? `HTTP API / ${elapsed.toFixed(3)} ms / ${data.model}`
        : `HTTP API / ${elapsed.toFixed(3)} ms / no reachable solution`;
    }
  } catch (error) {
    setSolution("low", null);
    setSolution("high", null);
    if (status) status.textContent = error.message || "API request failed";
  }
};

solverForm?.addEventListener("input", updateSolver);
updateSolver();
