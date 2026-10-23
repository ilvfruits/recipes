// common.js

// Load the SQLite file into a browser-side DB
async function openDatabase() {
  const SQL = await initSqlJs({ locateFile: f => `libs/${f}` });
  const response = await fetch('recipes.db');
  const buf = await response.arrayBuffer();
  return new SQL.Database(new Uint8Array(buf));
}

// Run a query and return an array of plain objects
function queryObjects(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const out = [];
  while (stmt.step()) out.push(stmt.getAsObject());
  stmt.free();
  return out;
}

// Safe HTML escaping (prevents recipe text from breaking the page)
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// JSON parse with graceful fallback
function parseJSON(raw, fallback = []) {
  try { return JSON.parse(raw || 'null') ?? fallback; }
  catch { return fallback; }
}

// Render the "Ingredients" section from a recipe object
function renderIngredients(recipe) {
  const groups = parseJSON(recipe.ingredients, []);
  if (!groups.length) return '';
  let html = '<h2>Ingredients</h2>';
  groups.forEach(g => {
    if (g.name) html += `<h3 class="group-title">${esc(g.name)}</h3>`;
    html += '<ul class="ingredient-list">';
    (g.items || []).forEach(i => html += `<li>${esc(i)}</li>`);
    html += '</ul>';
  });
  return html;
}

// Render the "Instructions" section
function renderInstructions(recipe) {
  const phases = parseJSON(recipe.instructions, []);
  if (!phases.length) return '';
  let html = '<h2>Instructions</h2>';
  phases.forEach(p => {
    if (p.name) html += `<h3 class="group-title">${esc(p.name)}</h3>`;
    html += '<ol class="instruction-list">';
    (p.steps || []).forEach(s => html += `<li>${esc(s)}</li>`);
    html += '</ol>';
  });
  return html;
}

// Format recipe metadata (prep/cook/serves) as small chips
function renderMeta(recipe) {
  const parts = [];
  if (recipe.prep_minutes != null && recipe.prep_minutes !== '') parts.push(`<span><small>PREP</small>${esc(recipe.prep_minutes)} min</span>`);
  if (recipe.cook_minutes != null && recipe.cook_minutes !== '') parts.push(`<span><small>COOK</small>${esc(recipe.cook_minutes)} min</span>`);
  if (recipe.servings) parts.push(`<span><small>SERVES</small>${esc(recipe.servings)}</span>`);
  return parts.length ? `<div class="detail-meta">${parts.join('')}</div>` : '';
}