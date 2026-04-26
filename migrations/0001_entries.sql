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
    'project',
    'ballistic-solver',
    'moving target을 gravity, quadratic drag, optional wind 조건에서 맞히기 위한 simulate-first intercept optimizer. RK4와 Levenberg-Marquardt 기반.',
    '2026-04-26T00:00:00Z'
  ),
  (
    'project',
    'Mapless Autonomous Parking',
    'online occupancy mapping, occupancy-only Hybrid A* replanning, fraction-index interpolation, Stanley-based tracking을 연결한 mapless parking 작업.',
    '2026-04-26T00:01:00Z'
  ),
  (
    'project',
    'Racing Analyze GUI',
    'multiple logged runs를 segment 기준으로 비교하고 driver/vehicle behavior를 시각화하는 MATLAB telemetry analysis workbench.',
    '2026-04-26T00:02:00Z'
  );
