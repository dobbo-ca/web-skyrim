import type { Ingredient } from './types';

export function intersect<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

export function isSuperset<T>(superArr: T[], subArr: T[]): boolean {
  const set = new Set(superArr);
  return subArr.every((x) => set.has(x));
}

export function sortBy<T>(
  arr: T[],
  getter: (x: T) => number | string,
  dir: 'asc' | 'desc'
): T[] {
  const sorted = [...arr].sort((a, b) => {
    const av = getter(a);
    const bv = getter(b);
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}

// --- Browse ---------------------------------------------------------------

export interface BrowseFilters {
  search: string;
  effects: Set<string>;
  dlcs: Set<string>;
  sources: Set<string>;
}

export function filterBrowse(
  ingredients: Ingredient[],
  f: BrowseFilters
): Ingredient[] {
  return ingredients.filter((ing) => {
    if (f.search && !ing.name.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (!f.dlcs.has(ing.dlc)) return false;
    if (!f.sources.has(ing.source)) return false;
    for (const required of f.effects) {
      if (!ing.effects.includes(required)) return false;
    }
    return true;
  });
}

// --- Similar --------------------------------------------------------------

export interface SimilarResult {
  ingredient: Ingredient;
  shared: string[];
}

export interface SimilarOutput {
  target: Ingredient | null;
  results: SimilarResult[];
}

export function findSimilar(
  ingredients: Ingredient[],
  targetName: string | null,
  minShared: number,
  requiredEffects: Set<string>
): SimilarOutput {
  if (!targetName) return { target: null, results: [] };
  const target = ingredients.find((ing) => ing.name === targetName);
  if (!target) return { target: null, results: [] };
  const required = [...requiredEffects];
  const results: SimilarResult[] = [];
  for (const other of ingredients) {
    if (other.name === target.name) continue;
    const shared = intersect(target.effects, other.effects);
    if (shared.length < minShared) continue;
    if (required.length > 0 && !required.every((e) => other.effects.includes(e))) continue;
    results.push({ ingredient: other, shared });
  }
  return { target, results };
}

// --- Potion Builder -------------------------------------------------------

export interface PotionResult {
  members: Ingredient[];
  producedEffects: string[];
}

function potionEffectsFromPair(a: Ingredient, b: Ingredient): string[] {
  return intersect(a.effects, b.effects);
}

function potionEffectsFromTriple(
  a: Ingredient,
  b: Ingredient,
  c: Ingredient
): string[] {
  const ab = intersect(a.effects, b.effects);
  const ac = intersect(a.effects, c.effects);
  const bc = intersect(b.effects, c.effects);
  return [...new Set([...ab, ...ac, ...bc])];
}

export function findPotions(
  ingredients: Ingredient[],
  desired: string[]
): PotionResult[] {
  if (desired.length === 0) return [];
  const results: PotionResult[] = [];
  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      const produced = potionEffectsFromPair(ingredients[i], ingredients[j]);
      if (produced.length > 0 && isSuperset(produced, desired)) {
        results.push({
          members: [ingredients[i], ingredients[j]],
          producedEffects: produced,
        });
      }
    }
  }
  if (desired.length >= 2) {
    for (let i = 0; i < ingredients.length; i++) {
      for (let j = i + 1; j < ingredients.length; j++) {
        for (let k = j + 1; k < ingredients.length; k++) {
          const produced = potionEffectsFromTriple(
            ingredients[i],
            ingredients[j],
            ingredients[k]
          );
          if (isSuperset(produced, desired)) {
            results.push({
              members: [ingredients[i], ingredients[j], ingredients[k]],
              producedEffects: produced,
            });
          }
        }
      }
    }
  }
  return results;
}
