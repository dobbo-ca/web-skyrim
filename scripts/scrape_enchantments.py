"""Skyrim enchantment data pipeline.

Produces src/data/enchantments.json from a hardcoded curated list of all
learnable enchantments plus known disenchant sources.

No network requests are made — data is fully curated inline.
"""

import json
from pathlib import Path

OUTPUT_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "enchantments.json"

# ---------------------------------------------------------------------------
# Base enchantment list
# Each entry: (name, category, slots, baseMagnitude, magnitudeUnit, description, school, dlc)
# ---------------------------------------------------------------------------

ENCHANTMENTS_BASE = [
    # --- Armor / apparel enchantments ---
    {
        "name": "Fortify Alchemy",
        "category": "armor",
        "slots": ["body", "gloves", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Alchemy skill is improved by N%.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Alteration",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Alteration spells cost N% less to cast.",
        "school": "Alteration",
        "dlc": "Base",
    },
    {
        "name": "Fortify Archery",
        "category": "armor",
        "slots": ["head", "body", "gloves", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Bows do N% more damage.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Barter",
        "category": "armor",
        "slots": ["ring", "necklace"],
        "baseMagnitude": 10,
        "magnitudeUnit": "%",
        "description": "You can barter with N% better prices.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Block",
        "category": "armor",
        "slots": ["body", "gloves", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Blocking absorbs N% more damage.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Carry Weight",
        "category": "armor",
        "slots": ["body", "boots", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "pts",
        "description": "Carry weight is increased by N points.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Conjuration",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Conjuration spells cost N% less to cast.",
        "school": "Conjuration",
        "dlc": "Base",
    },
    {
        "name": "Fortify Destruction",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Destruction spells cost N% less to cast.",
        "school": "Destruction",
        "dlc": "Base",
    },
    {
        "name": "Fortify Enchanting",
        "category": "armor",
        "slots": ["body", "gloves", "ring", "necklace"],
        "baseMagnitude": 5,
        "magnitudeUnit": "%",
        "description": "Enchanting skill is improved by N%.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Health",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "pts",
        "description": "Health is increased by N points.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Heavy Armor",
        "category": "armor",
        "slots": ["body", "gloves", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Heavy Armor skill is improved by N%.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Illusion",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Illusion spells cost N% less to cast.",
        "school": "Illusion",
        "dlc": "Base",
    },
    {
        "name": "Fortify Light Armor",
        "category": "armor",
        "slots": ["body", "gloves", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Light Armor skill is improved by N%.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Lockpicking",
        "category": "armor",
        "slots": ["gloves", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Lockpicking is N% easier.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Magicka",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "pts",
        "description": "Magicka is increased by N points.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Magicka Regen",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "%",
        "description": "Magicka regenerates N% faster.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify One-Handed",
        "category": "armor",
        "slots": ["body", "gloves", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "One-handed attacks do N% more damage.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Pickpocket",
        "category": "armor",
        "slots": ["gloves", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Pickpocketing is N% more likely to succeed.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Restoration",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Restoration spells cost N% less to cast.",
        "school": "Restoration",
        "dlc": "Base",
    },
    {
        "name": "Fortify Smithing",
        "category": "armor",
        "slots": ["body", "gloves", "ring", "necklace"],
        "baseMagnitude": 12,
        "magnitudeUnit": "%",
        "description": "Weapons and armor can be improved N% better.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Sneak",
        "category": "armor",
        "slots": ["body", "gloves", "boots", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "You are N% harder to detect while sneaking.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Stamina",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "pts",
        "description": "Stamina is increased by N points.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Stamina Regen",
        "category": "armor",
        "slots": ["body", "boots", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "%",
        "description": "Stamina regenerates N% faster.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Fortify Two-Handed",
        "category": "armor",
        "slots": ["body", "gloves", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Two-handed attacks do N% more damage.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Muffle",
        "category": "armor",
        "slots": ["boots"],
        "baseMagnitude": None,
        "magnitudeUnit": None,
        "description": "Your footsteps are silent.",
        "school": "Illusion",
        "dlc": "Base",
    },
    {
        "name": "Resist Disease",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "%",
        "description": "Disease resistance is increased by N%.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Resist Fire",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "%",
        "description": "Fire resistance is increased by N%.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Resist Frost",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "%",
        "description": "Frost resistance is increased by N%.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Resist Magic",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 8,
        "magnitudeUnit": "%",
        "description": "Magic resistance is increased by N%.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Resist Poison",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "%",
        "description": "Poison resistance is increased by N%.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Resist Shock",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": 25,
        "magnitudeUnit": "%",
        "description": "Shock resistance is increased by N%.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Waterbreathing",
        "category": "armor",
        "slots": ["body", "ring", "necklace"],
        "baseMagnitude": None,
        "magnitudeUnit": None,
        "description": "You can breathe underwater.",
        "school": "Alteration",
        "dlc": "Base",
    },
    # --- Weapon enchantments ---
    {
        "name": "Absorb Health",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 10,
        "magnitudeUnit": "pts",
        "description": "Absorb N points of health from the target.",
        "school": "Restoration",
        "dlc": "Base",
    },
    {
        "name": "Absorb Magicka",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 10,
        "magnitudeUnit": "pts",
        "description": "Absorb N points of Magicka from the target.",
        "school": "Restoration",
        "dlc": "Base",
    },
    {
        "name": "Absorb Stamina",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 10,
        "magnitudeUnit": "pts",
        "description": "Absorb N points of Stamina from the target.",
        "school": "Restoration",
        "dlc": "Base",
    },
    {
        "name": "Banish",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": None,
        "magnitudeUnit": None,
        "description": "Banishes summoned creatures up to level N.",
        "school": "Conjuration",
        "dlc": "Base",
    },
    {
        "name": "Fear",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 15,
        "magnitudeUnit": None,
        "description": "Target flees from combat for N seconds.",
        "school": "Illusion",
        "dlc": "Base",
    },
    {
        "name": "Fire Damage",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 10,
        "magnitudeUnit": "pts",
        "description": "Target takes N points of fire damage.",
        "school": "Destruction",
        "dlc": "Base",
    },
    {
        "name": "Frost Damage",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 10,
        "magnitudeUnit": "pts",
        "description": "Target takes N points of frost damage and stamina damage.",
        "school": "Destruction",
        "dlc": "Base",
    },
    {
        "name": "Shock Damage",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 10,
        "magnitudeUnit": "pts",
        "description": "Target takes N points of shock damage and half as much Magicka damage.",
        "school": "Destruction",
        "dlc": "Base",
    },
    {
        "name": "Fiery Soul Trap",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 10,
        "magnitudeUnit": "pts",
        "description": "If target dies within N seconds, fills a soul gem.",
        "school": "Conjuration",
        "dlc": "Base",
    },
    {
        "name": "Huntsman's Prowess",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": None,
        "magnitudeUnit": None,
        "description": "Does N% more damage to animals.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Notched Pickaxe",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": None,
        "magnitudeUnit": None,
        "description": "Unique pickaxe enchantment; fortifies Smithing.",
        "school": None,
        "dlc": "Base",
    },
    {
        "name": "Paralyze",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": None,
        "magnitudeUnit": None,
        "description": "Target is paralyzed for N seconds.",
        "school": "Alteration",
        "dlc": "Base",
    },
    {
        "name": "Silent Moons Enchant",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 20,
        "magnitudeUnit": "pts",
        "description": "Burns the target for N points while the moon is out.",
        "school": "Destruction",
        "dlc": "Base",
    },
    {
        "name": "Soul Trap",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 5,
        "magnitudeUnit": "sec",
        "description": "If target dies within N seconds, fills a soul gem.",
        "school": "Conjuration",
        "dlc": "Base",
    },
    {
        "name": "Stamina Damage",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 10,
        "magnitudeUnit": "pts",
        "description": "Target loses N points of Stamina.",
        "school": "Destruction",
        "dlc": "Base",
    },
    {
        "name": "Stagger",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": None,
        "magnitudeUnit": None,
        "description": "Causes the target to stagger.",
        "school": "Alteration",
        "dlc": "Base",
    },
    {
        "name": "Magicka Damage",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 10,
        "magnitudeUnit": "pts",
        "description": "Target loses N points of Magicka.",
        "school": "Destruction",
        "dlc": "Base",
    },
    {
        "name": "Chaos Damage",
        "category": "weapon",
        "slots": ["weapon"],
        "baseMagnitude": 25,
        "magnitudeUnit": "pts",
        "description": "50% chance to deal N points of fire, frost, and shock damage.",
        "school": "Destruction",
        "dlc": "Dragonborn",
    },
]

# ---------------------------------------------------------------------------
# Disenchant sources — curated guaranteed and notable sources
# ---------------------------------------------------------------------------

_FALLBACK_SOURCE = {
    "item": "Random enchanted equipment",
    "location": "Found on leveled loot, merchants, or quest rewards",
    "guaranteed": False,
}

DISENCHANT_SOURCES: dict[str, list[dict]] = {
    "Fortify Smithing": [
        {
            "item": "Silver-Blood Family Ring",
            "location": "The Forsworn Conspiracy quest reward",
            "guaranteed": True,
        },
        {
            "item": "Linwe's Armor/Boots/Gloves/Hood",
            "location": "Uttering Hills Cave (Thieves Guild quest)",
            "guaranteed": True,
        },
    ],
    "Fiery Soul Trap": [
        {
            "item": "Steel Battleaxe of Fiery Souls",
            "location": "Ironbind Barrow, on a pedestal near the final area",
            "guaranteed": True,
        },
    ],
    "Huntsman's Prowess": [
        {
            "item": "Poacher's Axe",
            "location": "Halted Stream Camp, on a table inside the mine",
            "guaranteed": True,
        },
    ],
    "Notched Pickaxe": [
        {
            "item": "Notched Pickaxe",
            "location": "Throat of the World, embedded in rock near the summit",
            "guaranteed": True,
        },
    ],
    "Silent Moons Enchant": [
        {
            "item": "Lunar Iron War Axe",
            "location": "Silent Moons Camp, on the Lunar Forge or in nearby chest",
            "guaranteed": True,
        },
    ],
    "Chaos Damage": [
        {
            "item": "Champion's Cudgel",
            "location": "General Falx Carius at Fort Frostmoth (Dragonborn DLC)",
            "guaranteed": True,
        },
    ],
    "Fortify Alchemy": [
        {
            "item": "Krosis (mask)",
            "location": "Shearpoint dragon lair (word wall)",
            "guaranteed": True,
        },
        {
            "item": "Ahzidal's Ring of Arcana",
            "location": "Kolbjorn Barrow (Dragonborn DLC, 3rd excavation)",
            "guaranteed": True,
        },
    ],
    "Fortify Enchanting": [
        {
            "item": "Ahzidal's Ring of Arcana",
            "location": "Kolbjorn Barrow (Dragonborn DLC, 3rd excavation)",
            "guaranteed": True,
        },
    ],
    "Muffle": [
        {
            "item": "Predator's Grace (boots)",
            "location": "Evergreen Grove (south of Falkreath)",
            "guaranteed": True,
        },
    ],
    "Banish": [
        {
            "item": "Any Banish-enchanted weapon",
            "location": "Radiant loot from higher-level enemies; rare",
            "guaranteed": False,
        },
    ],
    "Paralyze": [
        {
            "item": "Any Paralyze-enchanted weapon",
            "location": "High-level loot or merchants at level 46+",
            "guaranteed": False,
        },
    ],
    "Absorb Health": [
        {
            "item": "Vampire weapons",
            "location": "Dropped by vampires in Volkihar Keep or Castle Volkihar (Dawnguard)",
            "guaranteed": False,
        },
    ],
}


# ---------------------------------------------------------------------------
# Build function
# ---------------------------------------------------------------------------

def build_enchantments() -> list[dict]:
    """Merge ENCHANTMENTS_BASE with DISENCHANT_SOURCES and return final list."""
    result = []
    for enc in ENCHANTMENTS_BASE:
        name = enc["name"]
        sources = DISENCHANT_SOURCES.get(name, [_FALLBACK_SOURCE])
        entry = dict(enc)
        entry["disenchantSources"] = sources
        result.append(entry)
    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    enchantments = build_enchantments()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(enchantments, indent=2, ensure_ascii=False)
    OUTPUT_PATH.write_text(payload + "\n", encoding="utf-8")
    print(f"Wrote {len(enchantments)} enchantments to {OUTPUT_PATH}")

    armor_count = sum(1 for e in enchantments if e["category"] == "armor")
    weapon_count = sum(1 for e in enchantments if e["category"] == "weapon")
    dragonborn_count = sum(1 for e in enchantments if e["dlc"] == "Dragonborn")
    print(f"  Armor: {armor_count}, Weapon: {weapon_count}, Dragonborn DLC: {dragonborn_count}")


if __name__ == "__main__":
    main()
