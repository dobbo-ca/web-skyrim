"""Tests for the enchantments data pipeline (scrape_enchantments.py)."""

import sys
import unittest
from pathlib import Path

# Allow running as `python3 -m unittest scripts.test_scrape_enchantments`
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.scrape_enchantments import build_enchantments

REQUIRED_FIELDS = {"name", "category", "slots", "baseMagnitude", "magnitudeUnit",
                   "description", "school", "dlc", "disenchantSources"}

VALID_SLOTS = {"head", "body", "gloves", "boots", "ring", "necklace", "weapon", "shield"}
VALID_CATEGORIES = {"armor", "weapon", "shield"}
VALID_DLC = {"Base", "Dawnguard", "Dragonborn"}
VALID_UNITS = {"%", "pts", "pts/sec", "sec", None}

# Enchantments that legitimately have null baseMagnitude
NULL_MAGNITUDE_NAMES = {
    "Muffle", "Waterbreathing", "Banish", "Paralyze", "Stagger",
    "Huntsman's Prowess", "Notched Pickaxe", "Fear",
}


class TestBuildEnchantments(unittest.TestCase):

    def setUp(self):
        self.enchantments = build_enchantments()

    def test_returns_nonempty_list(self):
        self.assertIsInstance(self.enchantments, list)
        self.assertGreater(len(self.enchantments), 30,
                           "Expected at least 30 enchantments")

    def test_all_required_fields_present(self):
        for enc in self.enchantments:
            missing = REQUIRED_FIELDS - enc.keys()
            self.assertFalse(missing,
                             f"{enc.get('name')!r} is missing fields: {missing}")

    def test_every_enchantment_has_at_least_one_disenchant_source(self):
        for enc in self.enchantments:
            self.assertIsInstance(enc["disenchantSources"], list,
                                  f"{enc['name']}: disenchantSources must be a list")
            self.assertGreater(len(enc["disenchantSources"]), 0,
                               f"{enc['name']}: must have at least one disenchant source")

    def test_disenchant_source_shape(self):
        for enc in self.enchantments:
            for src in enc["disenchantSources"]:
                self.assertIn("item", src, f"{enc['name']}: source missing 'item'")
                self.assertIn("location", src, f"{enc['name']}: source missing 'location'")
                self.assertIn("guaranteed", src, f"{enc['name']}: source missing 'guaranteed'")
                self.assertIsInstance(src["guaranteed"], bool,
                                      f"{enc['name']}: 'guaranteed' must be bool")

    def test_armor_enchantments_have_non_weapon_slots(self):
        for enc in self.enchantments:
            if enc["category"] == "armor":
                self.assertNotEqual(enc["slots"], ["weapon"],
                                    f"{enc['name']}: armor enchantment has only weapon slot")
                non_weapon = [s for s in enc["slots"] if s != "weapon"]
                self.assertTrue(non_weapon,
                                f"{enc['name']}: armor enchantment must have non-weapon slots")

    def test_weapon_enchantments_have_weapon_slot_only(self):
        for enc in self.enchantments:
            if enc["category"] == "weapon":
                self.assertEqual(enc["slots"], ["weapon"],
                                 f"{enc['name']}: weapon enchantment slots must be ['weapon']")

    def test_all_slots_are_valid(self):
        for enc in self.enchantments:
            for slot in enc["slots"]:
                self.assertIn(slot, VALID_SLOTS,
                              f"{enc['name']}: invalid slot {slot!r}")

    def test_all_categories_are_valid(self):
        for enc in self.enchantments:
            self.assertIn(enc["category"], VALID_CATEGORIES,
                          f"{enc['name']}: invalid category {enc['category']!r}")

    def test_all_dlc_values_are_valid(self):
        for enc in self.enchantments:
            self.assertIn(enc["dlc"], VALID_DLC,
                          f"{enc['name']}: invalid dlc {enc['dlc']!r}")

    def test_magnitude_unit_is_valid(self):
        for enc in self.enchantments:
            self.assertIn(enc["magnitudeUnit"], VALID_UNITS,
                          f"{enc['name']}: invalid magnitudeUnit {enc['magnitudeUnit']!r}")

    def test_base_magnitude_null_only_for_known_fixed_effects(self):
        for enc in self.enchantments:
            if enc["baseMagnitude"] is None:
                self.assertIn(enc["name"], NULL_MAGNITUDE_NAMES,
                              f"{enc['name']}: unexpected null baseMagnitude")
            else:
                self.assertIsInstance(enc["baseMagnitude"], (int, float),
                                      f"{enc['name']}: baseMagnitude must be number or null")

    def test_names_are_unique(self):
        names = [enc["name"] for enc in self.enchantments]
        seen = set()
        dupes = []
        for n in names:
            if n in seen:
                dupes.append(n)
            seen.add(n)
        self.assertFalse(dupes, f"Duplicate enchantment names: {dupes}")

    def test_chaos_damage_is_dragonborn(self):
        chaos = next((e for e in self.enchantments if e["name"] == "Chaos Damage"), None)
        self.assertIsNotNone(chaos, "Chaos Damage enchantment not found")
        self.assertEqual(chaos["dlc"], "Dragonborn")

    def test_muffle_has_null_magnitude(self):
        muffle = next((e for e in self.enchantments if e["name"] == "Muffle"), None)
        self.assertIsNotNone(muffle, "Muffle enchantment not found")
        self.assertIsNone(muffle["baseMagnitude"])
        self.assertIsNone(muffle["magnitudeUnit"])

    def test_soul_trap_has_magnitude(self):
        st = next((e for e in self.enchantments if e["name"] == "Soul Trap"), None)
        self.assertIsNotNone(st, "Soul Trap enchantment not found")
        self.assertEqual(st["baseMagnitude"], 5)
        self.assertEqual(st["magnitudeUnit"], "sec")


if __name__ == "__main__":
    unittest.main()
