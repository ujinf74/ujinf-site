const fallbackEntries = [
  {
    id: 1,
    kind: "site",
    title: "도메인과 사이트 구조",
    body: "ujinf.net은 GitHub 저장소로 관리하고 Cloudflare Pages Functions 위에서 상호작용을 붙이는 방향으로 전환합니다.",
    created_at: "2026-04-26T00:00:00Z",
  },
  {
    id: 2,
    kind: "archive",
    title: "공개 범위",
    body: "개인정보성 이력보다 공개 가능한 링크, 메모, 작업 기록을 우선합니다.",
    created_at: "2026-04-26T00:01:00Z",
  },
  {
    id: 3,
    kind: "experiment",
    title: "작은 상호작용",
    body: "검색, 글 목록, 간단한 게시판 같은 기능을 먼저 붙이고 필요할 때 확장합니다.",
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
