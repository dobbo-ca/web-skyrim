import { createSignal, createMemo, For, onCleanup, onMount } from 'solid-js';
import type { Enchantment, SortState } from '../lib/types';
import { filterEnchantments } from '../lib/enchanting-filters';
import { sortBy } from '../lib/filters';

type SortKey = 'name' | 'magnitude' | 'school' | 'dlc';

const CATEGORIES = ['armor', 'weapon'] as const;
const SLOTS = ['head', 'body', 'gloves', 'boots', 'ring', 'necklace', 'weapon', 'shield'] as const;
const DLCS = ['Base', 'Dawnguard', 'Dragonborn'] as const;

interface Props {
  enchantments: Enchantment[];
}

export default function EnchantBrowser(props: Props) {
  const [search, setSearch] = createSignal('');
  const [categories, setCategories] = createSignal<Set<string>>(new Set(CATEGORIES));
  const [slots, setSlots] = createSignal<Set<string>>(new Set());
  const [dlcs, setDlcs] = createSignal<Set<string>>(new Set(DLCS));
  const [sort, setSort] = createSignal<SortState<SortKey>>({ key: 'name', dir: 'asc' });

  let searchInput: HTMLInputElement | undefined;

  onMount(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInput?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    onCleanup(() => document.removeEventListener('keydown', onKey));
  });

  const filtered = createMemo(() => {
    const result = filterEnchantments(props.enchantments, {
      search: search(),
      categories: categories(),
      slots: slots(),
      dlcs: dlcs(),
    });
    const s = sort();
    const getter = (e: Enchantment): number | string => {
      if (s.key === 'name') return e.name;
      if (s.key === 'magnitude') return e.baseMagnitude ?? -1;
      if (s.key === 'school') return e.school ?? '';
      if (s.key === 'dlc') return e.dlc;
      return e.name;
    };
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

  function magnitudeDisplay(e: Enchantment) {
    if (e.baseMagnitude === null) return 'Fixed';
    return `${e.baseMagnitude}${e.magnitudeUnit ?? ''}`;
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
              placeholder="name or description…  ( / to focus )"
            />
          </label>
        </div>
        <div class="filters-row">
          <div class="chip-row">
            <span class="chip-row-label">Category</span>
            <For each={CATEGORIES}>
              {(c) => (
                <button
                  type="button"
                  class="chip-toggle"
                  classList={{ active: categories().has(c) }}
                  onClick={() => toggleSetValue(categories, setCategories, c, !categories().has(c))}
                >
                  {c}
                </button>
              )}
            </For>
          </div>
          <div class="chip-row">
            <span class="chip-row-label">Slot</span>
            <For each={SLOTS}>
              {(s) => (
                <button
                  type="button"
                  class="chip-toggle"
                  classList={{ active: slots().has(s) }}
                  onClick={() => toggleSetValue(slots, setSlots, s, !slots().has(s))}
                >
                  {s}
                </button>
              )}
            </For>
          </div>
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
        </div>
      </div>

      <div class="results">
        <div class="row header sortable enchant-row">
          <div
            data-sortable
            classList={{ active: sort().key === 'name' }}
            onClick={() => toggleSort('name')}
          >
            Name{sortIndicator('name')}
          </div>
          <div>Slots</div>
          <div
            data-sortable
            classList={{ active: sort().key === 'magnitude' }}
            onClick={() => toggleSort('magnitude')}
          >
            Magnitude{sortIndicator('magnitude')}
          </div>
          <div
            data-sortable
            classList={{ active: sort().key === 'school' }}
            onClick={() => toggleSort('school')}
          >
            School{sortIndicator('school')}
          </div>
          <div
            data-sortable
            classList={{ active: sort().key === 'dlc' }}
            onClick={() => toggleSort('dlc')}
          >
            DLC{sortIndicator('dlc')}
          </div>
        </div>
        <For
          each={filtered()}
          fallback={<div class="empty">No enchantments match these filters.</div>}
        >
          {(enc) => (
            <div class="row enchant-row">
              <div class="name">{enc.name}</div>
              <div class="pills">
                <For each={enc.slots}>{(s) => <span class="pill">{s}</span>}</For>
              </div>
              <div>{magnitudeDisplay(enc)}</div>
              <div>{enc.school ?? '—'}</div>
              <div>{enc.dlc}</div>
            </div>
          )}
        </For>
      </div>
      <div class="status">
        <span>Showing {filtered().length} of {props.enchantments.length} enchantments</span>
        <span class="dot">·</span>
        <span>Click a header to sort</span>
        <span class="dot">·</span>
        <span><kbd>/</kbd> to search</span>
      </div>
    </section>
  );
}
