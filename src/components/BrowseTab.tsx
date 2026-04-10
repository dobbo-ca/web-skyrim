import { createSignal, createMemo, For, onCleanup, onMount } from 'solid-js';
import type { Ingredient, SortState } from '../lib/types';
import { filterBrowse, sortBy } from '../lib/filters';

type SortKey = 'name' | 'weight' | 'value' | 'dlc' | 'source';

const DLCS = ['Base', 'Dawnguard', 'Dragonborn', 'Hearthfire'] as const;
const SOURCES = ['plant', 'creature', 'purchased', 'other'] as const;

function allEffects(ingredients: Ingredient[]): string[] {
  const set = new Set<string>();
  for (const ing of ingredients) for (const e of ing.effects) set.add(e);
  return [...set].sort();
}

interface Props {
  ingredients: Ingredient[];
}

export default function BrowseTab(props: Props) {
  const [search, setSearch] = createSignal('');
  const [effects, setEffects] = createSignal(new Set<string>());
  const [dlcs, setDlcs] = createSignal<Set<string>>(new Set(DLCS));
  const [sources, setSources] = createSignal<Set<string>>(new Set(SOURCES));
  const [sort, setSort] = createSignal<SortState<SortKey>>({ key: 'name', dir: 'asc' });

  let searchInput: HTMLInputElement | undefined;

  const effectOptions = allEffects(props.ingredients);

  onMount(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
        e.preventDefault();
        searchInput?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    onCleanup(() => document.removeEventListener('keydown', onKey));
  });

  const filtered = createMemo(() => {
    const result = filterBrowse(props.ingredients, {
      search: search(),
      effects: effects(),
      dlcs: dlcs(),
      sources: sources(),
    });
    const s = sort();
    const getter = (ing: Ingredient): number | string => ing[s.key] as number | string;
    return sortBy(result, getter, s.dir);
  });

  function toggleSort(key: SortKey) {
    const current = sort();
    if (current.key === key) {
      setSort({ key, dir: current.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ key, dir: 'asc' });
    }
  }

  function sortIndicator(key: SortKey) {
    const s = sort();
    if (s.key !== key) return '';
    return s.dir === 'asc' ? ' ▲' : ' ▼';
  }

  function toggleSetValue(
    getter: () => Set<string>,
    setter: (s: Set<string>) => void,
    value: string,
    checked: boolean
  ) {
    const next = new Set(getter());
    if (checked) next.add(value);
    else next.delete(value);
    setter(next);
  }

  return (
    <section class="panel active">
      <div class="filters">
        <div class="filters-row">
          <label class="field">
            Search
            <input
              ref={searchInput}
              type="search"
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
              placeholder="name…  ( / to focus )"
            />
          </label>
          <label class="field">
            Effects (AND)
            <select
              multiple
              size="6"
              onChange={(e) => {
                const selected = [...e.currentTarget.selectedOptions].map((o) => o.value);
                setEffects(new Set(selected));
              }}
            >
              <For each={effectOptions}>{(eff) => <option value={eff}>{eff}</option>}</For>
            </select>
          </label>
        </div>
        <div class="filters-row">
          <div class="chip-row">
            <span class="chip-row-label">DLC</span>
            <For each={DLCS}>
              {(d) => (
                <button
                  type="button"
                  class="chip-toggle"
                  classList={{ active: dlcs().has(d) }}
                  onClick={() => toggleSetValue(dlcs, setDlcs, d, !dlcs().has(d))}
                >
                  {d}
                </button>
              )}
            </For>
          </div>
          <div class="chip-row">
            <span class="chip-row-label">Source</span>
            <For each={SOURCES}>
              {(s) => (
                <button
                  type="button"
                  class="chip-toggle"
                  classList={{ active: sources().has(s) }}
                  onClick={() => toggleSetValue(sources, setSources, s, !sources().has(s))}
                >
                  {s}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>

      <div class="results">
        <div class="row header sortable">
          <div
            data-sortable
            classList={{ active: sort().key === 'name' }}
            onClick={() => toggleSort('name')}
          >
            Name{sortIndicator('name')}
          </div>
          <div>Effects</div>
          <div
            data-sortable
            classList={{ active: sort().key === 'weight' }}
            onClick={() => toggleSort('weight')}
          >
            Weight{sortIndicator('weight')}
          </div>
          <div
            data-sortable
            classList={{ active: sort().key === 'value' }}
            onClick={() => toggleSort('value')}
          >
            Value{sortIndicator('value')}
          </div>
          <div
            data-sortable
            classList={{ active: sort().key === 'dlc' }}
            onClick={() => toggleSort('dlc')}
          >
            DLC{sortIndicator('dlc')}
          </div>
          <div
            data-sortable
            classList={{ active: sort().key === 'source' }}
            onClick={() => toggleSort('source')}
          >
            Source{sortIndicator('source')}
          </div>
        </div>
        <For
          each={filtered()}
          fallback={<div class="empty">No ingredients match these filters.</div>}
        >
          {(ing) => (
            <div class="row">
              <div class="name">{ing.name}</div>
              <div class="pills">
                <For each={ing.effects}>{(e) => <span class="pill">{e}</span>}</For>
              </div>
              <div>{ing.weight}</div>
              <div>{ing.value}</div>
              <div>{ing.dlc}</div>
              <div>{ing.source}</div>
            </div>
          )}
        </For>
      </div>
      <div class="status">
        <span>Showing {filtered().length} of {props.ingredients.length} ingredients</span>
        <span class="dot">·</span>
        <span>Click a header to sort</span>
        <span class="dot">·</span>
        <span><kbd>/</kbd> to search</span>
      </div>
    </section>
  );
}
