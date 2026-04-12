import { createSignal, For, Show } from 'solid-js';
import type { SoulGem } from '../lib/types';

interface Props {
  gems: SoulGem[];
}

export default function SoulGemReference(props: Props) {
  const [open, setOpen] = createSignal(false);

  return (
    <div class="gem-ref-panel" style="margin-top: 1rem;">
      <button
        type="button"
        class="gem-ref-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        Soul Gem Reference {open() ? '▾' : '▸'}
      </button>

      <Show when={open()}>
        <div class="results" style="margin-top: 0.5rem;">
          <div class="row header soul-gem-row">
            <div>Gem</div>
            <div>Max Creature Level</div>
            <div>Magnitude Multiplier</div>
            <div>Notes</div>
          </div>
          <For each={props.gems}>
            {(gem) => (
              <div class="row soul-gem-row">
                <div class="name">{gem.name}</div>
                <div>{gem.maxSoulLevel}</div>
                <div>{(gem.magnitudeMultiplier * 100).toFixed(0)}%</div>
                <div style="color: var(--text-muted);">{gem.note ?? '—'}</div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
