# Enchanting Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Enchanting section to the existing Skyrim helper site at `https://www.dobbo.ca/skyrim/`. The section lets users browse all learnable enchantments, find items to disenchant for learning new enchantments, reference soul gem tiers, and calculate enchantment magnitudes based on skill level, perks, and soul gem size. Simultaneously restructure the site from a single-page app to multi-page Astro routes with a shared layout, landing page, and hamburger nav — since this is the second section arriving after Alchemy.

**Architecture:** Astro multi-page routes with SolidJS islands. Each section (Alchemy, Enchanting) gets its own Astro page mounting a dedicated Solid island. A shared Astro layout provides the hamburger nav and consistent chrome. Data is scraped from UESP via the MediaWiki API using a Python stdlib scraper (same pattern as the alchemy pipeline).

**Tech Stack:** Same as existing — Astro 5, @astrojs/solid-js, SolidJS, TypeScript, Python 3 stdlib. No new dependencies.

**Working Directory:** `~/dobbo-ca/web-skyrim` — existing git repo (`dobbo-ca/web-skyrim`), branch `main`.

**Reference:** Existing alchemy implementation in `src/components/` and `src/lib/` for patterns. Design spec at `docs/superpowers/specs/2026-04-09-skyrim-alchemy-filter-site-design.md`. Deploy workflow at `.github/workflows/deploy.yml` (push to main auto-deploys to `www.dobbo.ca/skyrim/`).

---

## Data Schema

### `src/data/enchantments.json`

```json
[
  {
    "name": "Fortify Smithing",
    "category": "armor",
    "slots": ["body", "gloves", "ring", "necklace"],
    "baseMagnitude": 12,
    "magnitudeUnit": "%",
    "description": "Weapons and armor can be improved N% better",
    "school": null,
    "dlc": "Base",
    "disenchantSources": [
      {
        "item": "Silver-Blood Family Ring",
        "location": "The Forsworn Conspiracy quest reward",
        "guaranteed": true
      }
    ]
  }
]
```

Fields:
- `name` — enchantment display name
- `category` — `"armor"` | `"weapon"` | `"shield"`
- `slots` — array of applicable item types: `"head"`, `"body"`, `"gloves"`, `"boots"`, `"ring"`, `"necklace"`, `"weapon"`, `"shield"`
- `baseMagnitude` — strength at Enchanting skill 0, grand soul gem, no perks (the number UESP calls "base magnitude"). `null` for all-or-nothing effects (Muffle, Waterbreathing)
- `magnitudeUnit` — `"%"`, `"pts"`, `"pts/sec"`, `"sec"`, or `null` (for all-or-nothing)
- `description` — one-sentence effect description, with `N` as placeholder for the magnitude
- `school` — magic school if applicable (`"Alteration"`, `"Conjuration"`, etc.), `null` otherwise
- `dlc` — `"Base"` | `"Dawnguard"` | `"Dragonborn"`
- `disenchantSources` — array of items that can be disenchanted to learn this enchantment. Each has `item` (name), `location` (where to find it), and `guaranteed` (boolean: guaranteed spawn vs. random loot)

### `src/data/soul-gems.json`

```json
[
  { "name": "Petty",   "maxSoulLevel": 4,  "magnitudeMultiplier": 0.10 },
  { "name": "Lesser",  "maxSoulLevel": 16, "magnitudeMultiplier": 0.25 },
  { "name": "Common",  "maxSoulLevel": 28, "magnitudeMultiplier": 0.40 },
  { "name": "Greater", "maxSoulLevel": 38, "magnitudeMultiplier": 0.60 },
  { "name": "Grand",   "maxSoulLevel": 99, "magnitudeMultiplier": 1.00 },
  { "name": "Black",   "maxSoulLevel": 99, "magnitudeMultiplier": 1.00, "note": "Can capture humanoid souls (equivalent to Grand)" }
]
```

Note: the exact `magnitudeMultiplier` values need to be verified from UESP. The above are approximate. The scraper or manual curation should confirm them.

---

## File Structure (new + modified files only)

