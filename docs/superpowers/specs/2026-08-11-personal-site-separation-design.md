# ujinf.net Personal-Site Separation Design

Date: 2026-08-11

## Goal

Separate the two public sites by purpose:

- ujinf74.github.io is the evidence-oriented portfolio: detailed projects,
  benchmarks, hardware validation, and merged contributions.
- ujinf.net is the personal site: who Ujin is, what he works on, what he is
  doing now, and a small interactive sandbox.

The change should remove self-conscious or dramatic copy without making the
site generic or deleting the technical identity behind it.

## Information Architecture

Keep the existing navigation and URLs: Home, Work, About, and Now. Do not add a
Contributions page, a HERO detail page, or another navigation item.

### Home

- Introduce Ujin in plain language.
- Describe the main working areas rather than presenting a ranked portfolio.
- Keep a short origin note about learning physics and control through games,
  stated as background rather than a manifesto.
- Show current work such as HERO and open-source integration only as concise
  examples, with detailed evidence delegated to the portfolio.

### Work

- Reframe the page as a compact overview of what Ujin works on.
- Remove the search and tag-filter interface; the small item count does not
  need portfolio-style discovery controls.
- Keep short cards for ballistic-solver, mapless parking, HERO, racing
  telemetry, and analysis tooling.
- Link detailed project evidence to ujinf74.github.io.
- Retain the local ballistic-solver link because its interactive demo belongs
  to the personal site's sandbox role.

### ballistic-solver Interactive Page

- Center the page on the browser-based solver and trajectory visualization.
- Replace stale package-default claims with a clear distinction:
  the current package uses the coordinate-residual solver, while the site demo
  is its own JavaScript/Pages Function implementation.
- Remove portfolio-style research, benchmark, implementation inventory, and
  limits sections.
- Keep a short implementation note, one sentence about Rock 5B + STM32
  real-device use, and links to the detailed portfolio, repository, and PyPI.

### About

- Use a factual biography: engineering focus, HuVILab role, racing telemetry,
  and the game-development background.
- Replace the dramatic project-origin timeline with a short background
  section.
- Mention the two merged Autoware contributions as one concise example of
  upstream work, linking to the portfolio for details.
- Add YouTube @tickInt to the contact links.

### Now

- Update the date to 2026-08.
- List current work plainly: HERO in development, ballistic-solver
  maintenance and hardware integration, mapless parking, racing telemetry,
  and this site.

### Shared Footer

Add YouTube @tickInt beside email and GitHub on every HTML page, following
the repository rule that shared header/footer markup is inlined.

## Tone Rules

Apply the same restrained tone in English and Korean.

- Prefer concrete work, systems, and roles over personality claims.
- Remove phrases equivalent to manifesto, instinct, impulse, playground,
  one thread through everything, surviving a race weekend, and years ahead.
- Avoid claims that evaluate the work on the reader's behalf.
- Keep the first-person voice, but use short factual sentences.
- In Korean, prefer natural subject omission over repeated “나는”.

## Internationalization

English remains in the HTML and Korean remains in public/i18n/ko.json.
Every changed or added data-i18n key must exist in the Korean dictionary,
and array indices must stay aligned with the rendered elements.

The existing uncommitted Home/About tone edits are part of the approved copy
direction and must be preserved.

## Non-Goals

- No visual redesign or CSS rework.
- No new navigation or local detail pages.
- No duplication of the full portfolio.
- No new claims that are not already supported by the portfolio or current
  repositories.
- No changes to the ballistic API behavior.

## Verification

- Parse public/i18n/ko.json and public/i18n/ui.json.
- Audit every HTML i18n key against the Korean dictionary.
- Check internal links and required external portfolio/YouTube links.
- Search for removed dramatic phrases and stale ballistic claims.
- Compile the Cloudflare Pages Function through the local Wrangler server.
- Serve the static site locally and smoke-check Home, Work, About, Now, and
  the interactive ballistic page in both language modes.
