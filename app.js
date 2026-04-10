"use strict";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  activeTab: "browse",
  browse: {
    search: "",
    effects: new Set(),
    dlcs: new Set(["Base", "Dawnguard", "Dragonborn", "Hearthfire"]),
    sources: new Set(["plant", "creature", "purchased", "other"]),
    sort: "name",
  },
  similar: {
    ingredient: null,
    minShared: 2,
    requiredEffects: new Set(),
  },
  potion: {
    effects: new Set(),
  },
};

// Populated in init() from window.INGREDIENTS
let ALL_EFFECTS = [];
let EFFECT_TO_INGS = new Map();

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function intersect(a, b) {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

function isSuperset(superArr, subArr) {
  const set = new Set(superArr);
  return subArr.every((x) => set.has(x));
}

// ---------------------------------------------------------------------------
// Index builders
// ---------------------------------------------------------------------------

function buildIndexes(ingredients) {
  const effectSet = new Set();
  const byEffect = new Map();
  for (const ing of ingredients) {
    for (const effect of ing.effects) {
      effectSet.add(effect);
      if (!byEffect.has(effect)) byEffect.set(effect, []);
      byEffect.get(effect).push(ing);
    }
  }
  ALL_EFFECTS = [...effectSet].sort();
  EFFECT_TO_INGS = byEffect;
}

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------

function showTab(tabName) {
  state.activeTab = tabName;
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("active", p.dataset.panel === tabName);
  });
  rerender();
}

// ---------------------------------------------------------------------------
// Browse tab
// ---------------------------------------------------------------------------

function filterBrowse(ingredients, f) {
  let result = ingredients.filter((ing) => {
    if (f.search && !ing.name.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (!f.dlcs.has(ing.dlc)) return false;
    if (!f.sources.has(ing.source)) return false;
    for (const required of f.effects) {
      if (!ing.effects.includes(required)) return false;
    }
    return true;
  });

  const sorters = {
    name:   (a, b) => a.name.localeCompare(b.name),
    value:  (a, b) => b.value - a.value,
    weight: (a, b) => a.weight - b.weight,
    ratio:  (a, b) => (b.value / b.weight) - (a.value / a.weight),
  };
  result.sort(sorters[f.sort] || sorters.name);
  return result;
}

function renderBrowse(results) {
  const el = document.getElementById("browse-results");
  if (results.length === 0) {
    el.innerHTML = '<div class="empty">No ingredients match these filters.</div>';
    return;
  }
  const header = `
    <div class="row header">
      <div>Name</div>
      <div>Effects</div>
      <div>Weight</div>
      <div>Value</div>
      <div>DLC</div>
      <div>Source</div>
    </div>`;
  const rows = results.map((ing) => `
    <div class="row">
      <div class="name">${escapeHtml(ing.name)}</div>
      <div class="pills">${ing.effects.map((e) => `<span class="pill">${escapeHtml(e)}</span>`).join("")}</div>
      <div>${ing.weight}</div>
      <div>${ing.value}</div>
      <div>${escapeHtml(ing.dlc)}</div>
      <div>${escapeHtml(ing.source)}</div>
    </div>`).join("");
  el.innerHTML = header + rows;
}

// ---------------------------------------------------------------------------
// Rerender dispatcher (stub — filled in by later tasks)
// ---------------------------------------------------------------------------

function rerender() {
  if (state.activeTab === "browse") {
    renderBrowse(filterBrowse(window.INGREDIENTS, state.browse));
  } else {
    const containerId = { similar: "similar-results", potion: "potion-results" }[state.activeTab];
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '<div class="empty">Not implemented yet.</div>';
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function populateEffectPickers() {
  const browseEffects = document.getElementById("browse-effects");
  const potionEffects = document.getElementById("potion-effects");
  for (const sel of [browseEffects, potionEffects]) {
    sel.innerHTML = ALL_EFFECTS.map(
      (e) => `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`
    ).join("");
  }
}

function populateIngredientPicker() {
  const sel = document.getElementById("similar-ingredient");
  sel.innerHTML = window.INGREDIENTS
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((ing) => `<option value="${escapeHtml(ing.name)}">${escapeHtml(ing.name)}</option>`)
    .join("");
  state.similar.ingredient = sel.value;
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
}

function bindBrowseControls() {
  document.getElementById("browse-search").addEventListener("input", (e) => {
    state.browse.search = e.target.value;
    rerender();
  });
  document.getElementById("browse-effects").addEventListener("change", (e) => {
    state.browse.effects = new Set(
      [...e.target.selectedOptions].map((o) => o.value)
    );
    rerender();
  });
  document.querySelectorAll(".dlc-filter").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) state.browse.dlcs.add(cb.value);
      else state.browse.dlcs.delete(cb.value);
      rerender();
    });
  });
  document.querySelectorAll(".source-filter").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) state.browse.sources.add(cb.value);
      else state.browse.sources.delete(cb.value);
      rerender();
    });
  });
  document.getElementById("browse-sort").addEventListener("change", (e) => {
    state.browse.sort = e.target.value;
    rerender();
  });
}

function init() {
  if (!window.INGREDIENTS) {
    console.error("data.js did not load");
    return;
  }
  buildIndexes(window.INGREDIENTS);
  populateEffectPickers();
  populateIngredientPicker();
  bindTabs();
  bindBrowseControls();
  rerender();
}

document.addEventListener("DOMContentLoaded", init);
