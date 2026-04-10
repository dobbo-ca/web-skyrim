# Skyrim Alchemy Filter Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, zero-build-step web app at `~/Documents/skyrim/alchemy` that lets the user filter all 110 Skyrim alchemy ingredients by effect, find ingredients with similar effects, and reverse-lookup ingredient combinations for desired potion effects. Deploy to `https://www.dobbo.ca/skyrim-alchemy/`.

**Architecture:** Vanilla JS multi-file static site. A Python stdlib-only data-build script downloads an upstream CSV, classifies ingredients heuristically, and emits `data.js`. The browser app loads that as a `window.INGREDIENTS` global and drives three tabs (Browse, Similar To, Potion Builder) via pure filter functions and direct DOM rendering.

**Tech Stack:** HTML5, CSS3 (Grid + Flexbox), vanilla JavaScript (no framework, no bundler), Python 3 stdlib (urllib, csv, re, unittest), git, GitHub Pages.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-09-skyrim-alchemy-filter-site-design.md`.

**Working directory for all tasks:** `~/Documents/skyrim/alchemy` (already exists as a git repo). Use absolute paths in file creations. Do not `cd` into the k8s-infra-byoc-azure repo — the working directory for this project is unrelated.

---

## File Structure

```
~/Documents/skyrim/alchemy/
├── index.html            # tab structure + filter controls + results area
├── styles.css            # dark theme, grid table, flex filter bar, mobile breakpoint
├── app.js                # state, indexes, filter functions, renderers, tab switching
├── data.js               # generated: window.INGREDIENTS = [...]
├── .gitignore            # Python __pycache__ etc.
├── README.md             # usage, refresh, deploy, credits
├── scripts/
│   ├── build_data.py     # stdlib-only ingredient data pipeline
│   └── test_build_data.py # unittest coverage for classifier and parser
└── docs/
    └── superpowers/
        ├── specs/2026-04-09-skyrim-alchemy-filter-site-design.md
        └── plans/2026-04-09-skyrim-alchemy-filter-site.md
```

**Responsibilities by file:**

- `scripts/build_data.py` — pure data pipeline. Downloads CSV, parses rows, cleans wiki markup, normalizes DLC labels, classifies source type, writes `data.js`. Idempotent; rerunnable.
- `scripts/test_build_data.py` — stdlib `unittest` covering the four pure functions in `build_data.py` (`parse_row`, `clean_wiki_markup`, `normalize_dlc`, `classify_source`). The network fetch and file write in `main()` are not unit-tested; they are smoke-tested manually in Task 6.
- `index.html` — static DOM: header, tab buttons, per-tab filter panels, single results container. Loads `data.js` then `app.js`.
- `styles.css` — visual presentation only. Dark theme. Grid table > 640px, card list ≤ 640px.
- `app.js` — single flat module: state object, index builders, three filter functions, three renderers, tab-switching, one `init()` call bound to `DOMContentLoaded`.
- `data.js` — generated, committed to git so the site works even if the upstream CSV disappears.

**No automated JS tests.** Per the design spec, the JS app is manually smoke-tested. Automated coverage is limited to the Python data pipeline, where silent failure would corrupt the dataset.

---

## Task 1: Project scaffolding and .gitignore

**Files:**
- Create: `~/Documents/skyrim/alchemy/.gitignore`

- [ ] **Step 1: Create `.gitignore`**

Write the following to `~/Documents/skyrim/alchemy/.gitignore`:

```
__pycache__/
*.pyc
*.pyo
.DS_Store
.vscode/
.idea/
```

- [ ] **Step 2: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add .gitignore
git commit -m "chore: add .gitignore"
```

---

## Task 2: Source-type classifier (TDD)

The heuristic classifier that decides whether an ingredient is a plant, creature, purchased, or other. Implemented test-first because rule priority matters and is easy to get wrong.

**Files:**
- Create: `~/Documents/skyrim/alchemy/scripts/test_build_data.py`
- Create: `~/Documents/skyrim/alchemy/scripts/build_data.py`

- [ ] **Step 1: Write the failing test**

Create `~/Documents/skyrim/alchemy/scripts/test_build_data.py` with the following content:

```python
"""Unit tests for build_data.py pure functions."""
import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_data import classify_source


class TestClassifySource(unittest.TestCase):
    def test_corpse_is_creature(self):
        self.assertEqual(classify_source("Ash Hopper Corpses", "Ash Hopper Jelly"), "creature")

    def test_remains_is_creature(self):
        self.assertEqual(classify_source("Found in troll remains", "Troll Fat"), "creature")

    def test_alchemy_shops_is_purchased(self):
        self.assertEqual(classify_source("Sold in alchemy shops", "Fly Amanita"), "purchased")

    def test_merchants_is_purchased(self):
        self.assertEqual(classify_source("General goods merchants", "Salt Pile"), "purchased")

    def test_flower_is_plant(self):
        self.assertEqual(classify_source("Harvested from the flower", "Blue Mountain Flower"), "plant")

    def test_mushroom_is_plant(self):
        self.assertEqual(classify_source("Cave mushroom", "Bleeding Crown"), "plant")

    def test_fish_is_creature(self):
        self.assertEqual(classify_source("Lakes, rivers, streams, fish barrels", "Abecean Longfin"), "creature")

    def test_bee_is_creature(self):
        self.assertEqual(classify_source("Near beehives", "Bee"), "creature")

    def test_corpse_beats_plant_keyword(self):
        # Priority check: "corpse" wins over any plant keyword that might also be present
        self.assertEqual(classify_source("Corpse near a flower bush", "Mystery"), "creature")

    def test_unmatched_is_other(self):
        self.assertEqual(classify_source("Completely unknown origin", "Weird Thing"), "other")

    def test_case_insensitive(self):
        self.assertEqual(classify_source("CORPSES EVERYWHERE", "Big Creature"), "creature")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Create the `build_data.py` stub**

Create `~/Documents/skyrim/alchemy/scripts/build_data.py` with just enough to be importable but fail the tests:

```python
"""Skyrim alchemy ingredient data pipeline.

Downloads the upstream CSV from gimpf/SkyrimAlchemy, classifies ingredients,
and writes data.js for the static site.
"""


def classify_source(location: str, name: str) -> str:
    """Classify ingredient as plant / creature / purchased / other."""
    raise NotImplementedError
```

- [ ] **Step 3: Run the tests to confirm they fail**

```bash
cd ~/Documents/skyrim/alchemy
python3 -m unittest scripts.test_build_data -v
```

Expected: all 11 tests fail with `NotImplementedError`.

- [ ] **Step 4: Implement `classify_source`**

Replace the stub in `scripts/build_data.py` with:

```python
"""Skyrim alchemy ingredient data pipeline.

Downloads the upstream CSV from gimpf/SkyrimAlchemy, classifies ingredients,
and writes data.js for the static site.
"""

