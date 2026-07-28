import { renderWorkout, wireWorkoutEvents, setBackCallback } from './workout.js';
import { loadState, getHistory, getProfile } from './store.js';
import { generateWorkout, fitToTime } from './generator.js';
import { renderRegistration, wireRegistrationEvents, renderProfile, getNutrientTargets } from './profile.js';
import { startWaterReminder, stopWaterReminder, startMealNotifications, getMealSuggestions } from './nutrition.js';

const LAST_KEY = 'fitwin_last_workout';

let workouts = [];
let homeWorkouts = [];
let outdoorWorkouts = [];
let gymPool = [];
let deferredInstallPrompt = null;
let pickedWorkout = null;
let pickedHomeId = null;
let pickedOutdoorId = null;

// ── INIT ────────────────────────────────────────────────────────────────
async function init() {
  try {
    const resp = await fetch('./data/workouts.json');
    workouts = await resp.json();
    try { homeWorkouts = await (await fetch('./data/home-workouts.json')).json(); } catch { homeWorkouts = []; }
    try { outdoorWorkouts = await (await fetch('./data/outdoor-workouts.json')).json(); } catch { outdoorWorkouts = []; }
    try { gymPool = await (await fetch('./data/gym-pool.json')).json(); } catch { gymPool = []; }
  } catch {
    document.getElementById('workoutList').innerHTML =
      '<div class="history-empty">Could not load workouts. Please check your connection.</div>';
    return;
  }

  wireWorkoutEvents();
  setBackCallback(() => {
    stopWaterReminder();
    showView('home');
  });

  const profile = getProfile();
  if (!profile) {
    showRegistration();
  } else {
    personalizeHome(profile);
    showView('home');
    startMealNotifications();
  }

  renderHistory();
  setupNav();
  setupGymButton();
  setupInstallPrompt();
  setupWaterDismiss();
  registerSW();
}

// ── REGISTRATION ─────────────────────────────────────────────────────────
function showRegistration() {
  const view = document.getElementById('viewRegister');
  view.innerHTML = renderRegistration();
  document.getElementById('navBar').classList.add('hidden');

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  view.classList.add('active');

  wireRegistrationEvents(profile => {
    document.getElementById('navBar').classList.remove('hidden');
    personalizeHome(profile);
    showView('home');
    renderHome();
    startMealNotifications();
  });
}

