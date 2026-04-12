export type Dlc = 'Base' | 'Dawnguard' | 'Dragonborn' | 'Hearthfire';
export type Source = 'plant' | 'creature' | 'purchased' | 'other';

export interface Ingredient {
  name: string;
  effects: string[];
  weight: number;
  value: number;
  location: string;
  dlc: Dlc;
  source: Source;
}

export type SortDir = 'asc' | 'desc';

export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

export type EnchantCategory = 'armor' | 'weapon' | 'shield';
export type EnchantSlot = 'head' | 'body' | 'gloves' | 'boots' | 'ring' | 'necklace' | 'weapon' | 'shield';

export interface DisenchantSource {
  item: string;
  location: string;
  guaranteed: boolean;
}

export interface Enchantment {
  name: string;
  category: EnchantCategory;
  slots: EnchantSlot[];
  baseMagnitude: number | null;
  magnitudeUnit: string | null;
  description: string;
  school: string | null;
  dlc: Dlc;
  disenchantSources: DisenchantSource[];
}

export interface SoulGem {
  name: string;
  maxSoulLevel: number;
  magnitudeMultiplier: number;
  note?: string;
}