```
~/dobbo-ca/web-skyrim/
├── src/
│   ├── pages/
│   │   ├── index.astro                # NEW — landing page with section cards
│   │   ├── alchemy.astro              # NEW — alchemy section (moved from index.astro)
│   │   └── enchanting.astro           # NEW — enchanting section
│   ├── layouts/
│   │   └── Layout.astro               # MODIFY — add hamburger nav
│   ├── components/
│   │   ├── Nav.tsx                     # NEW — hamburger nav (SolidJS, client:load)
│   │   ├── AlchemyApp.tsx             # RENAME from App.tsx — alchemy island
│   │   ├── EnchantingApp.tsx          # NEW — enchanting island (tab router)
│   │   ├── EnchantBrowser.tsx         # NEW — browse/filter enchantments
│   │   ├── DisenchantFinder.tsx       # NEW — find items to disenchant
│   │   ├── SoulGemReference.tsx       # NEW — soul gem info card
│   │   ├── MagnitudeCalculator.tsx    # NEW — calculate enchantment strength
│   │   ├── BrowseTab.tsx              # unchanged
│   │   ├── SimilarTab.tsx             # unchanged
│   │   └── PotionTab.tsx              # unchanged
│   ├── lib/
│   │   ├── types.ts                   # MODIFY — add Enchantment, SoulGem types
│   │   ├── filters.ts                 # unchanged (alchemy filters)
│   │   └── enchanting-filters.ts      # NEW — enchantment filter + magnitude calc
│   ├── data/
│   │   ├── ingredients.json           # unchanged
│   │   ├── enchantments.json          # NEW — generated by scraper
│   │   └── soul-gems.json             # NEW — hand-curated, 6 entries
│   └── styles/
│       └── global.css                 # MODIFY — add nav, landing page, card styles
├── scripts/
│   ├── build_data.py                  # unchanged (alchemy pipeline)
│   ├── test_build_data.py             # unchanged
│   ├── scrape_enchantments.py         # NEW — UESP MediaWiki API scraper
│   └── test_scrape_enchantments.py    # NEW — tests for parser functions
└── docs/
    └── superpowers/plans/2026-04-11-enchanting-section.md  # this file
```

---

## Phase 0: Multi-page restructure + shared layout

The site currently has one page (`src/pages/index.astro`) mounting one Solid island (`App.tsx` with alchemy tabs). With a second section arriving, restructure to Astro multi-page routes.

### Task E0.1: Shared layout with hamburger nav

**Files:**
- Modify: `src/layouts/Layout.astro`
- Create: `src/components/Nav.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1:** Create `src/components/Nav.tsx` — a SolidJS component that renders a hamburger button (☰) in the top-left corner. When clicked, it toggles a slide-out sidebar listing the sections (Alchemy, Enchanting) with links to `/skyrim/alchemy` and `/skyrim/enchanting`. The current section is highlighted. On desktop (>768px), render the nav as a horizontal strip in the header instead of a hamburger. Use `createSignal<boolean>` for open/closed state.

- [ ] **Step 2:** Modify `src/layouts/Layout.astro` to mount `<Nav client:load />` in the header, passing a `currentSection` prop so the active section is highlighted. Remove the `<header>` from individual section components — it now lives in the layout.

- [ ] **Step 3:** Add hamburger nav CSS to `global.css`: sidebar slide-in animation, overlay backdrop, section links, mobile vs desktop breakpoint at 768px.

- [ ] **Step 4:** Test: `npm run dev`, navigate between sections, verify hamburger works on mobile viewport and horizontal nav on desktop. Verify the ⚔ Skyrim brand mark remains visible.

- [ ] **Step 5:** Commit.

### Task E0.2: Move alchemy to its own route

**Files:**
- Rename: `src/components/App.tsx` → `src/components/AlchemyApp.tsx`
- Create: `src/pages/alchemy.astro`
- Modify: `src/pages/index.astro` (will become landing page in E0.3)

- [ ] **Step 1:** Rename `App.tsx` to `AlchemyApp.tsx`. Update the default export name to `AlchemyApp`. Remove the `<header>` from the component (it's now in the layout). The component should just return the tab nav + tab content inside a `<div>` or fragment.

- [ ] **Step 2:** Create `src/pages/alchemy.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import AlchemyApp from '../components/AlchemyApp';
---
<Layout title="Skyrim — Alchemy" currentSection="alchemy">
  <AlchemyApp client:load />
