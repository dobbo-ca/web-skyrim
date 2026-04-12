import { createSignal, createMemo, For, Show } from 'solid-js';
import type { Enchantment } from '../lib/types';

interface Props {
  enchantments: Enchantment[];
}

export default function DisenchantFinder(props: Props) {
  const [selectedName, setSelectedName] = createSignal('');

  const sortedNames = createMemo(() =>
    [...props.enchantments].map((e) => e.name).sort((a, b) => a.localeCompare(b))
  );

  const selected = createMemo(() =>
    props.enchantments.find((e) => e.name === selectedName()) ?? null
  );

  const isGenericOnly = createMemo(() => {
    const enc = selected();
    if (!enc) return false;
    return enc.disenchantSources.every((s) => !s.guaranteed);
  });

  return (
    <section class="panel active">
      <div class="filters">
        <div class="filters-row">
          <label class="field">
            Enchantment
            <select
              value={selectedName()}
              onChange={(e) => setSelectedName(e.currentTarget.value)}
            >
              <option value="">Select an enchantment…</option>
              <For each={sortedNames()}>
                {(name) => <option value={name}>{name}</option>}
              </For>
            </select>
          </label>
        </div>
      </div>

      <Show when={selected()} keyed>
        {(enc) => (
          <div>
            <div class="filters" style="margin-bottom: 1rem;">
              <div style="font-weight: 600; font-size: 1rem; color: var(--text); margin-bottom: 0.25rem;">
                {enc.name}
              </div>
              <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">
                {enc.description}
              </div>
              <div class="pills">
                <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 500; margin-right: 0.4rem; align-self: center;">
                  Applicable slots:
                </span>
                <For each={enc.slots}>{(s) => <span class="pill">{s}</span>}</For>
              </div>
            </div>

            <Show
              when={!isGenericOnly()}
              fallback={
                <div class="empty" style="text-align: left; font-style: normal; color: var(--text-muted); padding: 1rem; background: var(--bg); border: 1px solid var(--border-muted); border-radius: var(--radius);">
                  This enchantment is commonly found on random enchanted loot, merchants, and leveled lists.
                </div>
              }
            >
              <div class="results">
                <div class="row header enchant-source-row">
                  <div>Item</div>
                  <div>Location</div>
                  <div>Guaranteed?</div>
                </div>
                <For
                  each={enc.disenchantSources}
                  fallback={<div class="empty">No sources recorded.</div>}
                >
                  {(src) => (
                    <div class="row enchant-source-row">
                      <div class="name">{src.item}</div>
                      <div style="color: var(--text-muted);">{src.location}</div>
                      <div>
                        <Show
                          when={src.guaranteed}
                          fallback={<span class="badge-varies">? May vary</span>}
                        >
                          <span class="badge-guaranteed">✓ Guaranteed</span>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <div class="status">
              <span>{enc.disenchantSources.length} source(s) for this enchantment</span>
            </div>
          </div>
        )}
      </Show>
    </section>
  );
}
