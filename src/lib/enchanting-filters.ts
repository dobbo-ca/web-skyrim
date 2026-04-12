import type { Enchantment } from './types';

export interface EnchantFilters {
  search: string;
  categories: Set<string>;
  slots: Set<string>;
  dlcs: Set<string>;
}

export function filterEnchantments(enchantments: Enchantment[], f: EnchantFilters): Enchantment[] {
  return enchantments.filter(e => {
    if (f.search) {
      const q = f.search.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !e.description.toLowerCase().includes(q)) return false;
    }
    if (!f.categories.has(e.category)) return false;
    if (!e.slots.some(s => f.slots.has(s))) return false;
    if (!f.dlcs.has(e.dlc)) return false;
    return true;
  });
}

export function calculateMagnitude(
  baseMagnitude: number | null,
  enchantingSkill: number,
  soulGemMultiplier: number,
  enchanterPerkRanks: number,  // 0-5, each rank adds 20%
  fortifyEnchantingBonus: number  // decimal, e.g. 0.25 = 25%
): number | null {
  if (baseMagnitude === null) return null;
  const skillFactor = 1 + enchantingSkill / 100;
  const perkFactor = 1 + enchanterPerkRanks * 0.2;
  const fortifyFactor = 1 + fortifyEnchantingBonus;
  return Math.round(baseMagnitude * skillFactor * perkFactor * soulGemMultiplier * fortifyFactor);
}