</Layout>
```

- [ ] **Step 3:** Verify alchemy works at `http://localhost:4321/skyrim/alchemy` with `npm run dev`. All three tabs (Browse, Similar To, Potion Builder) must function.

- [ ] **Step 4:** Commit.

### Task E0.3: Landing page

**Files:**
- Rewrite: `src/pages/index.astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1:** Rewrite `src/pages/index.astro` as a static Astro page (no SolidJS island needed) that shows:
- The `⚔ Skyrim` brand mark and title
- Two section cards in a centered grid:
  - **Alchemy** — "Browse ingredients, find similar effects, build potions" → links to `/skyrim/alchemy`
  - **Enchanting** — "Browse enchantments, find items to disenchant, calculate magnitudes" → links to `/skyrim/enchanting`
- Each card has the section name, a one-line description, and a subtle icon or emoji (⚗ for alchemy, ✨ for enchanting).

- [ ] **Step 2:** Add landing-page card styles to `global.css`: centered grid, dark card backgrounds matching the existing `--bg` palette, hover effect, responsive (stacked on mobile).

- [ ] **Step 3:** Verify the landing page at `http://localhost:4321/skyrim/`. Clicking each card navigates to the correct section.

- [ ] **Step 4:** Commit.

---

## Phase 1: Enchanting data pipeline

### Task E1.1: UESP scraper — enchantment list + slot matrix

**Files:**
- Create: `scripts/scrape_enchantments.py`
- Create: `scripts/test_scrape_enchantments.py`

The scraper uses only Python stdlib (`urllib.request`, `json`, `html.parser`). UESP's MediaWiki API endpoint:

```
https://en.uesp.net/w/api.php?action=parse&page=Skyrim:Enchanting_Effects&format=json&prop=text
```