# Priority-ordered keyword rules. First match wins.
_CLASSIFIER_RULES = [
    ("creature",  ["corpse", "corpses", "remains"]),
    ("purchased", ["alchemy shops", "general goods", "merchants", "apothecary"]),
    ("plant",     ["harvest", "plant", "flower", "bush", "tree", "mushroom",
                   "fungus", "moss", "pod", "root", "grass", "fern"]),
    ("creature",  ["fish", "bee", "moth", "butterfly", "dragonfly", "torchbug",
                   "spider", "chaurus", "slaughterfish", "bear", "wolf", "horker"]),
]


def classify_source(location: str, name: str) -> str:
    """Classify ingredient as plant / creature / purchased / other.

    Heuristic: scan the combined location+name text for priority-ordered
    keywords. First rule that matches wins. Falls back to 'other'.
    """
    haystack = f"{location} {name}".lower()
    for label, keywords in _CLASSIFIER_RULES:
        if any(keyword in haystack for keyword in keywords):
            return label
    return "other"
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd ~/Documents/skyrim/alchemy
python3 -m unittest scripts.test_build_data -v
```

Expected: `Ran 11 tests in ... OK`.

- [ ] **Step 6: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add scripts/
git commit -m "feat(build): add source-type classifier with tests"
```

---

## Task 3: Wiki markup cleaner (TDD)

Strip MediaWiki `[[link]]` markup from the location field. Handles plain `[[foo]]` and piped `[[foo|bar]]` forms.

**Files:**
- Modify: `~/Documents/skyrim/alchemy/scripts/test_build_data.py`
- Modify: `~/Documents/skyrim/alchemy/scripts/build_data.py`

- [ ] **Step 1: Add the failing test**

Append to `scripts/test_build_data.py` (after the existing `TestClassifySource` class and before `if __name__ == "__main__":`):

```python
from build_data import clean_wiki_markup


class TestCleanWikiMarkup(unittest.TestCase):
    def test_plain_link(self):
        self.assertEqual(clean_wiki_markup("[[Ancestor Glade]]"), "Ancestor Glade")

    def test_piped_link_uses_display_text(self):
        self.assertEqual(clean_wiki_markup("[[Ash Hopper|Hopper]] Corpses"), "Hopper Corpses")

    def test_no_markup_passthrough(self):
        self.assertEqual(clean_wiki_markup("Lakes, rivers, streams"), "Lakes, rivers, streams")

    def test_trailing_close_brackets(self):
        # The upstream CSV has quirks like "[[Ash Hopper ]]Corpses"
        self.assertEqual(clean_wiki_markup("[[Ash Hopper ]]Corpses"), "Ash Hopper Corpses")

    def test_multiple_links(self):
        self.assertEqual(clean_wiki_markup("[[Whiterun]] and [[Riften]]"), "Whiterun and Riften")

    def test_empty_string(self):
        self.assertEqual(clean_wiki_markup(""), "")

    def test_collapses_double_spaces(self):
        self.assertEqual(clean_wiki_markup("a  b"), "a b")
```

Also update the existing import line at the top of the file from:

```python
from build_data import classify_source
```

to:

```python
from build_data import classify_source, clean_wiki_markup
```

(Remove the mid-file `from build_data import clean_wiki_markup` if you added it separately — keep all imports at the top.)

- [ ] **Step 2: Run tests to confirm the new ones fail**

```bash
cd ~/Documents/skyrim/alchemy
python3 -m unittest scripts.test_build_data -v
```

Expected: 11 passing, 7 failing with `ImportError: cannot import name 'clean_wiki_markup'`.

- [ ] **Step 3: Implement `clean_wiki_markup`**

Add to `scripts/build_data.py` (after the `_CLASSIFIER_RULES` block and the `classify_source` function):

```python
import re

_WIKI_LINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\s*\]\]")


def clean_wiki_markup(text: str) -> str:
    """Strip MediaWiki [[link]] and [[link|display]] markup.

    Collapses runs of whitespace and trims the result so that quirks like
    '[[Ash Hopper ]]Corpses' in the upstream CSV render cleanly.
    """
    def replace(match: re.Match) -> str:
        target, display = match.group(1), match.group(2)
        return (display if display else target).strip()

    cleaned = _WIKI_LINK_RE.sub(replace, text)
    return re.sub(r"\s+", " ", cleaned).strip()
```

Also move `import re` to the top of the file, above `_CLASSIFIER_RULES`.

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd ~/Documents/skyrim/alchemy
python3 -m unittest scripts.test_build_data -v
```

Expected: `Ran 18 tests in ... OK`.

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add scripts/
git commit -m "feat(build): add wiki markup cleaner with tests"
```

---

## Task 4: DLC normalizer (TDD)

Convert the upstream CSV's DLC labels (`Skyrim`, `Skyrim Dawnguard`, `Skyrim Dragonborn`, `Skyrim Hearthfire`) into the short form the UI expects (`Base`, `Dawnguard`, `Dragonborn`, `Hearthfire`).

**Files:**
- Modify: `~/Documents/skyrim/alchemy/scripts/test_build_data.py`
- Modify: `~/Documents/skyrim/alchemy/scripts/build_data.py`

- [ ] **Step 1: Add the failing test**

Append to `scripts/test_build_data.py` (before `if __name__ == "__main__":`):

```python
from build_data import normalize_dlc


class TestNormalizeDlc(unittest.TestCase):
    def test_base_game(self):
        self.assertEqual(normalize_dlc("Skyrim"), "Base")

    def test_dawnguard(self):
        self.assertEqual(normalize_dlc("Skyrim Dawnguard"), "Dawnguard")

    def test_dragonborn(self):
        self.assertEqual(normalize_dlc("Skyrim Dragonborn"), "Dragonborn")

    def test_hearthfire(self):
        self.assertEqual(normalize_dlc("Skyrim Hearthfire"), "Hearthfire")

    def test_unknown_dlc_raises(self):
        # Surface CSV format changes loudly rather than silently mislabeling.
        with self.assertRaises(ValueError):
            normalize_dlc("Skyrim Anniversary")
```

Add `normalize_dlc` to the top-of-file import:

```python
from build_data import classify_source, clean_wiki_markup, normalize_dlc
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd ~/Documents/skyrim/alchemy
python3 -m unittest scripts.test_build_data -v
```

Expected: 18 passing, 5 failing with `ImportError`.

- [ ] **Step 3: Implement `normalize_dlc`**

Append to `scripts/build_data.py`:

```python
_DLC_MAP = {
    "Skyrim":            "Base",
    "Skyrim Dawnguard":  "Dawnguard",
    "Skyrim Dragonborn": "Dragonborn",
    "Skyrim Hearthfire": "Hearthfire",
}


def normalize_dlc(raw: str) -> str:
    """Convert upstream DLC label to the short form used by the UI.

    Raises ValueError on unknown labels so CSV format changes fail loudly.
    """
    key = raw.strip()
    if key not in _DLC_MAP:
        raise ValueError(f"Unknown DLC label: {raw!r}")
    return _DLC_MAP[key]
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd ~/Documents/skyrim/alchemy
python3 -m unittest scripts.test_build_data -v
```

