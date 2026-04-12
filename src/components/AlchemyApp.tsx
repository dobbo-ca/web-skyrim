import { createSignal, Show } from 'solid-js';
import ingredientsJson from '../data/ingredients.json';
import type { Ingredient } from '../lib/types';
import BrowseTab from './BrowseTab';
import SimilarTab from './SimilarTab';
import PotionTab from './PotionTab';

const INGREDIENTS = ingredientsJson as Ingredient[];

type AlchemyTab = 'browse' | 'similar' | 'potion';

export default function AlchemyApp() {
  const [tab, setTab] = createSignal<AlchemyTab>('browse');

  return (
    <>
      <nav class="tabs" role="tablist" aria-label="Alchemy views">
        <button
          class={`tab ${tab() === 'browse' ? 'active' : ''}`}
          onClick={() => setTab('browse')}
        >
          Browse
        </button>
        <button
          class={`tab ${tab() === 'similar' ? 'active' : ''}`}
          onClick={() => setTab('similar')}
        >
          Similar To
        </button>
        <button
          class={`tab ${tab() === 'potion' ? 'active' : ''}`}
          onClick={() => setTab('potion')}
        >
          Potion Builder
        </button>
      </nav>
      <main>
        <Show when={tab() === 'browse'}>
          <BrowseTab ingredients={INGREDIENTS} />
        </Show>
        <Show when={tab() === 'similar'}>
          <SimilarTab ingredients={INGREDIENTS} />
        </Show>
        <Show when={tab() === 'potion'}>
          <PotionTab ingredients={INGREDIENTS} />
        </Show>
      </main>
    </>
  );
}
