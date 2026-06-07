# ujinf.net

Personal site source for `ujinf.net`.

A static multi-page site served by Cloudflare Pages, plus one Pages Function
(`/api/ballistic`) that powers the interactive solver + trajectory widget. Dark
glassmorphism theme with a light mode and full EN/KO toggle. No build step.

## Structure

```txt
public/                    Static site served by Cloudflare Pages
  index.html               Home (mouse-reactive hero canvas, typewriter, origin story)
  capabilities.html        Capabilities
  projects.html            Projects overview (search + tag filter)
  projects/<slug>.html     Project detail pages (ballistic = solver + trajectory canvas)
  about.html  contact.html About / Contact
  styles.css               Design tokens + dark/light themes + components
  theme-init.js            Sync head script: applies saved theme/lang (FOUC-free)
  app.js                   Toggles, i18n application, scroll-reveal, project search
  hero.js                  Home hero particle canvas + typewriter
  trajectory.js            Front-end RK4 re-integration + canvas plot of arcs
  solver.js                ballistic-solver form → /api/ballistic → output + event
  i18n/ko.json             Korean dictionary (English lives in the HTML)
  i18n/ui.json             JS-generated UI strings (EN+KO)
  assets/                  images + videos
functions/api/ballistic.js Pages Function: RK4 drag/wind + closest-approach + LM solve
wrangler.toml              Cloudflare Pages configuration
```

## Run locally

```bash
npm install
npm run dev
```

Ballistic API example:

```bash
curl -X POST http://localhost:8788/api/ballistic \
  -H "content-type: application/json" \
  -d '{"px":120,"py":20,"pz":8,"vx":4,"speed":80,"kDrag":0.00035,"preset":"balanced"}'
```

## Deploy

```bash
npm run deploy
```

## Notes

- **i18n**: English is the source of truth and lives directly in the HTML (so it
  is SEO-visible with no JS). Each translatable node carries `data-i18n`
  (textContent), `data-i18n-html` (innerHTML, for `<b>`-containing blocks), or
  `data-i18n-attr` (attributes). Korean lives only in `public/i18n/ko.json`;
  `app.js` swaps text on toggle and restores the HTML original for English.
  When you add or change English copy, update the matching key in `ko.json`.
- **Theme**: `<html data-theme>` plus CSS variable overrides. `theme-init.js`
  runs synchronously in `<head>` to apply the saved theme before first paint.
- **Header/footer** are inlined per page (no JS injection, so nav survives with
  JS off). When changing nav links or the toggles, update all pages under
  `public/`.
- **trajectory.js** mirrors the exact `deriv` (RK4 + quadratic drag + wind) of
  `functions/api/ballistic.js`. If the API physics model changes, update both.
- Domain `ujinf.net` / `www` are Cloudflare Pages custom domains (CNAME →
  `ujinf-site.pages.dev`, proxied).
```
