# Skyrim Alchemy Filter Site — Design

## Purpose

A personal-use static web app for exploring Skyrim's 110 alchemy ingredients. Supports filtering by effect, finding ingredients with similar effects, and reverse lookup (pick effects → find ingredient combinations). Designed to be double-click-openable locally and deployable to GitHub Pages with no build step.

## Goals

- Browse and filter all 110 ingredients (base game + Dawnguard + Dragonborn + Hearthfire)
- Find ingredients similar to a given ingredient (share effects)
- Reverse lookup: pick desired effects, find ingredient pairs/triples that produce a potion with those effects
- Zero runtime dependencies; works from `file://` or GitHub Pages
- One-shot data pipeline: a Python script refreshes the dataset on demand

## Non-Goals (v1)

- Ingredient images
- Potion gold-value calculator (depends on Alchemy skill/perks/gear — out of scope)
- Inventory tracking
- URL-shareable filter state
- Automated tests (manual smoke-check per filter is sufficient)
- Alchemy leveling strategy content

## Architecture

Single static site, flat file layout, no framework.

```
~/Documents/skyrim/alchemy/
├── index.html          # markup + filter controls
├── styles.css          # styling
├── app.js              # filter logic + rendering
├── data.js             # window.INGREDIENTS = [...]  (generated)
├── scripts/
│   └── build_data.py   # pulls CSV → writes data.js
├── docs/
│   └── superpowers/specs/2026-04-09-skyrim-alchemy-filter-site-design.md
└── README.md
```

**Why `data.js` instead of `data.json`:** browsers block `fetch('./data.json')` under the `file://` protocol. Defining `window.INGREDIENTS = [...]` in a plain `.js` file loaded via `<script>` tag works identically from `file://` and HTTP (GitHub Pages). Same expressiveness, no trade-off.

## Data Pipeline

`scripts/build_data.py` is a stdlib-only Python script (no pip dependencies) that:

1. Downloads the CSV from `https://raw.githubusercontent.com/gimpf/SkyrimAlchemy/master/data/alchemy-ingredients.csv` via `urllib.request`.
2. Parses semicolon-delimited rows: `name; effect1; effect2; effect3; effect4; weight; value; location; dlc_string`.
3. Cleans location strings — strips `[[...]]` wiki markup.
4. Normalizes DLC labels: `Skyrim` → `Base`, `Skyrim Dawnguard` → `Dawnguard`, `Skyrim Dragonborn` → `Dragonborn`, `Skyrim Hearthfire` → `Hearthfire`.
5. Runs the heuristic source-type classifier (see below).
6. Writes `data.js` as `window.INGREDIENTS = [...]` with a JSON-pretty-printed array.
7. Prints a summary to stdout: total count, count per DLC, count per source, and a list of any ingredients classified as `other` so the user can eyeball edge cases.

The script is rerunnable. Hand-edits to `data.js` will be overwritten on regeneration; for persistent overrides, adjust the classifier rules in the script itself.

### Data Schema

```js
{
  name: "Abecean Longfin",
  effects: ["Weakness to Frost", "Fortify Sneak", "Weakness to Poison", "Fortify Restoration"],
  weight: 0.5,
  value: 15,
  location: "Lakes, rivers, streams, fish barrels",
  dlc: "Base",           // Base | Dawnguard | Dragonborn | Hearthfire
  source: "creature"     // plant | creature | purchased | other
}
```

Every ingredient has exactly 4 effects (Skyrim invariant).

### Source-Type Heuristic Classifier

Keyword rules applied to lowercased `location + " " + name`, first match wins:

| Priority | Match tokens                                                                                                         | Classify as  |
|:--------:|----------------------------------------------------------------------------------------------------------------------|--------------|
| 1        | `corpse`, `corpses`, `remains`                                                                                       | creature     |
| 2        | `alchemy shops`, `general goods`, `merchants`, `apothecary`                                                          | purchased    |
| 3        | `harvest`, `plant`, `flower`, `bush`, `tree`, `mushroom`, `fungus`, `moss`, `pod`, `root`, `grass`, `fern`           | plant        |
| 4        | `fish`, `bee`, `moth`, `butterfly`, `dragonfly`, `torchbug`, `spider`, `chaurus`, `slaughterfish`, `bear`, `wolf`, `horker` | creature |
| 5        | (no match)                                                                                                            | other        |

Expected accuracy: ~90%. The `other` bucket is intentional — it's the list to review and either adjust rules for, or leave as-is.

## UI

Three tabs. One results area that updates based on the active tab. Dark theme, system font stack, mobile-responsive.

### Tab 1 — Browse (default)

General-purpose filter workspace.

**Controls:**
- Text search (substring match on name)
- Effect picker (multi-select; shows ingredients that have **all** selected effects — AND semantics)
- DLC checkboxes: Base / Dawnguard / Dragonborn / Hearthfire (all on by default)
- Source checkboxes: Plant / Creature / Purchased / Other
- Sort dropdown: name / value / weight / value-per-weight

