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