Expected: `Ran 23 tests in ... OK`.

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add scripts/
git commit -m "feat(build): add DLC normalizer with tests"
```

---

## Task 5: CSV row parser (TDD)

Parse a single semicolon-delimited row from the upstream CSV into the ingredient dict shape the frontend expects.

Row format (observed):

```
Abecean Longfin;Weakness to Frost;Fortify Sneak;Weakness to Poison;Fortify Restoration;0.500000;15;Lakes, rivers, streams, fish barrels;Skyrim
```

Columns: `name; effect1; effect2; effect3; effect4; weight; value; location; dlc`.

**Files:**
- Modify: `~/Documents/skyrim/alchemy/scripts/test_build_data.py`
- Modify: `~/Documents/skyrim/alchemy/scripts/build_data.py`

- [ ] **Step 1: Add the failing test**

Append to `scripts/test_build_data.py`:

```python
from build_data import parse_row


class TestParseRow(unittest.TestCase):
    def test_base_game_plant(self):
        row = ["Blue Mountain Flower", "Restore Health", "Fortify Conjuration",
               "Fortify Health", "Damage Magicka Regen", "0.100000", "1",
               "Harvested from the flower", "Skyrim"]
        result = parse_row(row)
        self.assertEqual(result, {
            "name": "Blue Mountain Flower",
            "effects": ["Restore Health", "Fortify Conjuration",
                        "Fortify Health", "Damage Magicka Regen"],
            "weight": 0.1,
            "value": 1,
            "location": "Harvested from the flower",
            "dlc": "Base",
            "source": "plant",
        })

    def test_dragonborn_creature_with_wiki_markup(self):
        row = ["Ash Hopper Jelly", "Restore Health", "Fortify Light Armor",
               "Resist Shock", "Weakness to Frost", "0.300000", "20",
               "[[Ash Hopper ]]Corpses", "Skyrim Dragonborn"]
        result = parse_row(row)
        self.assertEqual(result["name"], "Ash Hopper Jelly")
        self.assertEqual(result["location"], "Ash Hopper Corpses")
        self.assertEqual(result["dlc"], "Dragonborn")
        self.assertEqual(result["source"], "creature")
        self.assertEqual(result["weight"], 0.3)
        self.assertEqual(result["value"], 20)

    def test_weight_is_float_value_is_int(self):
        row = ["X", "A", "B", "C", "D", "2.500000", "150", "Shops", "Skyrim"]
        result = parse_row(row)
        self.assertIsInstance(result["weight"], float)
        self.assertIsInstance(result["value"], int)

    def test_wrong_column_count_raises(self):
        with self.assertRaises(ValueError):
            parse_row(["too", "few", "columns"])
```

Add to the top-of-file import line:

```python
from build_data import classify_source, clean_wiki_markup, normalize_dlc, parse_row
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd ~/Documents/skyrim/alchemy
python3 -m unittest scripts.test_build_data -v
```

Expected: 23 passing, 4 failing with `ImportError`.

- [ ] **Step 3: Implement `parse_row`**

Append to `scripts/build_data.py`:

```python
def parse_row(row: list[str]) -> dict:
    """Convert one CSV row into an ingredient dict.

    Row shape: [name, e1, e2, e3, e4, weight, value, location, dlc_raw]
    """
    if len(row) != 9:
        raise ValueError(f"Expected 9 columns, got {len(row)}: {row}")

    name, e1, e2, e3, e4, weight, value, location_raw, dlc_raw = row
    location = clean_wiki_markup(location_raw)

    return {
        "name":     name.strip(),
        "effects":  [e1.strip(), e2.strip(), e3.strip(), e4.strip()],
        "weight":   float(weight),
        "value":    int(value),
        "location": location,
        "dlc":      normalize_dlc(dlc_raw),
        "source":   classify_source(location, name),
    }
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd ~/Documents/skyrim/alchemy
python3 -m unittest scripts.test_build_data -v
```

Expected: `Ran 27 tests in ... OK`.

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add scripts/
git commit -m "feat(build): add CSV row parser with tests"
```

---

## Task 6: Assemble `build_data.py` main and generate `data.js`

Wire the tested helpers into a `main()` that fetches the upstream CSV, parses all rows, and writes `data.js`. Runs it end-to-end and verifies the output. This step is exercised by manual smoke-test, not unit test — it hits the network and writes a file.

**Files:**
- Modify: `~/Documents/skyrim/alchemy/scripts/build_data.py`
- Create: `~/Documents/skyrim/alchemy/data.js` (generated artifact)

- [ ] **Step 1: Add `main()` and CLI entry**

Append to `scripts/build_data.py`:

