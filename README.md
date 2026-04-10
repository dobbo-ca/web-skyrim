# Skyrim Alchemy

Personal-use static web app for filtering Skyrim's ~110 alchemy ingredients.
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
