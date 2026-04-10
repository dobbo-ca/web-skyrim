# Skyrim

Personal-use static web app for Skyrim reference tools. Live at
<https://www.dobbo.ca/skyrim/>.

Built with [Astro](https://astro.build/) and [SolidJS](https://www.solidjs.com/).

## Sections

### Alchemy *(default)*

Filters, search, and potion combinatorics for all ~110 alchemy ingredients.

- **Browse** — filter all ingredients by name, effect (AND), DLC, and source type. Sortable columns: name, weight, value, DLC, source.
- **Similar To** — pick an ingredient, see every other ingredient that shares at least N effects with it. Optionally drill down by checking one or more of the chosen ingredient's 4 effects as requirements. Sortable columns: name, shared-effect count, weight, value, DLC, source.
- **Potion Builder** — pick 1–3 desired effects, see every ingredient pair or triple that produces a potion with those effects. Sortable by produced-effect count or by ingredient names.

Future sections (enchanting, smithing, quests, etc.) will slot in as
additional top-level tabs alongside Alchemy.

## Running locally

```bash
npm install
npm run dev
```

Opens Astro's dev server, typically at <http://localhost:4321/skyrim>.

## Building

```bash
npm run build
```

Output: `dist/`.

## Refreshing the ingredient dataset

The ingredient data is generated from the
[gimpf/SkyrimAlchemy](https://github.com/gimpf/SkyrimAlchemy) CSV via a
Python stdlib script. To refresh:

```bash
npm run build:data
# or:
python3 scripts/build_data.py
```

This writes `src/data/ingredients.json` and prints a summary. Commit the regenerated file.

## Tests

The Python data pipeline has unit test coverage:

```bash
npm run test:data
# or:
python3 -m unittest scripts.test_build_data -v
```

The SolidJS app is manually smoke-tested.

## Deployment

On push to `main`, the workflow in `.github/workflows/deploy.yml` builds the
Astro site and syncs the built `dist/` into
`cdobbyn/cdobbyn.github.io/skyrim/`. That repo is the user's GitHub Pages
site (`www.dobbo.ca`) and the `skyrim/` subpath is served alongside the
Hugo blog.

The workflow needs a repository secret named `PAGES_DEPLOY_TOKEN` — a
fine-grained personal access token with `Contents: Read and write` on
`cdobbyn/cdobbyn.github.io` and no other repos. Create one at
<https://github.com/settings/personal-access-tokens/new> and add it via:

```bash
gh secret set PAGES_DEPLOY_TOKEN --repo cdobbyn/skyrim
```

## Known limitations

- The source-type classifier (`plant` / `creature` / `purchased` / `other`) is a keyword heuristic. To tweak, edit `_CLASSIFIER_RULES` in `scripts/build_data.py` and rerun.
- No images. The app is intentionally self-contained and does not hotlink UESP assets.
- No crafted-potion gold-value calculator — actual value depends on Alchemy skill, perks, and Fortify Alchemy gear.

## Credits

- Ingredient data: [gimpf/SkyrimAlchemy](https://github.com/gimpf/SkyrimAlchemy)
- Original source: [UESP — Skyrim:Ingredients](https://en.uesp.net/wiki/Skyrim:Ingredients)