```python
import csv
import io
import json
import urllib.request
from collections import Counter
from pathlib import Path

CSV_URL = "https://raw.githubusercontent.com/gimpf/SkyrimAlchemy/master/data/alchemy-ingredients.csv"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data.js"


def fetch_csv(url: str = CSV_URL) -> str:
    """Download the upstream CSV as text."""
    with urllib.request.urlopen(url) as response:
        return response.read().decode("utf-8")


def build_ingredients(csv_text: str) -> list[dict]:
    """Parse CSV text into a list of ingredient dicts."""
    reader = csv.reader(io.StringIO(csv_text), delimiter=";")
    ingredients = []
    for row in reader:
        if not row or not row[0].strip():
            continue  # skip blank lines
        ingredients.append(parse_row(row))
    return ingredients


def write_data_js(ingredients: list[dict], path: Path = OUTPUT_PATH) -> None:
    """Write ingredients as `window.INGREDIENTS = [...];` to data.js."""
    payload = json.dumps(ingredients, indent=2, ensure_ascii=False)
    path.write_text(
        "// Generated by scripts/build_data.py — do not hand-edit.\n"
        f"window.INGREDIENTS = {payload};\n",
        encoding="utf-8",
    )


def print_summary(ingredients: list[dict]) -> None:
    """Print a human-readable summary for spot-checking."""
    print(f"Total ingredients: {len(ingredients)}")
    by_dlc = Counter(ing["dlc"] for ing in ingredients)
    by_source = Counter(ing["source"] for ing in ingredients)
    print(f"By DLC:    {dict(by_dlc)}")
    print(f"By source: {dict(by_source)}")
    others = [ing["name"] for ing in ingredients if ing["source"] == "other"]
    if others:
        print(f"Unclassified ({len(others)}): {', '.join(others)}")


def main() -> None:
    csv_text = fetch_csv()
    ingredients = build_ingredients(csv_text)
    write_data_js(ingredients)
    print_summary(ingredients)
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the full unittest suite to make sure nothing regressed**

```bash
cd ~/Documents/skyrim/alchemy
python3 -m unittest scripts.test_build_data -v
```

Expected: `Ran 27 tests in ... OK`.

- [ ] **Step 3: Run the build script end-to-end**

```bash
cd ~/Documents/skyrim/alchemy
python3 scripts/build_data.py
```

Expected output (numbers may vary slightly):

```
Total ingredients: 110
By DLC:    {'Base': 91, 'Dawnguard': 5, 'Dragonborn': 11, 'Hearthfire': 3}
By source: {'creature': N, 'plant': N, 'purchased': N, 'other': N}
Unclassified (N): ...
Wrote /Users/christopherdobbyn/Documents/skyrim/alchemy/data.js
```

Verify: total is 110, DLC counts look sensible, the "Unclassified" list (if any) contains a small handful of edge cases. If "Unclassified" has more than ~10 entries, inspect them and consider adding keywords to `_CLASSIFIER_RULES` in a follow-up commit — but don't block the plan here.

- [ ] **Step 4: Verify the generated `data.js`**

```bash
head -20 ~/Documents/skyrim/alchemy/data.js
```

Expected: a comment line, then `window.INGREDIENTS = [` followed by JSON objects with `name`, `effects`, `weight`, `value`, `location`, `dlc`, `source` keys.

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add scripts/build_data.py data.js
git commit -m "feat(build): assemble main pipeline and generate data.js"
```

---

## Task 7: HTML skeleton

Create the static DOM: header, tab buttons, per-tab filter panels, and a single results container. Script tags load `data.js` then `app.js`.

**Files:**
- Create: `~/Documents/skyrim/alchemy/index.html`

- [ ] **Step 1: Write `index.html`**

Create `~/Documents/skyrim/alchemy/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Skyrim Alchemy</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Skyrim Alchemy</h1>
    <nav class="tabs" role="tablist">
      <button class="tab active" data-tab="browse" role="tab">Browse</button>
      <button class="tab" data-tab="similar" role="tab">Similar To</button>
      <button class="tab" data-tab="potion" role="tab">Potion Builder</button>
    </nav>
  </header>

  <main>
    <!-- Browse tab -->
    <section class="panel active" data-panel="browse">
      <div class="filters">
        <label>
          Search
          <input type="search" id="browse-search" placeholder="name…">
        </label>
        <label>
          Effects (AND)
          <select id="browse-effects" multiple size="6"></select>
        </label>
        <fieldset>
          <legend>DLC</legend>
          <label><input type="checkbox" class="dlc-filter" value="Base" checked> Base</label>
          <label><input type="checkbox" class="dlc-filter" value="Dawnguard" checked> Dawnguard</label>
          <label><input type="checkbox" class="dlc-filter" value="Dragonborn" checked> Dragonborn</label>
          <label><input type="checkbox" class="dlc-filter" value="Hearthfire" checked> Hearthfire</label>
        </fieldset>
        <fieldset>
          <legend>Source</legend>
          <label><input type="checkbox" class="source-filter" value="plant" checked> Plant</label>
          <label><input type="checkbox" class="source-filter" value="creature" checked> Creature</label>
          <label><input type="checkbox" class="source-filter" value="purchased" checked> Purchased</label>
          <label><input type="checkbox" class="source-filter" value="other" checked> Other</label>
        </fieldset>
        <label>
          Sort by
          <select id="browse-sort">
            <option value="name">Name</option>
            <option value="value">Value</option>
            <option value="weight">Weight</option>
            <option value="ratio">Value / Weight</option>
          </select>
        </label>
      </div>
      <div class="results" id="browse-results"></div>
    </section>

    <!-- Similar To tab -->
    <section class="panel" data-panel="similar">
      <div class="filters">
        <label>
          Ingredient
          <select id="similar-ingredient"></select>
        </label>
        <label>
          Min shared effects
          <select id="similar-min">
            <option value="1">1</option>
            <option value="2" selected>2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <fieldset id="similar-target-effects">
          <legend>Require effect(s)</legend>
          <!-- populated dynamically when ingredient changes -->
        </fieldset>
      </div>
      <div class="results" id="similar-results"></div>
    </section>

    <!-- Potion Builder tab -->
    <section class="panel" data-panel="potion">
      <div class="filters">
        <label>
          Desired effects (pick 1–3)
          <select id="potion-effects" multiple size="10"></select>
        </label>
      </div>
      <div class="results" id="potion-results"></div>
    </section>
  </main>

  <script src="data.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify it loads (will look unstyled and do nothing)**

```bash
open ~/Documents/skyrim/alchemy/index.html
```

Expected: a browser tab opens showing the heading and three tab buttons. The effects dropdown will be empty (no data.js consumers yet) and nothing functions — that is expected.

- [ ] **Step 3: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add index.html
git commit -m "feat(ui): add HTML skeleton with tab panels"
```

---

## Task 8: Dark-theme CSS

Style the page: dark theme, responsive filter bar, grid-based results table on desktop, card list on mobile. No JS interactions required for this step.

**Files:**
- Create: `~/Documents/skyrim/alchemy/styles.css`

- [ ] **Step 1: Write `styles.css`**

Create `~/Documents/skyrim/alchemy/styles.css`:

```css
:root {
  --bg: #141418;
  --bg-elev: #1e1e26;
  --bg-row: #22222c;
  --fg: #e8e6e3;
  --fg-dim: #9a9aa4;
  --accent: #c9a24b;
  --pill-bg: #3a3a48;
  --pill-match: #5a7c3a;
  --border: #2e2e38;
  --radius: 6px;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.5;
}

header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-elev);
}

h1 {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  color: var(--accent);
  letter-spacing: 0.02em;
}

.tabs {
  display: flex;
  gap: 0.25rem;
}

.tab {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--fg-dim);
  padding: 0.5rem 1rem;
  border-radius: var(--radius) var(--radius) 0 0;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}

.tab:hover { color: var(--fg); }

.tab.active {
  background: var(--bg);
  color: var(--accent);
  border-bottom-color: var(--bg);
  position: relative;
  top: 1px;
}

main {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.panel { display: none; }
.panel.active { display: block; }

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-elev);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.filters label,
.filters fieldset {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: var(--fg-dim);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filters fieldset {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.5rem 0.75rem;
  margin: 0;
}

.filters fieldset legend {
  padding: 0 0.25rem;
}

.filters fieldset label {
  flex-direction: row;
  align-items: center;
  gap: 0.35rem;
  text-transform: none;
  font-size: 0.85rem;
  color: var(--fg);
}

.filters input[type="search"],
.filters select {
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.4rem 0.6rem;
  font-family: inherit;
  font-size: 0.9rem;
  min-width: 180px;
}

.filters select[multiple] {
  min-width: 220px;
}

.results {
  display: grid;
  gap: 0.25rem;
}

.row {
  display: grid;
  grid-template-columns: 2fr 5fr 0.8fr 0.8fr 1fr 1fr;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  background: var(--bg-row);
  border-radius: var(--radius);
  align-items: center;
}

.row.header {
  background: transparent;
  color: var(--fg-dim);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-top: 0;
  padding-bottom: 0.25rem;
}

.row:not(.header):hover {
  background: #2b2b36;
}

.row .name { font-weight: 600; color: var(--accent); }

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.pill {
  background: var(--pill-bg);
  color: var(--fg);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.pill.match {
  background: var(--pill-match);
  color: #fff;
}

.empty {
  padding: 2rem;
  text-align: center;
  color: var(--fg-dim);
  font-style: italic;
}

@media (max-width: 640px) {
  .row,
  .row.header {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
  .row.header { display: none; }
  .row .name { font-size: 1rem; }
  .filters { flex-direction: column; }
  .filters select,
  .filters select[multiple],
  .filters input[type="search"] { min-width: 0; width: 100%; }
}
```

- [ ] **Step 2: Reload the browser and verify styling**

Refresh the `index.html` tab. Expected:
- Dark background
- Gold heading "Skyrim Alchemy"
- Three tab buttons, the "Browse" one visually active
- A filter panel below with search box, effect select, DLC checkboxes, source checkboxes, sort dropdown
- Empty results area

Resize the browser window below 640px wide. Expected: filter controls stack vertically.

- [ ] **Step 3: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add styles.css
git commit -m "feat(ui): add dark-theme responsive CSS"
```

---

## Task 9: `app.js` bootstrap (state, indexes, tab switching)

Create the JS module skeleton: state, index builders, dropdown population, tab-switching, and a stub `rerender()` that just shows an empty state. Each subsequent task plugs one tab's filter logic into this skeleton.

**Files:**
- Create: `~/Documents/skyrim/alchemy/app.js`

- [ ] **Step 1: Write `app.js`**

Create `~/Documents/skyrim/alchemy/app.js`:

```javascript
"use strict";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  activeTab: "browse",
  browse: {
    search: "",
    effects: new Set(),
    dlcs: new Set(["Base", "Dawnguard", "Dragonborn", "Hearthfire"]),
    sources: new Set(["plant", "creature", "purchased", "other"]),
    sort: "name",
  },
  similar: {
    ingredient: null,
    minShared: 2,
  },
  potion: {
    effects: new Set(),
  },
};

