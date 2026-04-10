"""Skyrim alchemy ingredient data pipeline.

Downloads the upstream CSV from gimpf/SkyrimAlchemy, classifies ingredients,
and writes data.js for the static site.
"""

import re

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
