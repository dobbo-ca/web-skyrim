import { createSignal, Show } from 'solid-js';
import ingredientsJson from '../data/ingredients.json';
import type { Ingredient } from '../lib/types';
import BrowseTab from './BrowseTab';
import SimilarTab from './SimilarTab';
import PotionTab from './PotionTab';

const INGREDIENTS = ingredientsJson as Ingredient[];

type TabName = 'browse' | 'similar' | 'potion';

export default function App() {
  const [tab, setTab] = createSignal<TabName>('browse');

  return (
    <>
      <header>
        <h1>Skyrim Alchemy</h1>
        <nav class="tabs" role="tablist">
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
      </header>
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
