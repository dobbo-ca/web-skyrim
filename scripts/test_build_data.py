"""Unit tests for build_data.py pure functions."""
import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_data import classify_source, clean_wiki_markup, normalize_dlc, parse_row


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


if __name__ == "__main__":
    unittest.main()
