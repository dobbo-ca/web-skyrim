# Handoff: Enchanting Section Implementation

## Prompt for the next Claude session

Copy everything below the `---` line and paste it as your opening message.

---

I need you to implement the Enchanting section for my Skyrim helper site. There's a comprehensive implementation plan already written. Here's the context:

**Project:** `~/dobbo-ca/web-skyrim` — an Astro 5 + SolidJS static site that currently has one section (Alchemy) for filtering Skyrim ingredients. It's deployed at `https://www.dobbo.ca/skyrim/` via a GitHub Actions workflow that syncs into `dobbo-ca/dobbo-ca.github.io`. The repo is `dobbo-ca/web-skyrim`.

**What to build:** An Enchanting section with 3 phases:
- **Phase 0:** Restructure from single-page to multi-page Astro routes (landing page + hamburger nav + per-section pages)
- **Phase 1:** Python scraper that hits UESP's MediaWiki API to collect enchantment data (effects, slot compatibility, magnitudes, disenchant sources) and emits `src/data/enchantments.json`
- **Phase 2:** SolidJS UI — enchantment browser, disenchant item finder, soul gem reference
- **Phase 3:** Magnitude calculator (inputs: skill, soul gem, perks, fortify bonus → computed enchantment strength)

**The plan:** Read `docs/superpowers/plans/2026-04-11-enchanting-section.md` — it has the full task breakdown, file structure, data schemas, and implementation notes. Follow it task by task.

**Key files to read first** (for existing patterns):
- `src/components/BrowseTab.tsx` — the pattern for filter + sortable table components
- `src/lib/types.ts` + `src/lib/filters.ts` — existing type definitions and pure filter functions
- `src/styles/global.css` — OKLCH color tokens with light/dark mode, chip toggle classes, sortable header classes
- `scripts/build_data.py` — the alchemy scraper pattern (Python stdlib only)
- `astro.config.mjs` — current Astro config (base: '/skyrim')

**Tech constraints:**
- Python scraper: stdlib only (urllib, json, html.parser). No pip dependencies.
- SolidJS components: follow the existing chip-toggle, sortable-header, status-footer patterns
- CSS: use the existing OKLCH `--primary`/`--secondary`/`--text`/`--bg` tokens. Both light and dark mode must work.
- Rate-limit the UESP scraper: 1-second sleep between page fetches
- Deploy: just push to main. The existing workflow handles the rest.

**Important gotcha:** When using the Write tool to create files, ALWAYS run `tail -5 <file>` immediately after to verify no stray `</content>` tag leaked into the file. This has caused silent failures twice in this project. Prefer Edit over Write when modifying existing files.

Start by reading the plan file and the existing alchemy components, then execute the plan.
