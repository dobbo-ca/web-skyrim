import { createSignal, Show } from 'solid-js';
import ingredientsJson from '../data/ingredients.json';
import type { Ingredient } from '../lib/types';
import BrowseTab from './BrowseTab';
import SimilarTab from './SimilarTab';
import PotionTab from './PotionTab';

const INGREDIENTS = ingredientsJson as Ingredient[];

// Top-level sections. Room to grow: enchanting, smithing, quests, …
type Section = 'alchemy';
type AlchemyTab = 'browse' | 'similar' | 'potion';

export default function App() {
  const [section, setSection] = createSignal<Section>('alchemy');
  const [alchemyTab, setAlchemyTab] = createSignal<AlchemyTab>('browse');

  return (
    <>
      <header>
        <h1>
          <span class="brand-mark">⚔</span>Skyrim
        </h1>
        <nav class="tabs" role="tablist" aria-label="Sections">
          <button
            class={`tab ${section() === 'alchemy' ? 'active' : ''}`}
            onClick={() => setSection('alchemy')}
          >
            Alchemy
          </button>
        </nav>
      </header>
      <main>
        <Show when={section() === 'alchemy'}>
          <nav class="tabs subtabs" role="tablist" aria-label="Alchemy views">
            <button
              class={`tab ${alchemyTab() === 'browse' ? 'active' : ''}`}
              onClick={() => setAlchemyTab('browse')}
            >
              Browse
            </button>
            <button
              class={`tab ${alchemyTab() === 'similar' ? 'active' : ''}`}
              onClick={() => setAlchemyTab('similar')}
            >
              Similar To
            </button>
            <button
              class={`tab ${alchemyTab() === 'potion' ? 'active' : ''}`}
              onClick={() => setAlchemyTab('potion')}
            >
              Potion Builder
            </button>
          </nav>
          <Show when={alchemyTab() === 'browse'}>
            <BrowseTab ingredients={INGREDIENTS} />
          </Show>
          <Show when={alchemyTab() === 'similar'}>
            <SimilarTab ingredients={INGREDIENTS} />
          </Show>
          <Show when={alchemyTab() === 'potion'}>
            <PotionTab ingredients={INGREDIENTS} />
          </Show>
        </Show>
      </main>
    </>
  );
}
