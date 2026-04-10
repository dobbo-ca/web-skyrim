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
