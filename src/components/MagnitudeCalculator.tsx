import { createSignal, createMemo, For, Show } from 'solid-js';
import type { Enchantment, SoulGem } from '../lib/types';
import { calculateMagnitude } from '../lib/enchanting-filters';

interface Props {
  enchantments: Enchantment[];
  gems: SoulGem[];
}

interface CalcResult {
  isFixed: boolean;
  value: number | null;
  enc: Enchantment;
  skillFactor: number;
  perkFactor: number;
  gem: SoulGem;
  fortifyFactor: number;
}

export default function MagnitudeCalculator(props: Props) {
  const sortedEnchantments = createMemo(() =>
    [...props.enchantments].sort((a, b) => a.name.localeCompare(b.name))
  );

  const defaultGemIndex = createMemo(() => {
    const idx = props.gems.findIndex((g) => g.name === 'Grand');
    return idx >= 0 ? idx : Math.min(4, props.gems.length - 1);
  });

  const [selectedName, setSelectedName] = createSignal('');
  const [skill, setSkill] = createSignal(100);
  const [gemIndex, setGemIndex] = createSignal(defaultGemIndex());
  const [perkRanks, setPerkRanks] = createSignal(5);
  const [fortifyPct, setFortifyPct] = createSignal(0);

  const selectedEnchantment = createMemo(() =>
    props.enchantments.find((e) => e.name === selectedName()) ?? null
  );

  const selectedGem = createMemo(() => props.gems[gemIndex()] ?? props.gems[0]);

  const result = createMemo((): CalcResult | null => {
    const enc = selectedEnchantment();
    if (!enc) return null;

    const gem = selectedGem();
    const skillFactor = 1 + skill() / 100;
    const perkFactor = 1 + perkRanks() * 0.2;
    const fortifyFactor = 1 + fortifyPct() / 100;

    if (enc.baseMagnitude === null) {
      return { isFixed: true, value: null, enc, skillFactor, perkFactor, gem, fortifyFactor };
    }

    const value = calculateMagnitude(
      enc.baseMagnitude,
      skill(),
      gem.magnitudeMultiplier,
      perkRanks(),
      fortifyPct() / 100
    );

    return { isFixed: false, value, enc, skillFactor, perkFactor, gem, fortifyFactor };
  });

  return (
    <section class="panel active">
      <div class="calc-panel">
        <div class="filters-row" style="flex-wrap: wrap; gap: 1rem;">
          <label class="calc-field field">
            Enchantment
            <select
              value={selectedName()}
              onChange={(e) => setSelectedName(e.currentTarget.value)}
            >
              <option value="">Select enchantment…</option>
              <For each={sortedEnchantments()}>
                {(enc) => <option value={enc.name}>{enc.name}</option>}
              </For>
            </select>
          </label>

          <label class="calc-field field">
            Soul Gem
            <select
              value={gemIndex()}
              onChange={(e) => setGemIndex(Number(e.currentTarget.value))}
            >
              <For each={props.gems}>
                {(gem, i) => (
                  <option value={i()}>
                    {gem.name} ({(gem.magnitudeMultiplier * 100).toFixed(0)}%)
                  </option>
                )}
              </For>
            </select>
          </label>

          <label class="calc-field field">
            Enchanting Skill — {skill()}
            <input
              type="range"
              min="0"
              max="100"
              value={skill()}
              onInput={(e) => setSkill(Number(e.currentTarget.value))}
              style="min-width: 160px;"
            />
          </label>

          <label class="calc-field field">
            Enchanter Perk Ranks (0–5)
            <input
              type="number"
              min="0"
              max="5"
              value={perkRanks()}
              onInput={(e) => setPerkRanks(Math.min(5, Math.max(0, Number(e.currentTarget.value))))}
              style="max-width: 80px;"
            />
          </label>

          <label class="calc-field field">
            Fortify Enchanting Bonus (%)
            <input
              type="number"
              min="0"
              max="100"
              value={fortifyPct()}
              onInput={(e) => setFortifyPct(Math.min(100, Math.max(0, Number(e.currentTarget.value))))}
              style="max-width: 80px;"
            />
          </label>
        </div>

        <div class="calc-result">
          <Show when={result()} keyed fallback={
            <span style="color: var(--text-muted); font-size: 0.9rem;">Select an enchantment above.</span>
          }>
            {(r) => (
              <Show
                when={!r.isFixed}
                fallback={
                  <span style="color: var(--text-muted); font-size: 0.9rem;">
                    Fixed effect — magnitude does not vary with skill or soul gem.
                  </span>
                }
              >
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">
                  {r.value}{r.enc.magnitudeUnit ?? ''}
                </div>
                <div class="calc-formula">
                  Base: {r.enc.baseMagnitude}
                  {'  ×  '}Skill factor: {r.skillFactor.toFixed(2)}
                  {'  ×  '}Perk bonus: {r.perkFactor.toFixed(2)}
                  {'  ×  '}Soul gem: {(r.gem.magnitudeMultiplier * 100).toFixed(0)}%
                  {'  ×  '}Fortify bonus: {r.fortifyFactor.toFixed(2)}
                  {'  =  '}Result: {r.value}
                </div>
              </Show>
            )}
          </Show>
        </div>
      </div>
    </section>
  );
}
