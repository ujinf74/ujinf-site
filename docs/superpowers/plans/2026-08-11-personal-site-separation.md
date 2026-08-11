# ujinf.net Personal-Site Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Reframe ujinf.net as a restrained personal site while delegating detailed engineering evidence to ujinf74.github.io.

**Architecture:** Keep the current static HTML, inlined shared markup, and JSON-based Korean translation system. Simplify existing pages in place, retain the local ballistic interactive demo, and use portfolio links for detailed project evidence.

**Tech Stack:** Static HTML/CSS/JavaScript, JSON i18n, Cloudflare Pages, Wrangler.

## Global Constraints

- Preserve the existing Home, Work, About, and Now navigation and URLs.
- Preserve the current uncommitted Home/About tone edits.
- Do not add local HERO or Contributions detail pages.
- Do not modify CSS, the ballistic API, solver.js, or trajectory.js.
- English remains in HTML; Korean remains in public/i18n/ko.json.
- Use factual first-person copy without manifesto, instinct, impulse, playground, survival, or self-evaluating language.
- Mention HERO only as In development.
- Present Edge FCS only as real-device validation of ballistic-solver.

---

### Task 1: Personal Home and Current Snapshot

**Files:**
- Modify: public/index.html
- Modify: public/now.html
- Modify: public/i18n/ko.json

**Interfaces:**
- Consumes: existing data-i18n and data-i18n-html key resolution in public/app.js.
- Produces: aligned English HTML and Korean keys for Home, story, and Now.

- [ ] **Step 1: Rewrite Home identity copy**

Keep the approved plain hero copy. Rename the origin section to “Background” / “배경” and describe Garry's Mod as an early place where vehicle physics and control were implemented, without claiming a single impulse or manifesto.

- [ ] **Step 2: Reframe Home work cards**

Use six concise examples: ballistic-solver, mapless parking, HERO (In development), racing telemetry, analysis tooling, and merged Autoware work. Link detailed evidence to the portfolio except for the local ballistic interactive demo.

- [ ] **Step 3: Update Now**

Set the date to 2026-08 and list HERO, ballistic-solver maintenance and hardware integration, HuVILab mapless parking, racing telemetry, and maintenance of this personal site in neutral language.

- [ ] **Step 4: Update Korean keys**

Update home, story, and now dictionary values with matching array lengths and natural Korean subject omission.

- [ ] **Step 5: Parse-check JSON**

Run:

    node -e "JSON.parse(require('fs').readFileSync('public/i18n/ko.json','utf8')); console.log('ko.json OK')"

Expected: ko.json OK.

### Task 2: Lightweight Work Page

**Files:**
- Modify: public/projects.html
- Modify: public/i18n/ko.json

**Interfaces:**
- Consumes: portfolio URLs and existing project-card styles.
- Produces: a five-area work overview with no search/filter interface.

- [ ] **Step 1: Remove portfolio discovery controls**

Remove the search input, tag chips, result metrics, and early EV card. The page should no longer behave like a searchable portfolio.

- [ ] **Step 2: Add concise work-area cards**

Keep ballistic-solver, mapless parking, racing telemetry, and analysis tooling; add HERO as In development. Each card gets one factual paragraph and a local demo or portfolio detail link.

- [ ] **Step 3: Rewrite project dictionary entries**

Change the intro to explain that this is a short overview of current work and that detailed writeups live in the portfolio. Add projects.hero_line and remove reliance on deleted EV strings.

- [ ] **Step 4: Validate page keys**

Run the repository i18n audit from Task 5 and confirm every Work key resolves.

### Task 3: Interactive ballistic-solver Page

**Files:**
- Modify: public/projects/ballistic-solver.html
- Modify: public/i18n/ko.json

**Interfaces:**
- Consumes: existing solver-form IDs and trajectory canvas IDs used by public/solver.js and public/trajectory.js.
- Produces: an interactive-demo page with all required DOM IDs unchanged.

- [ ] **Step 1: Replace the technical introduction**

