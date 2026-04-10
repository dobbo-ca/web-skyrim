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
// Similar To tab
// ---------------------------------------------------------------------------

function findSimilar(ingredients, targetName, minShared, requiredEffects) {
  const target = ingredients.find((ing) => ing.name === targetName);
  if (!target) return { target: null, results: [] };
  const required = [...requiredEffects];
  const results = [];
  for (const other of ingredients) {
    if (other.name === target.name) continue;
    const shared = intersect(target.effects, other.effects);
    if (shared.length < minShared) continue;
    if (required.length > 0 && !required.every((e) => other.effects.includes(e))) continue;
    results.push({ ingredient: other, shared });
  }
  results.sort((a, b) => b.shared.length - a.shared.length);
  return { target, results };
}

function renderSimilar(output) {
  const el = document.getElementById("similar-results");
  if (!output || !output.target) {
    el.innerHTML = '<div class="empty">Pick an ingredient.</div>';
    return;
  }
  const { target, results } = output;
  if (results.length === 0) {
    const req = [...state.similar.requiredEffects];
    const reqNote = req.length > 0 ? ` and all of: ${req.join(", ")}` : "";
    el.innerHTML = `<div class="empty">Nothing shares ${escapeHtml(String(state.similar.minShared))}+ effects with ${escapeHtml(target.name)}${escapeHtml(reqNote)}.</div>`;
    return;
  }
  const rows = results.map(({ ingredient, shared }) => {
    const matchSet = new Set(shared);
    const pills = ingredient.effects
      .map((e) => `<span class="pill${matchSet.has(e) ? " match" : ""}">${escapeHtml(e)}</span>`)
      .join("");
    return `
      <div class="row">
        <div class="name">${escapeHtml(ingredient.name)}</div>
        <div class="pills">${pills}</div>
        <div>${ingredient.weight}</div>
        <div>${ingredient.value}</div>
        <div>${escapeHtml(ingredient.dlc)}</div>
        <div>${escapeHtml(ingredient.source)}</div>
      </div>`;
  }).join("");
  el.innerHTML = `
    <div class="row header">
      <div>Name</div>
      <div>Effects (shared highlighted)</div>
      <div>Weight</div>
      <div>Value</div>
      <div>DLC</div>
      <div>Source</div>
    </div>
    ${rows}`;
}

function refreshSimilarTargetEffects() {
  const fieldset = document.getElementById("similar-target-effects");
  const target = window.INGREDIENTS.find((i) => i.name === state.similar.ingredient);
  if (!target) {
    fieldset.innerHTML = "<legend>Require effect(s)</legend>";
    return;
  }
  const boxes = target.effects
    .map(
      (e) => `<label><input type="checkbox" class="similar-target-effect" value="${escapeHtml(e)}"> ${escapeHtml(e)}</label>`
    )
    .join("");
  fieldset.innerHTML = `<legend>Require effect(s) of ${escapeHtml(target.name)}</legend>${boxes}`;
  fieldset.querySelectorAll(".similar-target-effect").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) state.similar.requiredEffects.add(cb.value);
      else state.similar.requiredEffects.delete(cb.value);
      rerender();
    });
  });
}

// ---------------------------------------------------------------------------
// Rerender dispatcher (stub — filled in by later tasks)
// ---------------------------------------------------------------------------

function rerender() {
  if (state.activeTab === "browse") {
    renderBrowse(filterBrowse(window.INGREDIENTS, state.browse));
  } else if (state.activeTab === "similar") {
    renderSimilar(findSimilar(
      window.INGREDIENTS,
      state.similar.ingredient,
      state.similar.minShared,
      state.similar.requiredEffects,
    ));
  } else {
    const el = document.getElementById("potion-results");
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

function bindSimilarControls() {
  document.getElementById("similar-ingredient").addEventListener("change", (e) => {
    state.similar.ingredient = e.target.value;
    state.similar.requiredEffects = new Set();
    refreshSimilarTargetEffects();
    rerender();
  });
  document.getElementById("similar-min").addEventListener("change", (e) => {
    state.similar.minShared = parseInt(e.target.value, 10);
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
  bindSimilarControls();
  refreshSimilarTargetEffects();
  rerender();
}

document.addEventListener("DOMContentLoaded", init);
