import { renderWorkout, wireWorkoutEvents, setBackCallback } from './workout.js';
import { loadState, getHistory, pushHistory } from './store.js';

const LAST_KEY = 'fitwin_last_workout';

let workouts = [];
let deferredInstallPrompt = null;

// ── INIT ────────────────────────────────────────────────────────────────
async function init() {
  try {
    const resp = await fetch('./data/workouts.json');
    workouts = await resp.json();
  } catch (err) {
    document.getElementById('workoutList').innerHTML =
      '<div class="history-empty">Could not load workouts. Please check your connection.</div>';
    return;
  }

  wireWorkoutEvents();
  setBackCallback(() => showView('home'));

  renderHome();
  renderHistory();
  setupNav();
  setupInstallPrompt();
  registerSW();

  // Restore last viewed workout after page load
  const lastId = localStorage.getItem(LAST_KEY);
  if (lastId && workouts.find(w => w.id === lastId)) {
    // Stay on home for now; user can tap back in if desired
  }
}

// ── VIEW ROUTING ─────────────────────────────────────────────────────────
export function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById(`view${cap(name)}`);
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name);
  });

  if (name === 'home')    renderHome();
  if (name === 'history') renderHistory();
}

// ── HOME ─────────────────────────────────────────────────────────────────
function renderHome() {
  const list = document.getElementById('workoutList');
  if (!list) return;

  list.innerHTML = workouts.map(w => {
    const state     = loadState(w.id) || {};
    const totalSets = w.exercises.reduce((a, ex) => a + ex.sets.length, 0);
    const checked   = w.exercises.reduce((a, ex) => {
      return a + (state[ex.id]?.sets?.filter(Boolean).length || 0);
    }, 0);
    const pct       = totalSets ? Math.round((checked / totalSets) * 100) : 0;
    const completed = !!state._completed;

    return `
<div class="workout-card" data-open="${w.id}">
  <div class="wc-emoji">${w.exercises[0]?.emoji || '💪'}</div>
  <div class="wc-info">
    <div class="wc-title">${w.title}</div>
    <div class="wc-sub">${w.subtitle}</div>
    <div class="wc-stats">
      <span class="wc-stat">${w.stats.exercises} ex</span>
      <span class="wc-stat">${w.stats.minutes} min</span>
      <span class="wc-stat">${w.stats.totalSets} sets</span>
    </div>
    <div class="wc-progress-wrap">
      <div class="wc-progress-bar" style="width:${pct}%"></div>
    </div>
  </div>
  ${completed
    ? '<div class="wc-done-badge">✓ Done</div>'
    : '<div class="wc-arrow">›</div>'}
</div>`;
  }).join('');

  list.onclick = e => {
    const card = e.target.closest('[data-open]');
    if (card) openWorkout(card.dataset.open);
  };
}

function openWorkout(id) {
  const w = workouts.find(w => w.id === id);
  if (!w) return;
  localStorage.setItem(LAST_KEY, id);
  renderWorkout(w);
  showView('workout');
}

// ── HISTORY ───────────────────────────────────────────────────────────────
function renderHistory() {
  const container = document.getElementById('historyList');
  if (!container) return;
  const hist = getHistory();

  if (!hist.length) {
    container.innerHTML = '<div class="history-empty">No workouts completed yet.<br>Finish one to see it here.</div>';
    return;
  }

  container.innerHTML = hist.map(entry => {
    const d       = new Date(entry.date);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `
<div class="history-item">
  <div class="hi-date">${dateStr}<br><span style="font-weight:400;color:var(--muted);font-size:11px">${timeStr}</span></div>
  <div class="hi-name">${entry.workoutTitle}</div>
  <div class="hi-sets">${entry.setsDone}<br><span style="font-size:10px;color:var(--muted)">sets</span></div>
</div>`;
  }).join('');
}

// ── NAV ───────────────────────────────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });
}

// ── PWA INSTALL ───────────────────────────────────────────────────────────
function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById('installPrompt')?.classList.remove('hidden');
  });

  document.getElementById('installYes')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    document.getElementById('installPrompt')?.classList.add('hidden');
  });

  document.getElementById('installDismiss')?.addEventListener('click', () => {
    document.getElementById('installPrompt')?.classList.add('hidden');
  });
}

// ── SERVICE WORKER ────────────────────────────────────────────────────────
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

document.addEventListener('DOMContentLoaded', init);
