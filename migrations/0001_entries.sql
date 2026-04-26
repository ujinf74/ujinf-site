CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visible INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_entries_visible_created
ON entries (visible, created_at DESC);

INSERT INTO entries (kind, title, body, created_at)
VALUES
  (
    'site',
    '도메인과 사이트 구조',
    'ujinf.net은 GitHub 저장소로 관리하고 Cloudflare Pages Functions 위에서 상호작용을 붙이는 방향으로 전환한다.',
    '2026-04-26T00:00:00Z'
  ),
  (
    'archive',
    '공개 범위',
    '개인정보성 이력보다 공개 가능한 링크, 메모, 작업 기록을 우선한다.',
    '2026-04-26T00:01:00Z'
  ),
  (
    'experiment',
    '작은 상호작용',
    '검색, 글 목록, 간단한 게시판 같은 기능을 먼저 붙이고 필요할 때 확장한다.',
    '2026-04-26T00:02:00Z'
  );
