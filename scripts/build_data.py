"""Skyrim alchemy ingredient data pipeline.

Downloads the upstream CSV from gimpf/SkyrimAlchemy, classifies ingredients,
and writes data.js for the static site.
"""

import re

# Priority-ordered keyword rules. First match wins.
# Plants run before creatures so things like "Giant Lichen" match `lichen`
# (plant) before `giant's` (creature).
_CLASSIFIER_RULES = [
    # Priority 1: explicit corpse/remains signal
    ("creature",  ["corpse", "corpses", "remains"]),
    # Priority 2: purchased — explicit merchant sources
    ("purchased", ["alchemy shops", "general goods", "merchants",
                   "apothecary", "caravan"]),
    # Priority 3: plants — harvested flora, mushrooms, herbs, specific species
    ("plant",     ["harvest", "plant", "flower", "bush", "tree", "mushroom",
                   "fungus", "moss", "pod", "root", "grass", "fern",
                   "lichen", "wheat", "garlic", "nightshade", "grape",
                   "lavender", "cotton", "mirriam", "creep cluster",
                   "blister", "dragon's tongue", "namira's rot", "bloom",
                   "hanging in homes", "outdoors in clumps", "grows on"]),
    # Priority 4: creatures — animals, humanoids, body parts, and loot drops
    ("creature",  ["fish", "bee", "moth", "butterfly", "dragonfly", "torchbug",
                   "spider", "chaurus", "slaughterfish", "bear", "wolf", "horker",
                   "boar", "bristleback", "draugr", "skeleton", "forsworn",
                   "spriggan", "skeever", "daedra", "ectoplasm", "ghost",
                   "sabre cat", "falmer", "tern", "atronach", "giant's",
                   "hagraven", "hawk", "human", "vampire", "wraith",
                   "mudcrab", "netch", "thrush", "warbler", "troll",
                   "barnacle", "dartwing", "oyster", "dwarven", "dwemer",
                   "ash spawn", "ashes", "antler", "tusk", "chitin", "fat",
                   "claw", "feather", "ear", "eye of", "beak", "toe",
                   "tooth", "teeth", "hide", "flesh", "heart", "dust",
                   "salts", "sap", "jelly", "egg", "roe", "pearl"]),
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


_WIKI_LINK_RE = re.compile(r"\[\[([^\]|]+?)(\s*)(?:\|([^\]]+?))?(\s*)\]\]")


def clean_wiki_markup(text: str) -> str:
    """Strip MediaWiki [[link]] and [[link|display]] markup.

    Collapses runs of whitespace and trims the result so that quirks like
    '[[Ash Hopper ]]Corpses' in the upstream CSV render cleanly.
    """
    def replace(match: re.Match) -> str:
        target = match.group(1)
        target_ws = match.group(2)
        display = match.group(3)
        display_ws = match.group(4)
        body = (display if display else target).strip()
        # Preserve trailing whitespace inside brackets as an external space
        # so quirks like "[[Ash Hopper ]]Corpses" become "Ash Hopper Corpses".
        has_trailing = (display_ws if display is not None else target_ws)
        return body + (" " if has_trailing else "")

    cleaned = _WIKI_LINK_RE.sub(replace, text)
    return re.sub(r"\s+", " ", cleaned).strip()


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
