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
// Rerender dispatcher (stub — filled in by later tasks)
// ---------------------------------------------------------------------------

function rerender() {
  const containerId = {
    browse: "browse-results",
    similar: "similar-results",
    potion: "potion-results",
  }[state.activeTab];
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '<div class="empty">Not implemented yet.</div>';
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

function init() {
  if (!window.INGREDIENTS) {
    console.error("data.js did not load");
    return;
  }
  buildIndexes(window.INGREDIENTS);
  populateEffectPickers();
  populateIngredientPicker();
  bindTabs();
  rerender();
}

document.addEventListener("DOMContentLoaded", init);
