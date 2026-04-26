# ujinf.net

Personal website source for `ujinf.net`.

This is not intended to stay as a static GitHub Pages site. GitHub is the source
repository; Cloudflare Pages is the target runtime so the site can use Functions
and D1 for interactive parts such as a small board, notes, and search-backed
content.

## Structure

```txt
public/              Static assets served by Cloudflare Pages
functions/api/       Pages Functions API routes
migrations/          D1 schema and seed data
wrangler.toml        Cloudflare local/deploy configuration
```

## Runtime Plan

- Cloudflare Pages serves `public/`.
- Cloudflare Pages Functions handles `/api/*`.
- Cloudflare D1 stores board/note entries.
- GitHub remains the source of truth for code changes.

## Setup

```bash
npm install
npx wrangler d1 create ujinf-site-db
```

Copy the created D1 `database_id` into `wrangler.toml`, replacing
`replace-after-d1-create`.

Apply migrations:

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

Run locally:

```bash
npm run dev
```

Deploy:

```bash
npm run deploy
```

## Domain

Once the Cloudflare Pages project is deployed, move `ujinf.net` from GitHub
Pages to the Cloudflare Pages custom domain. The existing GitHub Pages deployment
can remain temporary until Cloudflare Pages is verified.