function personalizeHome(profile) {
  const gymLabel = document.getElementById('homeGymLabel');
  const greeting = document.getElementById('homeGreeting');
  if (gymLabel && profile.gymName) {
    gymLabel.textContent = `⚡ ${profile.gymName}${profile.gymLocation ? ' · ' + profile.gymLocation : ''}`;
  }
  if (greeting && profile.name) {
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    greeting.textContent = `${greet}, ${profile.name}. Let's train.`;
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
  if (name === 'profile') renderProfileView();
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

    const img = w.exercises.find(e => e.image)?.image || '';

    return `
<div class="workout-card" data-open="${w.id}">
  ${img ? `<div class="wc-bg" style="background-image:url('${img}')"></div>` : ''}
  <div class="wc-shade"></div>
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
  startWaterReminder(15);
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

// ── PROFILE ──────────────────────────────────────────────────────────────
function renderProfileView() {
  const view = document.getElementById('viewProfile');
  if (!view) return;

  const profile = getProfile();
  if (!profile) {
    view.innerHTML = '<div class="history-empty">No profile yet. Complete registration first.</div>';
    return;
  }

  const targets = getNutrientTargets(profile);
  const meals = getMealSuggestions(profile);

  let html = renderProfile();

  html += `
<div class="section-heading" style="margin-top:0">Today's Meal Plan</div>
<div class="meal-plan-list">
  ${meals.map(m => `
    <div class="meal-card">
      <div class="meal-time">${m.label} · ${m.hour > 12 ? (m.hour - 12) : m.hour}${m.hour >= 12 ? 'pm' : 'am'}</div>
      <div class="meal-suggestion">${m.suggestion}</div>
      <div class="meal-cuisine">${m.cuisine}</div>
    </div>
  `).join('')}
</div>
<div class="meal-targets-note">
  Daily targets: ${targets.calories} cal · ${targets.protein}g protein · ${targets.carbs}g carbs · ${targets.fat}g fat · ${targets.water}L water
</div>
<div style="height:20px"></div>`;

  view.innerHTML = html;

  document.getElementById('editProfileBtn')?.addEventListener('click', () => {
    showRegistration();
  });
}

// ── I'M AT GYM — DYNAMIC WORKOUT GENERATOR ──────────────────────────────
function setupGymButton() {
  document.getElementById('gymBtn')?.addEventListener('click', showGymSheet);

  document.querySelectorAll('.time-opt').forEach(btn => {
    btn.addEventListener('click', () => buildPickForTime(parseInt(btn.dataset.mins)));
  });
  document.getElementById('sheetTimeBack')?.addEventListener('click', showTimeStep);

  setupHomeSheet();
  setupOutdoorSheet();

  // Collapsible workout library
  document.getElementById('browseToggle')?.addEventListener('click', () => {
    const list = document.getElementById('workoutList');
    const btn  = document.getElementById('browseToggle');
    const open = list.classList.toggle('hidden');
    btn.textContent = open ? 'Browse All Workouts ▾' : 'Hide All Workouts ▴';
  });
  document.getElementById('sheetClose')?.addEventListener('click', hideGymSheet);
  document.getElementById('sheetBackdrop')?.addEventListener('click', () => {
    if (!document.getElementById('gymSheet').classList.contains('hidden')) hideGymSheet();
    if (!document.getElementById('homeSheet').classList.contains('hidden')) hideHomeSheet();
    if (!document.getElementById('outdoorSheet').classList.contains('hidden')) hideOutdoorSheet();
  });

  document.getElementById('sheetGoBtn')?.addEventListener('click', () => {
    if (pickedWorkout) {
      hideGymSheet();
      localStorage.setItem(LAST_KEY, pickedWorkout.id);
      startWaterReminder(15);
      renderWorkout(pickedWorkout);
      showView('workout');
    }
  });

  document.getElementById('sheetAltBtn')?.addEventListener('click', () => {
    hideGymSheet();
    const list = document.getElementById('workoutList');
    list?.classList.remove('hidden');
    const btn = document.getElementById('browseToggle');
    if (btn) btn.textContent = 'Hide All Workouts ▴';
    list?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function showGymSheet() {
  showTimeStep();
  document.getElementById('gymSheet').classList.remove('hidden', 'sliding-out');
  document.getElementById('sheetBackdrop').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function showTimeStep() {
  document.getElementById('sheetTitle').textContent = 'How Much Time?';
  document.getElementById('sheetTimeStep').classList.remove('hidden');
  document.getElementById('sheetPickStep').classList.add('hidden');
}

function buildPickForTime(minutes) {
  const { workout, reason } = generateWorkout(workouts, getHistory(), { minutes, extraPool: gymPool });
  pickedWorkout = workout;

  document.getElementById('sheetTitle').textContent = "Today's Smart Pick";
  document.getElementById('sheetReason').innerHTML = reason;
  const pickImg = workout.exercises.find(e => e.image)?.image || '';
  document.getElementById('sheetWorkoutCard').innerHTML = `
${pickImg ? `<img class="swc-photo" src="${pickImg}" alt="${workout.title}">` : ''}
<div class="swc-title">${workout.title}</div>
<div class="swc-sub">${workout.subtitle}</div>
<div class="swc-stats">
  <span class="swc-stat">${workout.stats.exercises} exercises</span>
  <span class="swc-stat">${workout.stats.minutes} min</span>
  <span class="swc-stat">${workout.stats.totalSets} sets</span>
</div>`;

  document.getElementById('sheetTimeStep').classList.add('hidden');
  document.getElementById('sheetPickStep').classList.remove('hidden');
}

function hideGymSheet() {
  const sheet = document.getElementById('gymSheet');
  sheet.classList.add('sliding-out');
  setTimeout(() => {
    sheet.classList.add('hidden');
    sheet.classList.remove('sliding-out');
    document.getElementById('sheetBackdrop').classList.add('hidden');
    document.body.style.overflow = '';
  }, 350);
}

// ── I'M AT HOME — SESSION PICKER ─────────────────────────────────────────
function setupHomeSheet() {
  document.getElementById('homeBtn')?.addEventListener('click', showHomeSheet);
  document.getElementById('homeSheetClose')?.addEventListener('click', hideHomeSheet);
  document.getElementById('homeVarBack')?.addEventListener('click', showHomeVarStep);

  document.getElementById('homeVarList')?.addEventListener('click', e => {
    const opt = e.target.closest('[data-varid]');
    if (!opt) return;
    pickedHomeId = opt.dataset.varid;
    document.getElementById('homeSheetTitle').textContent = 'How Much Time?';
    document.getElementById('homeVarStep').classList.add('hidden');
    document.getElementById('homeTimeStep').classList.remove('hidden');
  });

  document.querySelectorAll('.htime-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const base = homeWorkouts.find(w => w.id === pickedHomeId);
      if (!base) return;
      const workout = fitHomeWorkout(base, parseInt(btn.dataset.mins));
      hideHomeSheet();
      localStorage.setItem(LAST_KEY, workout.id);
      startWaterReminder(15);
      renderWorkout(workout);
      showView('workout');
    });
  });
}

function showHomeSheet() {
  if (!homeWorkouts.length) { showSoonToast('🏠 Home workouts failed to load.'); return; }
  const list = document.getElementById('homeVarList');
  list.innerHTML = homeWorkouts.map(w => `
<button class="var-opt" data-varid="${w.id}">
  <div class="var-info">
    <div class="var-title">${w.title}</div>
    <div class="var-sub">${w.subtitle} · ${w.exercises.length} exercises</div>
  </div>
  <span class="var-arrow">›</span>
</button>`).join('');

  showHomeVarStep();
  document.getElementById('homeSheet').classList.remove('hidden', 'sliding-out');
  document.getElementById('sheetBackdrop').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function showHomeVarStep() {
  document.getElementById('homeSheetTitle').textContent = 'Home Workout';
  document.getElementById('homeVarStep').classList.remove('hidden');
  document.getElementById('homeTimeStep').classList.add('hidden');
}

function hideHomeSheet() {
  const sheet = document.getElementById('homeSheet');
  sheet.classList.add('sliding-out');
  setTimeout(() => {
    sheet.classList.add('hidden');
    sheet.classList.remove('sliding-out');
    document.getElementById('sheetBackdrop').classList.add('hidden');
    document.body.style.overflow = '';
  }, 350);
}

function fitHomeWorkout(base, minutes) {
  const { fitted, estMinutes } = fitToTime(base.exercises, minutes);
  const numbered = fitted.map((ex, i) => ({ ...ex, id: i + 1 }));
  const totalSets = numbered.reduce((a, ex) => a + ex.sets.length, 0);
  const timeLabel = minutes >= 75 ? '60+' : String(minutes);
  return {
    ...base,
    id: `${base.id}_${minutes}m`,
    badges: [...base.badges, { text: `Fits ${timeLabel} min`, type: 'info' }],
    stats: { exercises: numbered.length, minutes: `~${estMinutes}`, totalSets },
    exercises: numbered
  };
}

// ── I'M OUTDOORS — SESSION PICKER ────────────────────────────────────────
function setupOutdoorSheet() {
  document.getElementById('outdoorBtn')?.addEventListener('click', showOutdoorSheet);
  document.getElementById('outdoorSheetClose')?.addEventListener('click', hideOutdoorSheet);
  document.getElementById('outdoorVarBack')?.addEventListener('click', showOutdoorVarStep);

  document.getElementById('outdoorVarList')?.addEventListener('click', e => {
    const opt = e.target.closest('[data-varid]');
    if (!opt) return;
    pickedOutdoorId = opt.dataset.varid;
    document.getElementById('outdoorSheetTitle').textContent = 'How Much Time?';
    document.getElementById('outdoorVarStep').classList.add('hidden');
    document.getElementById('outdoorTimeStep').classList.remove('hidden');
  });

  document.querySelectorAll('.otime-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const base = outdoorWorkouts.find(w => w.id === pickedOutdoorId);
      if (!base) return;
      const workout = fitHomeWorkout(base, parseInt(btn.dataset.mins));
      hideOutdoorSheet();
      localStorage.setItem(LAST_KEY, workout.id);
      startWaterReminder(15);
      renderWorkout(workout);
      showView('workout');
    });
  });
}

function showOutdoorSheet() {
  if (!outdoorWorkouts.length) { showSoonToast('🌳 Outdoor sessions failed to load.'); return; }
  const list = document.getElementById('outdoorVarList');
  list.innerHTML = outdoorWorkouts.map(w => `
<button class="var-opt" data-varid="${w.id}">
  <div class="var-info">
    <div class="var-title">${w.title}</div>
    <div class="var-sub">${w.subtitle}</div>
  </div>
  <span class="var-arrow">›</span>
</button>`).join('');

  showOutdoorVarStep();
  document.getElementById('outdoorSheet').classList.remove('hidden', 'sliding-out');
  document.getElementById('sheetBackdrop').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function showOutdoorVarStep() {
  document.getElementById('outdoorSheetTitle').textContent = 'Outdoor Session';
  document.getElementById('outdoorVarStep').classList.remove('hidden');
  document.getElementById('outdoorTimeStep').classList.add('hidden');
}

function hideOutdoorSheet() {
  const sheet = document.getElementById('outdoorSheet');
  sheet.classList.add('sliding-out');
  setTimeout(() => {
    sheet.classList.add('hidden');
    sheet.classList.remove('sliding-out');
    document.getElementById('sheetBackdrop').classList.add('hidden');
    document.body.style.overflow = '';
  }, 350);
}

// ── COMING SOON TOAST ────────────────────────────────────────────────────
let soonTimeout = null;
function showSoonToast(msg) {
  const toast = document.getElementById('soonToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(soonTimeout);
  soonTimeout = setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ── WATER TOAST ──────────────────────────────────────────────────────────
function setupWaterDismiss() {
  document.getElementById('waterDismiss')?.addEventListener('click', () => {
    document.getElementById('waterToast')?.classList.add('hidden');
  });
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
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('./sw.js')
    .then(reg => reg.update().catch(() => {}))
    .catch(() => {});

  // When a new service worker takes control, reload once so the
  // fresh version shows immediately (skip the very first install).
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; }
    window.location.reload();
  });
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

document.addEventListener('DOMContentLoaded', init);
