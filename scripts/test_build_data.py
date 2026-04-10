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
