import { createSignal, createMemo, For } from 'solid-js';
import type { Ingredient, SortState } from '../lib/types';
import { findPotions, sortBy } from '../lib/filters';

type SortKey = 'count' | 'names';

function allEffects(ingredients: Ingredient[]): string[] {
  const set = new Set<string>();
  for (const ing of ingredients) for (const e of ing.effects) set.add(e);
  return [...set].sort();
}

interface Props {
  ingredients: Ingredient[];
}

interface SortableRow {
  members: Ingredient[];
  producedEffects: string[];
}

export default function PotionTab(props: Props) {
  const [desired, setDesired] = createSignal(new Set<string>());
  const [sort, setSort] = createSignal<SortState<SortKey>>({ key: 'count', dir: 'desc' });
  const effectOptions = allEffects(props.ingredients);

  const results = createMemo<SortableRow[]>(() => {
    const arr = findPotions(props.ingredients, [...desired()]);
    const s = sort();
    const getter = (r: SortableRow): number | string => {
      if (s.key === 'count') return r.producedEffects.length;
      return r.members.map((m) => m.name).join(' + ');
    };
    return sortBy(arr, getter, s.dir);
  });

  function toggleSort(key: SortKey) {
    const current = sort();
    if (current.key === key) {
      setSort({ key, dir: current.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ key, dir: key === 'count' ? 'desc' : 'asc' });
    }
  }

  function sortIndicator(key: SortKey) {
    const s = sort();
    if (s.key !== key) return '';
    return s.dir === 'asc' ? ' ▲' : ' ▼';
  }

  function onEffectChange(e: Event & { currentTarget: HTMLSelectElement }) {
    const selected = [...e.currentTarget.selectedOptions].map((o) => o.value).slice(0, 3);
    setDesired(new Set(selected));
  }

  return (
    <section class="panel active">
      <div class="filters">
        <label>
          Desired effects (pick 1–3)
          <select multiple size="10" onChange={onEffectChange}>
            <For each={effectOptions}>{(eff) => <option value={eff}>{eff}</option>}</For>
          </select>
        </label>
      </div>

      <div class="results">
        <div class="row header sortable potion">
          <div
            data-sortable
            classList={{ active: sort().key === 'names' }}
            onClick={() => toggleSort('names')}
          >
            Ingredients{sortIndicator('names')}
          </div>
          <div>Produced effects (requested highlighted)</div>
          <div
            data-sortable
            classList={{ active: sort().key === 'count' }}
            onClick={() => toggleSort('count')}
          >
            Count{sortIndicator('count')}
          </div>
        </div>
        <For
          each={results()}
          fallback={
            <div class="empty">
              {desired().size === 0
                ? 'Pick 1–3 effects to search.'
                : 'No ingredient combinations produce all of those effects together.'}
            </div>
          }
        >
          {(row) => {
            const desiredSet = desired();
            return (
              <div class="row potion">
                <div class="name">{row.members.map((m) => m.name).join(' + ')}</div>
                <div class="pills">
                  <For each={row.producedEffects}>
                    {(e) => (
                      <span class={`pill${desiredSet.has(e) ? ' match' : ''}`}>{e}</span>
                    )}
                  </For>
                </div>
                <div>
                  {row.producedEffects.length} effect{row.producedEffects.length === 1 ? '' : 's'}
                </div>
              </div>
            );
          }}
        </For>
      </div>
      <div class="status">
        <span>
          {desired().size === 0
            ? 'Pick 1–3 effects to start building'
            : `${results().length} combination${results().length === 1 ? '' : 's'} produce all selected effects`}
        </span>
        <span class="dot">·</span>
        <span>Hold ⌘/Ctrl to multi-select effects</span>
      </div>
    </section>
  );
}