**Results:** table with columns `name | effects (4) | weight | value | DLC | source`. Row hover highlight.

### Tab 2 — Similar To

"Find ingredients with effects in common with this one."

**Controls:**
- Ingredient picker (single-select dropdown, all 110)
- Minimum shared effects: 1 / 2 / 3 / 4

**Results:** ingredients that share ≥N effects with the chosen one. Sorted by count of shared effects descending. Shared effects rendered as colored pills so matches are visually obvious.

### Tab 3 — Potion Builder

Reverse lookup: "I want these effects — what do I combine?"

**Controls:**
- Pick 1–3 desired effects from an effect list

**Results:** ingredient **pairs** and **triples** whose combined cross-overlap covers all desired effects. An ingredient pair `(a, b)` produces a potion whose effects are `a.effects ∩ b.effects`. A triple `(a, b, c)` produces the union of the three pairwise intersections. A result is included if that produced-effects set is a superset of the user's desired effects. Ranked by total produced-effect count (more is better). Each result shows member names and the effects the potion will have (with the user's chosen ones highlighted).

Triples-search runs only when the user has selected ≥2 desired effects (single-effect queries rarely need triples and the UI gets noisy).

## App Structure

Single `app.js` file, flat function layout, no framework, no classes, no bundler.

```
State
├── activeTab: 'browse' | 'similar' | 'potion'
├── browseFilters: { search, effects[], dlcs{}, sources{}, sort }
├── similarFilters: { ingredient, minShared }
└── potionFilters: { effects[] }

Indexes (built once at init)
├── ALL_EFFECTS      — sorted unique effect names (populates effect pickers)
└── EFFECT_TO_INGS   — Map<effect, ingredient[]> for fast lookups

Pure filter functions
├── filterBrowse(ings, filters) → ingredient[]
├── findSimilar(ings, ingredient, minShared) → [{ ingredient, shared[] }]
└── findPotions(ings, desiredEffects) → [{ members[], producedEffects[] }]

Renderers
├── renderBrowse(results)
├── renderSimilar(results)
└── renderPotions(results)

Wiring
├── init()     — build indexes, populate dropdowns, bind events
└── rerender() — selects filter fn + renderer based on activeTab
```

### Key Algorithms

- **`findSimilar(target, minShared)`**: for each other ingredient, compute `target.effects ∩ other.effects`. Keep if intersection size ≥ minShared. Sort descending by intersection size.
- **`findPotions(desiredEffects)`**:
  - Pairs: iterate all `C(110, 2) ≈ 6k` combinations. For each, compute `a.effects ∩ b.effects`. If it's a superset of `desiredEffects`, include.
  - Triples (only if `desiredEffects.length ≥ 2`): iterate all `C(110, 3) ≈ 220k` combinations. For each, compute the union of the three pairwise intersections. If superset of `desiredEffects`, include.
  - Both operations finish in under ~100ms in JS; no indexing needed.

### Event Flow

Any filter control change → mutate state → call `rerender()` → filter + render. No diffing, no reactive framework — `resultsEl.innerHTML = …` with HTML-escaped strings is more than fast enough at 110 rows.

## Styling

- System font stack
- Dark theme (fits the Skyrim aesthetic and personal-tool vibe)
- CSS Grid for results table; Flexbox for the filter bar
- Hover highlight on rows
- Shared/matched effects rendered as colored pills in the Similar and Potion Builder tabs
- Mobile (<640px): filter bar stacks vertically, results table renders as a card list

## README

One page. Covers: what it is, how to open locally (`open index.html`), GitHub Pages URL placeholder, how to refresh data (`python3 scripts/build_data.py`), data source credits (gimpf/SkyrimAlchemy, UESP), known limitations (source classifier is heuristic; fix by editing the script's rules and regenerating).

## Deployment

No build step. Target host: `cdobbyn/skyrim-alchemy` GitHub repo (new, separate from the existing `cdobbyn/cdobbyn.github.io` blog repo). Enable GitHub Pages on `main` branch root. Because `cdobbyn.github.io` has `www.dobbo.ca` configured as a custom domain, project pages on the same account are automatically served under that domain as subpaths:

**Final URL: `https://www.dobbo.ca/skyrim-alchemy/`**

No CNAME file or DNS changes are needed in the new repo — GitHub Pages handles the subpath routing automatically.

## Risks & Open Questions

- **Dataset drift:** the upstream CSV at `gimpf/SkyrimAlchemy` is the single source of truth. If the repo disappears, `build_data.py` breaks. Mitigation: `data.js` is checked in, so the site keeps working even if the upstream vanishes; rerunning the script is only needed to refresh.
- **Source classifier edge cases:** a handful of ingredients may end up in `other` or be misclassified. The build script prints these for review; fixes go into the rule table, not manual `data.js` edits.
- **CSV format changes:** if gimpf reformats the CSV, the parser will break. Failure is loud (script errors out), not silent.
