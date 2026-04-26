const fallbackEntries = [
  {
    id: 1,
    kind: "project",
    title: "ballistic-solver",
    body: "moving target을 gravity, quadratic drag, optional wind 조건에서 맞히기 위한 simulate-first intercept optimizer. RK4와 Levenberg-Marquardt 기반.",
    created_at: "2026-04-26T00:00:00Z",
  },
  {
    id: 2,
    kind: "project",
    title: "Mapless Autonomous Parking",
    body: "online occupancy mapping, occupancy-only Hybrid A* replanning, fraction-index interpolation, Stanley-based tracking을 연결한 mapless parking 작업.",
    created_at: "2026-04-26T00:01:00Z",
  },
  {
    id: 3,
    kind: "project",
    title: "Racing Analyze GUI",
    body: "multiple logged runs를 segment 기준으로 비교하고 driver/vehicle behavior를 시각화하는 MATLAB telemetry analysis workbench.",
    created_at: "2026-04-26T00:02:00Z",
  },
];

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...init.headers,
    },
  });

const sanitize = (value, limit) => String(value ?? "").trim().slice(0, limit);

const ensureSchema = async (db) => {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL DEFAULT 'note',
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      visible INTEGER NOT NULL DEFAULT 1
    )`
  ).run();

  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_entries_visible_created
     ON entries (visible, created_at DESC)`
  ).run();

  const row = await db.prepare("SELECT COUNT(*) AS count FROM entries").first();
  if (row.count === 0) {
    const batch = fallbackEntries.map((entry) =>
      db.prepare(
        `INSERT INTO entries (kind, title, body, created_at)
         VALUES (?, ?, ?, ?)`
      ).bind(entry.kind, entry.title, entry.body, entry.created_at)
    );
    await db.batch(batch);
  }
};

export async function onRequestGet({ env }) {
  if (!env.SITE_DB) {
    return json({ entries: fallbackEntries, mode: "fallback" });
  }

  await ensureSchema(env.SITE_DB);

  const { results } = await env.SITE_DB.prepare(
    `SELECT id, kind, title, body, created_at
     FROM entries
     WHERE visible = 1
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT 30`
  ).all();

  return json({ entries: results, mode: "d1" });
}

export async function onRequestPost({ request, env }) {
  if (!env.SITE_DB) {
    return json({ error: "D1 binding SITE_DB is not configured." }, { status: 503 });
  }

  await ensureSchema(env.SITE_DB);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (payload.website) {
    return json({ ok: true });
  }

  const kind = sanitize(payload.kind || "note", 24);
  const title = sanitize(payload.title, 80);
  const body = sanitize(payload.body, 700);

  if (!title || !body) {
    return json({ error: "Title and body are required." }, { status: 400 });
  }

  const result = await env.SITE_DB.prepare(
    `INSERT INTO entries (kind, title, body, created_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(kind, title, body)
    .run();

  const id = result.meta.last_row_id;
  const entry = await env.SITE_DB.prepare(
    `SELECT id, kind, title, body, created_at
     FROM entries
     WHERE id = ?`
  )
    .bind(id)
    .first();

  return json({ entry }, { status: 201 });
}