This returns `{ "parse": { "text": { "*": "<html content>" } } }`. Parse the HTML tables to extract:
- Enchantment name
- Category (armor / weapon / shield — inferred from which table it's in)
- Applicable slots
- Base magnitude

- [ ] **Step 1:** Write tests for `parse_enchantment_table(html: str) -> list[dict]`. The test should use a small HTML fixture resembling UESP's table structure. TDD: write test first, then implement.

- [ ] **Step 2:** Implement `parse_enchantment_table`. Use `html.parser.HTMLParser` subclass to walk the table rows and extract cell text. Handle the slot-compatibility columns (checkmarks / dashes).

- [ ] **Step 3:** Implement `fetch_enchanting_effects_page() -> str` that calls the MediaWiki API and returns the HTML content.

- [ ] **Step 4:** Run against the real UESP page. Print the parsed list. Verify count is ~34-40 enchantments. Spot-check a few entries.

- [ ] **Step 5:** Commit.

### Task E1.2: Disenchant source scraper

**Files:**
- Modify: `scripts/scrape_enchantments.py`
- Modify: `scripts/test_scrape_enchantments.py`

For each enchantment, fetch its individual UESP wiki page (e.g., `Skyrim:Fortify_Smithing`) and extract items that carry the enchantment. These are typically listed in a "Notes" or "Items" section.

MediaWiki API:
```
https://en.uesp.net/w/api.php?action=parse&page=Skyrim:Fortify_Smithing&format=json&prop=text
```

- [ ] **Step 1:** Write `fetch_enchantment_page(enchantment_name: str) -> str` that builds the wiki URL from the enchantment name (handle spaces → underscores, "Fortify One-Handed" → "Skyrim:Fortify_One-Handed").

- [ ] **Step 2:** Write `parse_disenchant_sources(html: str, enchantment_name: str) -> list[dict]` that extracts items + locations. This parser needs to be forgiving — some pages may not have structured item lists. Return what you can; print warnings for pages where extraction fails.

- [ ] **Step 3:** Test with 2-3 known enchantment pages (Fortify Smithing, Fiery Soul Trap, Absorb Health) to verify extraction works.

- [ ] **Step 4:** Run against all enchantments. Print a summary: how many enchantments have ≥1 source, how many have 0 (need manual curation). Write warnings to stderr.

- [ ] **Step 5:** Commit.

### Task E1.3: Manual curation + rare enchantments

**Files:**
- Modify: `scripts/scrape_enchantments.py`

Some enchantments will have incomplete disenchant source data from the scraper (either the wiki page format is inconsistent, or it's a rare enchantment with a single known source). These need a manual override map.

- [ ] **Step 1:** Add a `MANUAL_SOURCES` dict at the top of the scraper with known rare/hard-to-scrape enchantment sources:

```python
MANUAL_SOURCES = {
    "Fiery Soul Trap": [
        {"item": "Steel Battleaxe of Fiery Souls", "location": "Ironbind Barrow, on a pedestal", "guaranteed": True},
    ],
    "Huntsman's Prowess": [
        {"item": "Poacher's Axe", "location": "Halted Stream Camp, on a table", "guaranteed": True},
    ],
    "Notched Pickaxe": [
        {"item": "Notched Pickaxe", "location": "Throat of the World, embedded in rock near summit", "guaranteed": True},
    ],
    "Silent Moons Enchant": [
        {"item": "Lunar Iron War Axe (or Mace/Sword)", "location": "Silent Moons Camp, on the lunar forge and in the chest", "guaranteed": True},
    ],
}
```

The scraper uses this map as a fallback when the wiki page extraction returns no results.

- [ ] **Step 2:** Add a general-purpose fallback for common enchantments: if the scraper finds 0 sources for a non-rare enchantment (e.g., Fortify Health), emit a placeholder source `{"item": "Random enchanted equipment", "location": "Loot, merchants, quest rewards", "guaranteed": false}` and print a warning suggesting manual review.

- [ ] **Step 3:** Run the full pipeline and verify every enchantment has ≥1 source. Print the final summary.

- [ ] **Step 4:** Commit.

### Task E1.4: Soul gem data (hand-curated)

**Files:**
- Create: `src/data/soul-gems.json`

- [ ] **Step 1:** Create `src/data/soul-gems.json` with the 6 tiers. Research the exact `magnitudeMultiplier` values from UESP's enchanting formula page. If the exact multipliers aren't easily confirmable, use the approximate values from the schema above and leave a TODO comment in the JSON.

- [ ] **Step 2:** Commit.

### Task E1.5: Assemble scraper main + emit enchantments.json

**Files:**
- Modify: `scripts/scrape_enchantments.py`
- Create: `src/data/enchantments.json`

- [ ] **Step 1:** Add a `main()` that:
  1. Fetches the enchanting effects page
  2. Parses the enchantment list
  3. For each enchantment, fetches its individual page and extracts disenchant sources
  4. Merges manual overrides
  5. Writes `src/data/enchantments.json`
  6. Prints a summary (count, categories, sources coverage)

Add `if __name__ == "__main__": main()` and a `build:enchantments` npm script.

- [ ] **Step 2:** Run end-to-end. Verify the JSON file is valid and has the expected shape.

- [ ] **Step 3:** Add a `package.json` script: `"build:enchantments": "python3 scripts/scrape_enchantments.py"`.

- [ ] **Step 4:** Commit the scraper and the generated `src/data/enchantments.json`.

---

## Phase 2: Enchanting UI

### Task E2.1: Types + filter functions

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/lib/enchanting-filters.ts`

- [ ] **Step 1:** Add to `types.ts`:

```typescript
export type EnchantCategory = 'armor' | 'weapon' | 'shield';
export type EnchantSlot = 'head' | 'body' | 'gloves' | 'boots' | 'ring' | 'necklace' | 'weapon' | 'shield';

export interface DisenchantSource {
  item: string;
  location: string;
  guaranteed: boolean;
}

export interface Enchantment {
  name: string;
  category: EnchantCategory;
  slots: EnchantSlot[];
  baseMagnitude: number | null;
  magnitudeUnit: string | null;
  description: string;
  school: string | null;
  dlc: Dlc;
  disenchantSources: DisenchantSource[];
}

export interface SoulGem {
  name: string;
  maxSoulLevel: number;
  magnitudeMultiplier: number;
  note?: string;
}
```

- [ ] **Step 2:** Create `src/lib/enchanting-filters.ts` with:

```typescript
export interface EnchantFilters {
  search: string;
  categories: Set<string>;
  slots: Set<string>;
  dlcs: Set<string>;
}

export function filterEnchantments(enchantments: Enchantment[], f: EnchantFilters): Enchantment[]
// Filter by: text search on name/description, category chip toggles, slot chip toggles, DLC chip toggles
// Return filtered array (no sorting — let the component handle sort state)
```

Also add the magnitude calculation function:

```typescript
export function calculateMagnitude(
  baseMagnitude: number | null,
  enchantingSkill: number,   // 0-100
  soulGemMultiplier: number, // from soul-gems.json
  hasBonusPerk: boolean,     // Enchanter perk ranks, Insightful Enchanter, etc.
  fortifyEnchantingBonus: number // from potions/gear, as a decimal (0.25 = 25%)
): number | null
```

The exact formula should be verified from UESP but the general shape is:
`baseMag * (1 + skill/100) * (1 + perkBonus) * soulMultiplier * (1 + fortifyBonus)`

For all-or-nothing enchantments (baseMagnitude null), return null.

- [ ] **Step 3:** Commit.

### Task E2.2: Enchantment browser component

**Files:**
- Create: `src/components/EnchantBrowser.tsx`

Follow the same pattern as `BrowseTab.tsx`: chip toggle rows for category (armor / weapon / shield), slots (head, body, gloves, boots, ring, necklace, weapon, shield), and DLC. Text search. Sortable table headers (name, category, baseMagnitude, school, DLC). Each row shows the enchantment name, applicable slots as small pills, base magnitude, school, and DLC. Footer status line.

- [ ] **Step 1:** Create the component following the alchemy BrowseTab pattern.
- [ ] **Step 2:** Verify with `npm run dev`.
- [ ] **Step 3:** Commit.

### Task E2.3: Disenchant finder component

**Files:**
- Create: `src/components/DisenchantFinder.tsx`

This is the killer feature. The user selects an enchantment from a dropdown (or by clicking a row in the browser). The component shows:
- The enchantment's name, description, applicable slots
- A table of items that can be disenchanted to learn it:
  - Item name
  - Location
  - Guaranteed? (green checkmark for guaranteed, amber question mark for random)
- Sortable by item name, location, guaranteed status

If an enchantment has only generic random-loot sources, show a note: "This enchantment is commonly found on random loot from merchants and dungeon chests."

- [ ] **Step 1:** Create the component. Use a `<select>` for the enchantment picker populated from the data. Alternatively, accept a prop for the selected enchantment name so the browser tab can link to it.
- [ ] **Step 2:** Verify with `npm run dev`.
- [ ] **Step 3:** Commit.

### Task E2.4: Soul gem reference component

**Files:**
- Create: `src/components/SoulGemReference.tsx`

A compact info card (not a full tab) showing the soul gem tiers in a small table: name, max creature level, magnitude multiplier as percentage, and the special note for Black soul gems. Always visible as a collapsible panel or below the calculator.

- [ ] **Step 1:** Create the component.
- [ ] **Step 2:** Commit.

### Task E2.5: Enchanting page + app shell

**Files:**
- Create: `src/components/EnchantingApp.tsx`
- Create: `src/pages/enchanting.astro`

`EnchantingApp.tsx` is the tab router for the enchanting section, following the same pattern as `AlchemyApp.tsx`. Tabs:
- **Browse** — mounts `EnchantBrowser`
- **Disenchant** — mounts `DisenchantFinder`
- **Calculator** — mounts `MagnitudeCalculator` + `SoulGemReference`

`enchanting.astro`:
```astro
---
import Layout from '../layouts/Layout.astro';
import EnchantingApp from '../components/EnchantingApp';
---
<Layout title="Skyrim — Enchanting" currentSection="enchanting">
  <EnchantingApp client:load />
</Layout>
```

- [ ] **Step 1:** Create `EnchantingApp.tsx` with three tabs.
- [ ] **Step 2:** Create `enchanting.astro`.
- [ ] **Step 3:** Verify all three tabs work at `/skyrim/enchanting`.
- [ ] **Step 4:** Commit.

---

## Phase 3: Magnitude calculator

### Task E3.1: Calculator component

**Files:**
- Create: `src/components/MagnitudeCalculator.tsx`

Inputs:
- Enchantment picker (dropdown, all enchantments)
- Enchanting skill slider (0–100, default 100)
- Soul gem picker (dropdown from soul-gems.json)
- Enchanter perk rank (0–5, each rank adds 20% bonus)
- Fortify Enchanting bonus (number input, 0–100%, from potions/gear)

Output:
- Calculated magnitude (live-updating as inputs change)
- For all-or-nothing enchantments (Muffle, Waterbreathing): display "Fixed effect — magnitude does not vary"
- Show the formula breakdown so the user can see how each factor contributes

Use SolidJS `createMemo` for the computed magnitude so it updates reactively.

- [ ] **Step 1:** Create the component.
- [ ] **Step 2:** Wire it into the Calculator tab of `EnchantingApp`.
- [ ] **Step 3:** Verify with `npm run dev`. Test with known values (e.g., Fortify Smithing at skill 100, grand soul, 5/5 Enchanter = should produce the known in-game value).
- [ ] **Step 4:** Commit.

---

## Final verification

### Task E4.1: Build + deploy + smoke test

- [ ] **Step 1:** Run `npx tsc --noEmit` — zero errors.
- [ ] **Step 2:** Run `npm run build` — succeeds.
- [ ] **Step 3:** Run `python3 -m unittest scripts.test_build_data scripts.test_scrape_enchantments -v` — all tests pass.
- [ ] **Step 4:** Run `npm run dev` and manually verify:
  - Landing page at `/skyrim/` shows two section cards.
  - Alchemy section at `/skyrim/alchemy` works exactly as before.
  - Enchanting section at `/skyrim/enchanting` shows three tabs.
  - Browse tab filters by slot, category, DLC, search. Sortable headers work.
  - Disenchant tab shows items for each enchantment. Guaranteed sources have a green indicator.
  - Calculator tab computes magnitudes. Soul gem reference is visible.
  - Hamburger nav works on mobile; horizontal nav on desktop.
- [ ] **Step 5:** Push to main. Verify the deploy workflow succeeds and `www.dobbo.ca/skyrim/` shows the landing page.
- [ ] **Step 6:** Commit any final fixes.

---

## Notes for the implementing agent

1. **Follow existing patterns.** The alchemy code in `src/components/BrowseTab.tsx`, `SimilarTab.tsx`, `PotionTab.tsx`, `src/lib/filters.ts`, and `src/lib/types.ts` is the template for how to write SolidJS components, filter functions, and TypeScript types in this project. Read them before writing new code.

2. **The UESP scraper will need debugging.** Wiki page formats are inconsistent. Budget time for the parser to handle edge cases. Print warnings (to stderr) rather than crashing on malformed pages. The scraper should be rerunnable and idempotent.

3. **CSS uses OKLCH color tokens** with `prefers-color-scheme` light/dark mode. See `src/styles/global.css` for the full token set. All new UI elements must work in both themes.

4. **Chip toggles, sortable headers, and the status footer** are existing patterns in the alchemy components. Reuse the same CSS classes (`.chip-toggle`, `.chip-row`, `.row.header.sortable`, `.status`).

5. **The deploy workflow** pushes built files to `dobbo-ca/dobbo-ca.github.io/skyrim/`. It uses the `dobbobot-public` GitHub App with org-level `vars.GH_PUB_APP_CLIENT_ID` and `secrets.GH_PUB_APP_PEM`. No changes needed to the workflow for this feature — just push to main and it auto-deploys.

6. **Rate-limit the UESP scraper.** Add a 1-second `time.sleep()` between individual page fetches to be respectful to the wiki servers. ~35 pages at 1s each = ~35 seconds for a full scrape. This is a dev-time tool, not a build-time dependency.

7. **The `</content>` bug.** When using the Write tool to create files, always run `tail -5 <file>` immediately after to verify no stray `</content>` tag leaked into the file. This has caused silent workflow failures and TypeScript build errors twice in this project. Prefer Edit over Write when possible.
