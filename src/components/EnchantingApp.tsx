import { createSignal, Show } from 'solid-js';
import enchantmentsJson from '../data/enchantments.json';
import soulGemsJson from '../data/soul-gems.json';
import type { Enchantment, SoulGem } from '../lib/types';
import EnchantBrowser from './EnchantBrowser';
import DisenchantFinder from './DisenchantFinder';
import SoulGemReference from './SoulGemReference';
import MagnitudeCalculator from './MagnitudeCalculator';

const ENCHANTMENTS = enchantmentsJson as Enchantment[];
const SOUL_GEMS = soulGemsJson as SoulGem[];

type EnchantTab = 'browse' | 'disenchant' | 'calculator';

export default function EnchantingApp() {
  const [tab, setTab] = createSignal<EnchantTab>('browse');

  return (
    <>
      <nav class="tabs" role="tablist" aria-label="Enchanting views">
        <button
          class="tab"
          classList={{ active: tab() === 'browse' }}
          onClick={() => setTab('browse')}
        >
          Browse
        </button>
        <button
          class="tab"
          classList={{ active: tab() === 'disenchant' }}
          onClick={() => setTab('disenchant')}
        >
          Disenchant
        </button>
        <button
          class="tab"
          classList={{ active: tab() === 'calculator' }}
          onClick={() => setTab('calculator')}
        >
          Calculator
        </button>
      </nav>
      <main>
        <Show when={tab() === 'browse'}>
          <EnchantBrowser enchantments={ENCHANTMENTS} />
        </Show>
        <Show when={tab() === 'disenchant'}>
          <DisenchantFinder enchantments={ENCHANTMENTS} />
        </Show>
        <Show when={tab() === 'calculator'}>
          <MagnitudeCalculator enchantments={ENCHANTMENTS} gems={SOUL_GEMS} />
          <SoulGemReference gems={SOUL_GEMS} />
        </Show>
      </main>
    </>
  );
}