// Populated in init() from window.INGREDIENTS
let ALL_EFFECTS = [];
let EFFECT_TO_INGS = new Map();

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function intersect(a, b) {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

function isSuperset(superArr, subArr) {
  const set = new Set(superArr);
  return subArr.every((x) => set.has(x));
}

// ---------------------------------------------------------------------------
// Index builders
// ---------------------------------------------------------------------------

function buildIndexes(ingredients) {
  const effectSet = new Set();
  const byEffect = new Map();
  for (const ing of ingredients) {
    for (const effect of ing.effects) {
      effectSet.add(effect);
      if (!byEffect.has(effect)) byEffect.set(effect, []);
      byEffect.get(effect).push(ing);
    }
  }
  ALL_EFFECTS = [...effectSet].sort();
  EFFECT_TO_INGS = byEffect;
}

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------

function showTab(tabName) {
  state.activeTab = tabName;
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("active", p.dataset.panel === tabName);
  });
  rerender();
}

// ---------------------------------------------------------------------------
// Rerender dispatcher (stub — filled in by later tasks)
// ---------------------------------------------------------------------------

function rerender() {
  const containerId = {
    browse: "browse-results",
    similar: "similar-results",
    potion: "potion-results",
  }[state.activeTab];
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '<div class="empty">Not implemented yet.</div>';
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function populateEffectPickers() {
  const browseEffects = document.getElementById("browse-effects");
  const potionEffects = document.getElementById("potion-effects");
  for (const sel of [browseEffects, potionEffects]) {
    sel.innerHTML = ALL_EFFECTS.map(
      (e) => `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`
    ).join("");
  }
}

function populateIngredientPicker() {
  const sel = document.getElementById("similar-ingredient");
  sel.innerHTML = window.INGREDIENTS
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((ing) => `<option value="${escapeHtml(ing.name)}">${escapeHtml(ing.name)}</option>`)
    .join("");
  state.similar.ingredient = sel.value;
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
}

function init() {
  if (!window.INGREDIENTS) {
    console.error("data.js did not load");
    return;
  }
  buildIndexes(window.INGREDIENTS);
  populateEffectPickers();
  populateIngredientPicker();
  bindTabs();
  rerender();
}

document.addEventListener("DOMContentLoaded", init);
```

- [ ] **Step 2: Reload the browser and verify the bootstrap works**

Refresh `index.html`. Expected:
- Open the browser devtools console. No errors.
- The "Effects (AND)" multi-select on the Browse tab is populated with dozens of alphabetized effect names (Cure Disease, Damage Health, Fortify Alchemy, etc.).
- The "Ingredient" dropdown on the Similar To tab is populated with 110 ingredient names.
- Clicking the "Similar To" or "Potion Builder" tabs switches the visible panel and shows "Not implemented yet." in the results area.
- Clicking back to "Browse" also shows "Not implemented yet."

- [ ] **Step 3: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add app.js
git commit -m "feat(app): bootstrap state, indexes, tab switching"
```

---

## Task 10: Browse tab — filter and render

Replace the Browse stub with real filtering and table rendering. Wire up change events on all Browse controls so `rerender()` runs on every interaction.

**Files:**
- Modify: `~/Documents/skyrim/alchemy/app.js`

- [ ] **Step 1: Add `filterBrowse` and `renderBrowse`**

Insert the following into `app.js` immediately **above** the `// Rerender dispatcher` comment block (i.e., after `showTab`):

```javascript
// ---------------------------------------------------------------------------
// Browse tab
// ---------------------------------------------------------------------------

function filterBrowse(ingredients, f) {
  let result = ingredients.filter((ing) => {
    if (f.search && !ing.name.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (!f.dlcs.has(ing.dlc)) return false;
    if (!f.sources.has(ing.source)) return false;
    for (const required of f.effects) {
      if (!ing.effects.includes(required)) return false;
    }
    return true;
  });

  const sorters = {
    name:   (a, b) => a.name.localeCompare(b.name),
    value:  (a, b) => b.value - a.value,
    weight: (a, b) => a.weight - b.weight,
    ratio:  (a, b) => (b.value / b.weight) - (a.value / a.weight),
  };
  result.sort(sorters[f.sort] || sorters.name);
  return result;
}

function renderBrowse(results) {
  const el = document.getElementById("browse-results");
  if (results.length === 0) {
    el.innerHTML = '<div class="empty">No ingredients match these filters.</div>';
    return;
  }
  const header = `
    <div class="row header">
      <div>Name</div>
      <div>Effects</div>
      <div>Weight</div>
      <div>Value</div>
      <div>DLC</div>
      <div>Source</div>
    </div>`;
  const rows = results.map((ing) => `
    <div class="row">
      <div class="name">${escapeHtml(ing.name)}</div>
      <div class="pills">${ing.effects.map((e) => `<span class="pill">${escapeHtml(e)}</span>`).join("")}</div>
      <div>${ing.weight}</div>
      <div>${ing.value}</div>
      <div>${escapeHtml(ing.dlc)}</div>
      <div>${escapeHtml(ing.source)}</div>
    </div>`).join("");
  el.innerHTML = header + rows;
}
```

- [ ] **Step 2: Update `rerender()` to dispatch to Browse when active**

Replace the entire `rerender()` function body with:

```javascript
function rerender() {
  if (state.activeTab === "browse") {
    renderBrowse(filterBrowse(window.INGREDIENTS, state.browse));
  } else {
    const containerId = { similar: "similar-results", potion: "potion-results" }[state.activeTab];
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '<div class="empty">Not implemented yet.</div>';
  }
}
```

- [ ] **Step 3: Add `bindBrowseControls()` and call it from `init()`**

Add this new function anywhere above `init()`:

```javascript
function bindBrowseControls() {
  document.getElementById("browse-search").addEventListener("input", (e) => {
    state.browse.search = e.target.value;
    rerender();
  });
  document.getElementById("browse-effects").addEventListener("change", (e) => {
    state.browse.effects = new Set(
      [...e.target.selectedOptions].map((o) => o.value)
    );
    rerender();
  });
  document.querySelectorAll(".dlc-filter").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) state.browse.dlcs.add(cb.value);
      else state.browse.dlcs.delete(cb.value);
      rerender();
    });
  });
  document.querySelectorAll(".source-filter").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) state.browse.sources.add(cb.value);
      else state.browse.sources.delete(cb.value);
      rerender();
    });
  });
  document.getElementById("browse-sort").addEventListener("change", (e) => {
    state.browse.sort = e.target.value;
    rerender();
  });
}
```

Update `init()` by adding a call to `bindBrowseControls()` right after `bindTabs()`:

```javascript
function init() {
  if (!window.INGREDIENTS) {
    console.error("data.js did not load");
    return;
  }
  buildIndexes(window.INGREDIENTS);
  populateEffectPickers();
  populateIngredientPicker();
  bindTabs();
  bindBrowseControls();
  rerender();
}
```

- [ ] **Step 4: Manually verify the Browse tab works**

Refresh the browser. Expected:
- The Browse tab shows a table with 110 rows sorted by name, starting with "Abecean Longfin".
- Typing "flower" in the search narrows to ingredients with "flower" in the name.
- Clicking an effect in the "Effects (AND)" list filters to ingredients with that effect. Ctrl/Cmd-click to select multiple — result narrows further (AND semantics).
- Unchecking "Dragonborn" removes Dragonborn-only ingredients from the list.
- Unchecking "Creature" removes creature-sourced ingredients.
- Changing sort to "Value" reorders by value descending.
- Changing sort to "Value / Weight" puts the most gold-efficient items first.
- Combining multiple filters works (e.g. Base-only + search "salt" + sort by value).

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add app.js
git commit -m "feat(app): implement Browse tab filter and render"
```

---

## Task 11: Similar To tab

Find ingredients sharing effects with a chosen ingredient. Optionally narrow the search further by targeting one or more of that ingredient's specific 4 effects. Highlight matching effects as green pills.

**State addition:** `state.similar.requiredEffects` is a `Set<string>`. When empty, results are filtered only by `minShared`. When non-empty, each result must additionally contain *every* effect in the set.

**Dynamic UI:** the `#similar-target-effects` fieldset is repopulated whenever the selected ingredient changes. It contains one checkbox per effect of the current ingredient. All start unchecked. Changing ingredients resets `requiredEffects` to empty.

**Files:**
- Modify: `~/Documents/skyrim/alchemy/app.js`

- [ ] **Step 1: Add the `similar.requiredEffects` field to state**

Find the `similar:` block inside the `state` object and replace it with:

```javascript
  similar: {
    ingredient: null,
    minShared: 2,
    requiredEffects: new Set(),
  },
```

- [ ] **Step 2: Add `findSimilar` and `renderSimilar`**

Insert into `app.js` immediately above the `// Rerender dispatcher` comment:

```javascript
// ---------------------------------------------------------------------------
// Similar To tab
// ---------------------------------------------------------------------------

function findSimilar(ingredients, targetName, minShared, requiredEffects) {
  const target = ingredients.find((ing) => ing.name === targetName);
  if (!target) return { target: null, results: [] };
  const required = [...requiredEffects];
  const results = [];
  for (const other of ingredients) {
    if (other.name === target.name) continue;
    const shared = intersect(target.effects, other.effects);
    if (shared.length < minShared) continue;
    if (required.length > 0 && !required.every((e) => other.effects.includes(e))) continue;
    results.push({ ingredient: other, shared });
  }
  results.sort((a, b) => b.shared.length - a.shared.length);
  return { target, results };
}

function renderSimilar(output) {
  const el = document.getElementById("similar-results");
  if (!output || !output.target) {
    el.innerHTML = '<div class="empty">Pick an ingredient.</div>';
    return;
  }
  const { target, results } = output;
  if (results.length === 0) {
    const req = [...state.similar.requiredEffects];
    const reqNote = req.length > 0 ? ` and all of: ${req.join(", ")}` : "";
    el.innerHTML = `<div class="empty">Nothing shares ${escapeHtml(String(state.similar.minShared))}+ effects with ${escapeHtml(target.name)}${escapeHtml(reqNote)}.</div>`;
    return;
  }
  const rows = results.map(({ ingredient, shared }) => {
    const matchSet = new Set(shared);
    const pills = ingredient.effects
      .map((e) => `<span class="pill${matchSet.has(e) ? " match" : ""}">${escapeHtml(e)}</span>`)
      .join("");
    return `
      <div class="row">
        <div class="name">${escapeHtml(ingredient.name)}</div>
        <div class="pills">${pills}</div>
        <div>${ingredient.weight}</div>
        <div>${ingredient.value}</div>
        <div>${escapeHtml(ingredient.dlc)}</div>
        <div>${escapeHtml(ingredient.source)}</div>
      </div>`;
  }).join("");
  el.innerHTML = `
    <div class="row header">
      <div>Name</div>
      <div>Effects (shared highlighted)</div>
      <div>Weight</div>
      <div>Value</div>
      <div>DLC</div>
      <div>Source</div>
    </div>
    ${rows}`;
}
```

- [ ] **Step 3: Add `refreshSimilarTargetEffects` to populate the dynamic checkbox list**

Add this helper directly below `renderSimilar`:

```javascript
function refreshSimilarTargetEffects() {
  const fieldset = document.getElementById("similar-target-effects");
  const target = window.INGREDIENTS.find((i) => i.name === state.similar.ingredient);
  if (!target) {
    fieldset.innerHTML = "<legend>Require effect(s)</legend>";
    return;
  }
  const boxes = target.effects
    .map(
      (e) => `<label><input type="checkbox" class="similar-target-effect" value="${escapeHtml(e)}"> ${escapeHtml(e)}</label>`
    )
    .join("");
  fieldset.innerHTML = `<legend>Require effect(s) of ${escapeHtml(target.name)}</legend>${boxes}`;
  fieldset.querySelectorAll(".similar-target-effect").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) state.similar.requiredEffects.add(cb.value);
      else state.similar.requiredEffects.delete(cb.value);
      rerender();
    });
  });
}
```

- [ ] **Step 4: Extend `rerender()` to dispatch the Similar tab**

Replace `rerender()` with:

```javascript
function rerender() {
  if (state.activeTab === "browse") {
    renderBrowse(filterBrowse(window.INGREDIENTS, state.browse));
  } else if (state.activeTab === "similar") {
    renderSimilar(findSimilar(
      window.INGREDIENTS,
      state.similar.ingredient,
      state.similar.minShared,
      state.similar.requiredEffects,
    ));
  } else {
    const el = document.getElementById("potion-results");
    if (el) el.innerHTML = '<div class="empty">Not implemented yet.</div>';
  }
}
```

- [ ] **Step 5: Add `bindSimilarControls()` and call it from `init()`**

Add the function above `init()`:

```javascript
function bindSimilarControls() {
  document.getElementById("similar-ingredient").addEventListener("change", (e) => {
    state.similar.ingredient = e.target.value;
    state.similar.requiredEffects = new Set();
    refreshSimilarTargetEffects();
    rerender();
  });
  document.getElementById("similar-min").addEventListener("change", (e) => {
    state.similar.minShared = parseInt(e.target.value, 10);
    rerender();
  });
}
```

Update `init()` by adding two calls after `bindBrowseControls()` and before `rerender()`:

```javascript
  bindSimilarControls();
  refreshSimilarTargetEffects();
```

So the final `init()` looks like:

```javascript
function init() {
  if (!window.INGREDIENTS) {
    console.error("data.js did not load");
    return;
  }
  buildIndexes(window.INGREDIENTS);
  populateEffectPickers();
  populateIngredientPicker();
  bindTabs();
  bindBrowseControls();
  bindSimilarControls();
  refreshSimilarTargetEffects();
  rerender();
}
```

- [ ] **Step 6: Manually verify**

Refresh the browser. Switch to the Similar To tab. Expected:
- The Ingredient dropdown defaults to the first alphabetically ("Abecean Longfin").
- A new fieldset "Require effect(s) of Abecean Longfin" is visible with 4 checkboxes (Weakness to Frost, Fortify Sneak, Weakness to Poison, Fortify Restoration), all unchecked.
- Results show ingredients sharing ≥2 effects with Abecean Longfin, sorted by overlap count. Shared effects render as green pills.
- Check the "Weakness to Frost" box → results narrow to only ingredients that share Weakness to Frost with Abecean Longfin.
- Also check "Fortify Sneak" → results narrow further to ingredients that contain both.
- Uncheck both → results return to the broader min-shared view.
- Change the Ingredient to "Blue Mountain Flower" → the fieldset legend updates, the 4 checkboxes are replaced with Blue Mountain Flower's 4 effects, all unchecked (previous selections cleared).
- Changing "Min shared effects" from 2 to 3 narrows the list; changing to 1 widens it. Required-effect filters apply on top of whatever min is set.

- [ ] **Step 7: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add app.js
git commit -m "feat(app): implement Similar To tab with target-effect drilldown"
```

---

## Task 12: Potion Builder tab

Reverse lookup: given 1–3 desired effects, find ingredient pairs (and triples when ≥2 effects requested) whose combined brewed potion covers all desired effects.

**Files:**
- Modify: `~/Documents/skyrim/alchemy/app.js`

- [ ] **Step 1: Add `findPotions` and `renderPotions`**

Insert into `app.js` immediately above the `// Rerender dispatcher` comment:

```javascript
// ---------------------------------------------------------------------------
// Potion Builder tab
// ---------------------------------------------------------------------------

function potionEffectsFromPair(a, b) {
  return intersect(a.effects, b.effects);
}

function potionEffectsFromTriple(a, b, c) {
  // A potion from 3 ingredients shows every effect that at least 2 of them share.
  const ab = intersect(a.effects, b.effects);
  const ac = intersect(a.effects, c.effects);
  const bc = intersect(b.effects, c.effects);
  return [...new Set([...ab, ...ac, ...bc])];
}

function findPotions(ingredients, desired) {
  if (desired.length === 0) return [];
  const results = [];

  // Pairs
  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      const produced = potionEffectsFromPair(ingredients[i], ingredients[j]);
      if (produced.length > 0 && isSuperset(produced, desired)) {
        results.push({ members: [ingredients[i], ingredients[j]], producedEffects: produced });
      }
    }
  }

  // Triples only when the user asks for ≥2 effects (keeps noise down).
  if (desired.length >= 2) {
    for (let i = 0; i < ingredients.length; i++) {
      for (let j = i + 1; j < ingredients.length; j++) {
        for (let k = j + 1; k < ingredients.length; k++) {
          const produced = potionEffectsFromTriple(ingredients[i], ingredients[j], ingredients[k]);
          if (isSuperset(produced, desired)) {
            results.push({
              members: [ingredients[i], ingredients[j], ingredients[k]],
              producedEffects: produced,
            });
          }
        }
      }
    }
  }

  results.sort((a, b) => b.producedEffects.length - a.producedEffects.length);
  return results;
}

function renderPotions(results) {
  const el = document.getElementById("potion-results");
  if (state.potion.effects.size === 0) {
    el.innerHTML = '<div class="empty">Pick 1–3 effects to search.</div>';
    return;
  }
  if (results.length === 0) {
    el.innerHTML = '<div class="empty">No ingredient combinations produce all of those effects together.</div>';
    return;
  }
  const desired = state.potion.effects;
  const rows = results.map(({ members, producedEffects }) => {
    const names = members.map((m) => escapeHtml(m.name)).join(" + ");
    const pills = producedEffects
      .map((e) => `<span class="pill${desired.has(e) ? " match" : ""}">${escapeHtml(e)}</span>`)
      .join("");
    return `
      <div class="row potion">
        <div class="name">${names}</div>
        <div class="pills">${pills}</div>
        <div>${producedEffects.length} effect${producedEffects.length === 1 ? "" : "s"}</div>
      </div>`;
  }).join("");
  el.innerHTML = `
    <div class="row header">
      <div>Ingredients</div>
      <div>Produced effects (requested highlighted)</div>
      <div>Count</div>
    </div>
    ${rows}`;
}
```

- [ ] **Step 2: Update `rerender()` to dispatch the Potion tab**

Replace `rerender()` with:

```javascript
function rerender() {
  if (state.activeTab === "browse") {
    renderBrowse(filterBrowse(window.INGREDIENTS, state.browse));
  } else if (state.activeTab === "similar") {
    renderSimilar(findSimilar(window.INGREDIENTS, state.similar.ingredient, state.similar.minShared));
  } else {
    renderPotions(findPotions(window.INGREDIENTS, [...state.potion.effects]));
  }
}
```

- [ ] **Step 3: Add grid-template for the three-column potion row**

Append to `styles.css`:

```css
.row.potion {
  grid-template-columns: 2fr 5fr 1fr;
}
.row.potion.header { grid-template-columns: 2fr 5fr 1fr; }
@media (max-width: 640px) {
  .row.potion { grid-template-columns: 1fr; }
}
```

- [ ] **Step 4: Add `bindPotionControls()` and call from `init()`**

Add the function:

```javascript
function bindPotionControls() {
  document.getElementById("potion-effects").addEventListener("change", (e) => {
    const selected = [...e.target.selectedOptions].map((o) => o.value).slice(0, 3);
    state.potion.effects = new Set(selected);
    rerender();
  });
}
```

Add `bindPotionControls();` in `init()` right after `bindSimilarControls();`.

- [ ] **Step 5: Manually verify**

Refresh. Switch to the Potion Builder tab. Expected:
- With no effects selected, empty state says "Pick 1–3 effects to search."
- Select "Restore Health" → results show many pairs whose common effect includes Restore Health. Pill highlighted green.
- Select "Restore Health" AND "Fortify One-handed" → results narrow to pairs/triples producing both. Performance should still feel instant (<200ms).
- Selecting more than 3 ignores extras (only first 3 kept).
- Deselecting all returns to the empty state.

Open the browser console and run:

```javascript
findPotions(window.INGREDIENTS, ["Restore Health"]).length
```

Expected: a non-zero integer printed without timing out.

- [ ] **Step 6: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add app.js styles.css
git commit -m "feat(app): implement Potion Builder tab"
```

---

## Task 13: README

Write the user-facing README documenting what the site is, how to run and deploy it, and how to refresh the dataset.

**Files:**
- Create: `~/Documents/skyrim/alchemy/README.md`

- [ ] **Step 1: Write `README.md`**

Create `~/Documents/skyrim/alchemy/README.md`:

```markdown
# Skyrim Alchemy

Personal-use static web app for filtering Skyrim's 110 alchemy ingredients.
Live at <https://www.dobbo.ca/skyrim-alchemy/>.

## Features

- **Browse** — filter all ingredients by name, effect (AND), DLC, source type, and sort by name / value / weight / value-per-weight.
- **Similar To** — pick an ingredient, see every other ingredient that shares at least N effects with it.
- **Potion Builder** — pick 1–3 desired effects and see every ingredient pair or triple that produces a potion with those effects.

## Running locally

No build step. Open `index.html` directly:

```bash
open index.html
```

Works from `file://`; no server required. Also works verbatim from any static host.

## Refreshing the ingredient dataset

The ingredient data is generated from the
[gimpf/SkyrimAlchemy](https://github.com/gimpf/SkyrimAlchemy) CSV via a
Python stdlib script. To refresh:

```bash
python3 scripts/build_data.py
```

This writes `data.js` and prints a summary. Commit the regenerated file.

## Tests

The Python data pipeline has unit test coverage. Run with:

```bash
python3 -m unittest scripts.test_build_data -v
```

The JS app is manually smoke-tested.

## Known limitations

- The source-type classifier (`plant` / `creature` / `purchased` / `other`)
  is a keyword heuristic. Expect a small number of ingredients in the
  `other` bucket. To fix, edit `_CLASSIFIER_RULES` in
  `scripts/build_data.py` and rerun the script.
- No images. The app is intentionally self-contained and does not
  hotlink UESP assets.
- No crafted-potion gold-value calculator — actual value depends on
  Alchemy skill, perks, and Fortify Alchemy gear, which are out of
  scope for a reference tool.

## Credits

- Ingredient data: [gimpf/SkyrimAlchemy](https://github.com/gimpf/SkyrimAlchemy)
- Original source: [UESP — Skyrim:Ingredients](https://en.uesp.net/wiki/Skyrim:Ingredients)
```

- [ ] **Step 2: Commit**

```bash
cd ~/Documents/skyrim/alchemy
git add README.md
git commit -m "docs: add README"
```

---

## Task 14: Create GitHub repo and deploy to GitHub Pages

Push the project to a new public repo under the `cdobbyn` account and enable GitHub Pages so the site is served at `https://www.dobbo.ca/skyrim-alchemy/`.

**This task creates a publicly visible GitHub repo.** The executor must confirm with the user before running these commands. User has already approved the `cdobbyn/skyrim-alchemy` target during brainstorming.

**Files:** no local file changes.

- [ ] **Step 1: Confirm the working tree is clean and all tests pass**

```bash
cd ~/Documents/skyrim/alchemy
git status
python3 -m unittest scripts.test_build_data -v
```

Expected: `nothing to commit, working tree clean`; tests report `OK`.

- [ ] **Step 2: Create the remote repo and push**

```bash
cd ~/Documents/skyrim/alchemy
gh repo create cdobbyn/skyrim-alchemy \
  --public \
  --source=. \
  --remote=origin \
  --push \
  --description "Skyrim alchemy ingredient filter & potion builder"
```

Expected: repo is created, local `main` is pushed, and `origin` is configured.

- [ ] **Step 3: Enable GitHub Pages on `main` branch root**

```bash
gh api -X POST /repos/cdobbyn/skyrim-alchemy/pages \
  -f 'source[branch]=main' \
  -f 'source[path]=/'
```

Expected: JSON response containing `"status": "queued"` or `"built"` and an `html_url`. If the call returns `"pages site already exists"`, that is also fine.

- [ ] **Step 4: Verify the deployment**

Wait ~30–60 seconds for the first build to finish, then open:

<https://www.dobbo.ca/skyrim-alchemy/>

Expected: the site loads exactly as it does locally. All three tabs work. Effects dropdowns are populated. No console errors.

If the page returns 404 immediately, wait a moment and retry — GitHub Pages builds take up to a minute. If it's still 404 after two minutes, check:

```bash
gh api /repos/cdobbyn/skyrim-alchemy/pages
```

Look for `"status": "built"` and inspect any error messages.

- [ ] **Step 5: Mark the task complete**

No commit required — this task only touches the remote.

---

## Self-Review Checklist

**Spec coverage:**
- Filter by effect → Task 10 (Browse `effects` AND-filter) ✓
- Find ingredients with similar effects → Task 11 (Similar To tab) ✓
- Drill down by one of the chosen ingredient's 4 specific effects → Task 11 (`requiredEffects` set + dynamic checkbox fieldset) ✓
- Potion Builder (reverse lookup) → Task 12 ✓
- DLC filter → Task 10 (`.dlc-filter` checkboxes) ✓
- Source-type filter → Task 10 (`.source-filter` checkboxes) + Task 2 classifier ✓
- Text search → Task 10 (`browse-search`) ✓
- Value/weight sort → Task 10 (`browse-sort`) ✓
- `data.js` format → Task 6 `write_data_js` ✓
- Python build pipeline → Tasks 2–6 ✓
- Dark theme + mobile responsive → Task 8 + Task 12 potion grid + `@media (max-width: 640px)` ✓
- Deployment to `www.dobbo.ca/skyrim-alchemy/` → Task 14 ✓

**Type consistency:**
- `classify_source(location, name)` — consistent across Task 2 definition, Task 5 `parse_row` call ✓
- `window.INGREDIENTS` schema (name, effects, weight, value, location, dlc, source) — matches Task 6 generator and Task 9+ consumers ✓
- `state.browse.effects` is a `Set`; `filterBrowse` iterates it with `for...of` which works for Sets ✓
- `state.potion.effects` is a `Set`; `findPotions` receives `[...set]` array — consistent ✓
- `findSimilar` returns `{ target, results }`; `renderSimilar` destructures that shape — consistent ✓
- `findPotions` returns `[{ members, producedEffects }]`; `renderPotions` destructures that shape — consistent ✓

**No placeholders:** every step has concrete code and exact commands. Every test has real assertions. Every commit has a real message.

---

## Execution Handoff

Plan complete and saved to `~/Documents/skyrim/alchemy/docs/superpowers/plans/2026-04-09-skyrim-alchemy-filter-site.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