State that the package currently uses a coordinate-residual solver. State separately that the browser demo uses the site's JavaScript/Pages Function RK4 and LM implementation.

- [ ] **Step 2: Keep the interactive DOM intact**

Retain solver-form, solver-output, trajectory canvas, field names, and translation keys required by solver.js and trajectory.js.

- [ ] **Step 3: Remove portfolio sections**

Delete the architecture, implementation inventory, result, research table, benchmark table, high-arc update, and known-limits sections.

- [ ] **Step 4: Add a compact implementation note**

After the demo, add three short bullets: native package surfaces, research method retained as solve_aux, and real-device Rock 5B + STM32 validation. Add links to the detailed portfolio, GitHub, and PyPI.

- [ ] **Step 5: Replace stale Korean package copy**

Remove header-only, v0.6, old 0.094/0.182/0.199 ms, and default auxiliary-residual claims from proj_ballistic. Add dictionary values for the compact note.

### Task 4: About, Links, and Shared Footer

**Files:**
- Modify: public/about.html
- Modify: public/index.html
- Modify: public/projects.html
- Modify: public/now.html
- Modify: public/projects/ballistic-solver.html
- Modify: public/i18n/ko.json

**Interfaces:**
- Consumes: inlined page footer pattern.
- Produces: factual biography, concise upstream example, and consistent YouTube links.

- [ ] **Step 1: Simplify About background**

Replace the flow-diagram origin narrative with a short Background section. Keep the factual current-role list.

- [ ] **Step 2: Add upstream work as context**

Add one short paragraph that two CARLA-interface improvements were merged into Autoware Universe, linking to the portfolio contribution summary rather than duplicating PR evidence.

- [ ] **Step 3: Add YouTube to contact**

Add https://www.youtube.com/@tickInt to the English About contact string and Korean about.contact value.

- [ ] **Step 4: Update every footer**

Add a YouTube link beside email and GitHub in all five HTML files.

- [ ] **Step 5: Check shared-link coverage**

Run:

    rg -L "youtube.com/@tickInt" public -g "*.html"

Expected: no HTML file output.

### Task 5: Full Verification and Publish

**Files:**
- Verify all modified public files.

**Interfaces:**
- Consumes: completed Tasks 1–4.
- Produces: evidence that the static site, language data, links, and Cloudflare package are valid.

- [ ] **Step 1: Parse both dictionaries**

Run:

    node -e "for (const f of ['public/i18n/ko.json','public/i18n/ui.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('JSON OK')"

Expected: JSON OK.

- [ ] **Step 2: Audit HTML translation keys**

Run a Node script that extracts data-i18n, data-i18n-html, and data-i18n-attr keys from every HTML file and resolves each path against ko.json.

Expected: zero missing Korean keys.

- [ ] **Step 3: Scan removed claims**

Run:

    rg -n "놀이터|본능|충동|관통하는 줄기|몇 년 앞서서|버티는|header-only|헤더 전용|0\.094|0\.182|0\.199|v0\.6\.0 defaults|core method uses an.*auxiliary" public

Expected: no matches in public copy.

- [ ] **Step 4: Validate the Cloudflare Function bundle**

Run:

    npm.cmd run dev -- --port 8788

Expected: Wrangler reports “Compiled Worker successfully” and starts the local Pages server.

- [ ] **Step 5: Static smoke check**

Request /, /projects, /about, /now, and /projects/ballistic-solver from the local Pages server. Confirm HTTP 200 and required identity text, HERO status, portfolio links, and YouTube links. POST a sample input to /api/ballistic and confirm an ok JSON response.

- [ ] **Step 6: Review and commit**

Run git diff --check, inspect the complete diff, stage only the spec, plan, and intended public files, then commit with a concise message.

- [ ] **Step 7: Push and verify production**

Push main after explicit user authorization already provided in this task. Confirm Cloudflare deployment output and fetch ujinf.net Home, Work, About, Now, and ballistic pages with cache-busting query parameters.
