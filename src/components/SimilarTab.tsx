import { createSignal, createMemo, For, Show } from 'solid-js';
import type { Ingredient, SortState } from '../lib/types';
import { findSimilar, sortBy } from '../lib/filters';

type SortKey = 'shared' | 'name' | 'weight' | 'value' | 'dlc' | 'source';

interface Props {
  ingredients: Ingredient[];
}

interface SortableRow {
  ingredient: Ingredient;
  shared: string[];
}

export default function SimilarTab(props: Props) {
  const sorted = [...props.ingredients].sort((a, b) => a.name.localeCompare(b.name));
  const [targetName, setTargetName] = createSignal<string>(sorted[0]?.name ?? '');
  const [minShared, setMinShared] = createSignal<number>(2);
  const [requiredEffects, setRequiredEffects] = createSignal(new Set<string>());
  const [sort, setSort] = createSignal<SortState<SortKey>>({ key: 'shared', dir: 'desc' });

  const target = createMemo(() =>
    props.ingredients.find((i) => i.name === targetName()) ?? null
  );

  const output = createMemo(() =>
    findSimilar(props.ingredients, targetName(), minShared(), requiredEffects())
  );

  const sortedResults = createMemo(() => {
    const s = sort();
    const arr = output().results;
    const getter = (r: SortableRow): number | string => {
      if (s.key === 'shared') return r.shared.length;
      return r.ingredient[s.key] as number | string;
    };
    return sortBy(arr, getter, s.dir);
  });

  function toggleSort(key: SortKey) {
    const current = sort();
    if (current.key === key) {
      setSort({ key, dir: current.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ key, dir: key === 'shared' ? 'desc' : 'asc' });
    }
  }

  function sortIndicator(key: SortKey) {
    const s = sort();
    if (s.key !== key) return '';
    return s.dir === 'asc' ? ' ▲' : ' ▼';
  }

  function onTargetChange(name: string) {
    setTargetName(name);
    setRequiredEffects(new Set<string>());
  }

  function toggleRequiredEffect(effect: string, checked: boolean) {
    const next = new Set(requiredEffects());
    if (checked) next.add(effect);
    else next.delete(effect);
    setRequiredEffects(next);
  }

  return (
    <section class="panel active">
      <div class="filters">
        <label>
          Ingredient
          <select value={targetName()} onChange={(e) => onTargetChange(e.currentTarget.value)}>
            <For each={sorted}>{(ing) => <option value={ing.name}>{ing.name}</option>}</For>
          </select>
        </label>
        <label>
          Min shared effects
          <select
            value={minShared()}
            onChange={(e) => setMinShared(parseInt(e.currentTarget.value, 10))}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <fieldset>
          <legend>
            <Show when={target()} fallback={<>Require effect(s)</>}>
              {(t) => <>Require effect(s) of {t().name}</>}
            </Show>
          </legend>
          <Show when={target()}>
            {(t) => (
              <For each={t().effects}>
                {(eff) => (
                  <label>
                    <input
                      type="checkbox"
                      checked={requiredEffects().has(eff)}
                      onChange={(e) => toggleRequiredEffect(eff, e.currentTarget.checked)}
                    />
                    {' '}{eff}
                  </label>
                )}
              </For>
            )}
          </Show>
        </fieldset>
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
          <div
            data-sortable
            classList={{ active: sort().key === 'shared' }}
            onClick={() => toggleSort('shared')}
          >
            Effects (shared count){sortIndicator('shared')}
          </div>
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
          each={sortedResults()}
          fallback={<div class="empty">No ingredients match.</div>}
        >
          {(row) => {
            const sharedSet = new Set(row.shared);
            return (
              <div class="row">
                <div class="name">{row.ingredient.name}</div>
                <div class="pills">
                  <For each={row.ingredient.effects}>
                    {(e) => (
                      <span class={`pill${sharedSet.has(e) ? ' match' : ''}`}>{e}</span>
                    )}
                  </For>
                </div>
                <div>{row.ingredient.weight}</div>
                <div>{row.ingredient.value}</div>
                <div>{row.ingredient.dlc}</div>
                <div>{row.ingredient.source}</div>
              </div>
            );
          }}
        </For>
      </div>
      <div class="status">
        <span>
          {sortedResults().length} ingredient{sortedResults().length === 1 ? '' : 's'} share ≥{minShared()} effect{minShared() === 1 ? '' : 's'} with {target()?.name ?? '—'}
        </span>
        <span class="dot">·</span>
        <span>Click a header to sort</span>
      </div>
    </section>
  );
}
