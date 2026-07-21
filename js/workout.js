import { startTimer, stopTimer } from './timer.js';
import { saveState, loadState, pushHistory, logWeight, getLastWeight } from './store.js';

let currentWorkout = null;
let workoutState   = {};
let onBackCallback = null;
let pendingWeightCb = null;

export function setBackCallback(fn) { onBackCallback = fn; }

export function renderWorkout(workout) {
  currentWorkout = workout;
  workoutState   = loadState(workout.id) || {};

  const view = document.getElementById('viewWorkout');
  view.innerHTML = buildWorkoutHTML(workout);

  document.getElementById('timerCloseBtn').addEventListener('click', stopTimer);

  restoreState();
  updateProgress();
  checkCompletion(false);

  const firstUndone = workout.exercises.find(e => !workoutState[e.id]?.done);
  const targetId = firstUndone ? firstUndone.id : workout.exercises[0]?.id;
  const firstBody = targetId != null ? document.getElementById(`body${targetId}`) : null;
  if (firstBody) firstBody.classList.add('open');
}

export function wireWorkoutEvents() {
  const view = document.getElementById('viewWorkout');

  view.addEventListener('click', e => {
    if (e.target.closest('#backBtn')) {
      onBackCallback?.();
      return;
    }

    const toggle = e.target.closest('[data-card-toggle]');
    if (toggle
      && !e.target.closest('[data-done]')
      && !e.target.closest('[data-unavail]')
      && !e.target.closest('.rest-timer-btn')
    ) {
      const id = toggle.dataset.cardToggle;
      document.getElementById(`body${id}`)?.classList.toggle('open');
      return;
    }

    const doneBtn = e.target.closest('[data-done]');
    if (doneBtn) { e.stopPropagation(); toggleDone(parseInt(doneBtn.dataset.done)); return; }

    const unavailBtn = e.target.closest('[data-unavail]');
    if (unavailBtn) { e.stopPropagation(); toggleUnavail(parseInt(unavailBtn.dataset.unavail)); return; }

    const timerBtn = e.target.closest('[data-timer-ex]');
    if (timerBtn) {
      const id = parseInt(timerBtn.dataset.timerEx);
      fireTimer(id);
      return;
    }

    if (e.target.closest('#resetBtn')) {
      if (confirm('Reset this workout? All progress will be cleared.')) resetWorkout();
    }
  });

  view.addEventListener('change', e => {
    const cb = e.target.closest('.set-check');
    if (!cb) return;
    const exId   = parseInt(cb.dataset.ex);
    const setIdx = parseInt(cb.dataset.set);
    const rest   = parseInt(cb.dataset.rest) || 60;

    if (!workoutState[exId]) workoutState[exId] = { done: false, unavail: false, sets: [] };
    workoutState[exId].sets[setIdx] = cb.checked;

    saveState(currentWorkout.id, workoutState);
    updateProgress();
    checkCompletion(true);

    if (cb.checked) {
      if (currentWorkout.noWeightLog) fireTimer(exId, rest);
      else showWeightModal(exId, setIdx, () => fireTimer(exId, rest));
    }
  });

  wireWeightModal();
}

// ── WEIGHT INPUT MODAL ──────────────────────────────────────────────────
function showWeightModal(exId, setIdx, onDone) {
  const ex = currentWorkout?.exercises.find(e => e.id === exId);
  if (!ex) { onDone?.(); return; }

  const set = ex.sets[setIdx];
  const lastW = getLastWeight(ex.name);

  document.getElementById('weightModalEx').textContent = ex.name;
  document.getElementById('weightModalSet').textContent = set?.isWarm ? 'Warm-up Set' : (set?.label || `Set ${setIdx + 1}`);
  document.getElementById('weightModalLast').textContent = lastW ? `Last used: ${lastW} lbs` : 'No previous weight logged';

  const input = document.getElementById('weightInput');
  input.value = lastW || '';
  input.placeholder = lastW ? `${lastW} lbs` : 'Weight (lbs)';

  pendingWeightCb = { exerciseName: ex.name, setLabel: set?.label || `Set ${setIdx + 1}`, onDone };

  document.getElementById('weightModal').classList.remove('hidden');
  setTimeout(() => input.focus(), 100);
}

function wireWeightModal() {
  document.getElementById('weightSave')?.addEventListener('click', () => {
    const input = document.getElementById('weightInput');
    const val = parseFloat(input.value);
    if (val > 0 && pendingWeightCb) {
      logWeight(pendingWeightCb.exerciseName, pendingWeightCb.setLabel, val);
    }
    closeWeightModal();
  });

  document.getElementById('weightSkip')?.addEventListener('click', () => {
    closeWeightModal();
  });

  document.getElementById('weightInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('weightSave').click();
    }
  });
}

function closeWeightModal() {
  document.getElementById('weightModal').classList.add('hidden');
  const onDone = pendingWeightCb?.onDone;
  pendingWeightCb = null;
  onDone?.();
}

function fireTimer(exId, overrideRest) {
  const ex = currentWorkout.exercises.find(e => e.id === exId);
  if (!ex) return;
  const rest = overrideRest ?? ex.restSecs;
  const setsDone  = workoutState[exId]?.sets?.filter(Boolean).length || 0;
  const setsTotal = ex.sets.length;
  const remaining = currentWorkout.exercises.filter(e => e.id > exId && !workoutState[e.id]?.done);
  startTimer(rest, ex, remaining, {
    midExercise: setsDone < setsTotal && !workoutState[exId]?.done,
    setsDone,
    setsTotal
  });
}

// ── CARD STATE ──────────────────────────────────────────────────────────
function toggleDone(id) {
  const card = document.getElementById(`card${id}`);
  if (!card) return;
  card.classList.toggle('done');
  const isDone = card.classList.contains('done');
  if (isDone) document.getElementById(`body${id}`)?.classList.remove('open');

  if (!workoutState[id]) workoutState[id] = { done: false, unavail: false, sets: [] };
  workoutState[id].done = isDone;
  saveState(currentWorkout.id, workoutState);
  updateProgress();
  checkCompletion(true);
}

function toggleUnavail(id) {
  const card = document.getElementById(`card${id}`);
  const alt  = document.getElementById(`alt${id}`);
  if (!card) return;
  card.classList.toggle('unavailable');
  const isUnavail = card.classList.contains('unavailable');
  if (isUnavail) {
    alt?.classList.add('show');
    document.getElementById(`body${id}`)?.classList.add('open');
  } else {
    alt?.classList.remove('show');
  }
  if (!workoutState[id]) workoutState[id] = { done: false, unavail: false, sets: [] };
  workoutState[id].unavail = isUnavail;
  saveState(currentWorkout.id, workoutState);
}

// ── RESTORE ─────────────────────────────────────────────────────────────
function restoreState() {
  if (!currentWorkout) return;
  currentWorkout.exercises.forEach(ex => {
    const st = workoutState[ex.id];
    if (!st) return;
    const card = document.getElementById(`card${ex.id}`);
    if (!card) return;
    if (st.done) {
      card.classList.add('done');
      document.getElementById(`body${ex.id}`)?.classList.remove('open');
    }
    if (st.unavail) {
      card.classList.add('unavailable');
      document.getElementById(`alt${ex.id}`)?.classList.add('show');
    }
    if (st.sets?.length) {
      const checks = card.querySelectorAll('.set-check');
      checks.forEach((cb, i) => { if (st.sets[i]) cb.checked = true; });
    }
  });
  if (workoutState._completed) {
    document.getElementById('completeBanner')?.classList.add('show');
  }
}

// ── PROGRESS ────────────────────────────────────────────────────────────
function updateProgress() {
  const allChecks = document.querySelectorAll('#viewWorkout .set-check');
  const checked   = document.querySelectorAll('#viewWorkout .set-check:checked').length;
  const pct = allChecks.length ? (checked / allChecks.length) * 100 : 0;
  const bar = document.getElementById('progressBar');
  if (bar) bar.style.width = pct + '%';
}

// ── COMPLETION ───────────────────────────────────────────────────────────
function checkCompletion(allowSave) {
  if (!currentWorkout) return;
  const checks = [...document.querySelectorAll('#viewWorkout .set-check')];
  const allChecked = checks.length > 0 && checks.every(c => c.checked);
  const allDone = currentWorkout.exercises.every(ex => workoutState[ex.id]?.done);
  const complete = allChecked || allDone;

  const banner = document.getElementById('completeBanner');
  if (banner) banner.classList.toggle('show', complete);

  if (complete && allowSave && !workoutState._completed) {
    workoutState._completed = true;
    saveState(currentWorkout.id, workoutState);
    const setsDone = checks.filter(c => c.checked).length;
    pushHistory({
      workoutId:    currentWorkout.id,
      workoutTitle: currentWorkout.title,
      workoutType:  currentWorkout.type,
      date:         new Date().toISOString(),
      setsDone
    });
  }
}

// ── RESET ────────────────────────────────────────────────────────────────
function resetWorkout() {
  workoutState = {};
  saveState(currentWorkout.id, workoutState);
  document.querySelectorAll('#viewWorkout .set-check').forEach(cb => cb.checked = false);
  document.querySelectorAll('#viewWorkout .card').forEach(c => c.classList.remove('done', 'unavailable'));
  document.querySelectorAll('#viewWorkout .alt-panel').forEach(a => a.classList.remove('show'));
  document.querySelectorAll('#viewWorkout .card-body').forEach(b => b.classList.remove('open'));
  document.getElementById('completeBanner')?.classList.remove('show');
  updateProgress();
  const firstId = currentWorkout.exercises[0]?.id;
  if (firstId != null) document.getElementById(`body${firstId}`)?.classList.add('open');
}

// ── WARM-UP / COOL-DOWN DEMO IMAGES ─────────────────────────────────────
// Match prep item text to a demo gif. First hit wins, so keep specific
// patterns above general ones.
const PREP_GIFS = [
  [/treadmill|brisk walk|light jog|jog/i,          './images/gifs/real-jog.gif'],
  [/jump rope|rope jump/i,                          './images/gifs/prep-jumprope.gif'],
  [/arm circle/i,                                   './images/gifs/prep-armcircles.gif'],
  [/shoulder roll/i,                                './images/gifs/prep-shouldercircles.gif'],
  [/pull-apart|reverse flye/i,                      './images/gifs/prep-bandpull.gif'],
  [/lat pulldown/i,                                 './images/gifs/lat-pulldown.gif'],
  [/push-up/i,                                      './images/gifs/pushup.gif'],
  [/squat/i,                                        './images/gifs/bw-squat.gif'],
  [/glute bridge/i,                                 './images/gifs/glute-bridge.gif'],
  [/light curls/i,                                  './images/gifs/db-curl.gif'],
  [/pushdown|band extension/i,                      './images/gifs/pushdown.gif'],
  [/lateral raise/i,                                './images/gifs/lateral-raise.gif'],
  [/chest flye|light press/i,                       './images/gifs/chest-press.gif'],
  [/walking lunge|lunges with|walking lunges/i,     './images/gifs/walking-lunge.gif'],
  [/high knees/i,                                   './images/gifs/real-highknees.gif'],
  [/butt kick/i,                                    './images/gifs/real-buttkicks.gif'],
  [/cat-cow/i,                                      './images/gifs/real-catcow.gif'],
  [/cross-body shoulder/i,                          './images/gifs/prep-shoulderstretch.gif'],
  [/behind-back shoulder/i,                         './images/gifs/prep-behindhead.gif'],
  [/doorway chest|chest opener|chest stretch/i,     './images/gifs/prep-cheststretch.gif'],
  [/tricep overhead|overhead stretch|tricep.*stretch/i, './images/gifs/prep-tricepstretch.gif'],
  [/seated hamstring/i,                             './images/gifs/prep-seatedham.gif'],
  [/hamstring (fold|stretch|scoop)/i,               './images/gifs/hamstring-scoop.gif'],
  [/lat stretch/i,                                  './images/gifs/prep-latstretch.gif'],
  [/bicep.*stretch/i,                               './images/gifs/prep-bicepstretch.gif'],
  [/quad stretch/i,                                 './images/gifs/prep-quadstretch.gif'],
  [/pigeon/i,                                       './images/gifs/real-pigeon.gif'],
  [/upper back stretch|hug yourself/i,              './images/gifs/prep-upperback.gif'],
  [/calf stretch/i,                                 './images/gifs/prep-calfstretch.gif'],
  [/hip flexor/i,                                   './images/gifs/prep-hipflexor.gif'],
  [/child'?s pose/i,                                './images/gifs/real-pigeon.gif'],
];

function prepRow(text) {
  const hit = PREP_GIFS.find(([re]) => re.test(text));
  const img = hit ? hit[1] : '';
  return `
<div class="prep-item">
  ${img ? `<img class="prep-img" src="${img}" alt="" loading="lazy">` : '<div class="prep-dot"></div>'}
  <div class="prep-text">${text}</div>
</div>`;
}

// ── HTML BUILDERS ────────────────────────────────────────────────────────
function buildWorkoutHTML(w) {
  return `
<div class="timer-overlay" id="timerOverlay">
  <div class="timer-ex-name" id="timerExName">Rest</div>
  <div class="timer-circle">
    <svg class="timer-svg" viewBox="0 0 188 188">
      <circle class="timer-track" cx="94" cy="94" r="90"/>
      <circle class="timer-progress" id="timerArc" cx="94" cy="94" r="90"
        stroke-dasharray="565.5" stroke-dashoffset="0"/>
    </svg>
    <div class="timer-count" id="timerCount">60</div>
    <div class="timer-label">seconds</div>
  </div>
  <div class="timer-done-msg" id="timerDoneMsg">✓ Rest Complete — Go!</div>
  <div class="next-up-large hidden" id="nextUp">
    <div id="nextPhoto"></div>
    <div class="next-up-body">
      <div class="next-label" id="nextLabel">Next Up</div>
      <div class="next-name" id="nextName">—</div>
      <div class="next-meta" id="nextMeta">—</div>
      <div class="next-tip" id="nextTip"></div>
    </div>
  </div>
  <button class="timer-close" id="timerCloseBtn">Skip Rest</button>
</div>

<div class="workout-header">
  <button class="back-btn" id="backBtn">← Workouts</button>
  <div class="wh-top">
    <div>
      <div class="gym-label">${w.gym}</div>
      <div class="day-title">${w.title}</div>
      <div class="day-sub">${w.subtitle}</div>
    </div>
    <div class="badges">
      ${w.badges.map(b => `<span class="badge${b.type === 'info' ? ' info' : ''}">${b.text}</span>`).join('')}
    </div>
  </div>
  <div class="progress-wrap"><div class="progress-bar" id="progressBar"></div></div>
</div>

<div class="notice">${w.notice}</div>

<div class="summary">
  <div class="stat-box"><div class="stat-val">${w.stats.exercises}</div><div class="stat-label">Exercises</div></div>
  <div class="stat-box"><div class="stat-val">${w.stats.minutes}</div><div class="stat-label">Minutes</div></div>
  <div class="stat-box"><div class="stat-val">${w.stats.totalSets}</div><div class="stat-label">Total Sets</div></div>
</div>

<div class="section-label">Warm-Up · 5 min</div>
<div class="warmup-card">
  ${w.warmup.map(item => prepRow(item)).join('')}
</div>

<div class="section-label">Workout · ${w.exercises.length} Exercises</div>
${w.exercises.map(ex => buildExerciseCard(ex)).join('')}

<div class="section-label">Cool Down</div>
<div class="cooldown-card">
  ${w.cooldown.map(item => prepRow(item)).join('')}
</div>

${w.closing ? `<div class="closing-card">${w.closing}</div>` : ''}

<div class="complete-banner" id="completeBanner">
  <h2>🏆 Workout Done!</h2>
  <p>Saved to your history. Rest up — you earned it.</p>
</div>

<div class="workout-actions">
  <button class="reset-btn" id="resetBtn">↺ Reset Workout</button>
</div>

<div style="height:20px"></div>
`;
}

function buildExerciseCard(ex) {
  const numStr = String(ex.id).padStart(2, '0');
  const workSets = ex.sets.filter(s => !s.isWarm);
  const lastW = getLastWeight(ex.name);
  const refUrl = ex.referenceUrl;

  return `
<div class="card" id="card${ex.id}">
  <div class="card-header" data-card-toggle="${ex.id}">
    <div class="ex-num">${numStr}</div>
    <div class="ex-info">
      <div class="ex-name">${ex.name}</div>
      <div class="ex-meta">
        <span>${workSets.length} sets</span><span>${ex.restSecs}s rest</span>
        ${lastW ? `<span style="color:var(--green);font-weight:600">Last: ${lastW} lbs</span>` : ''}
        ${ex.muscles.map(m => `<span class="muscle-tag">${m}</span>`).join('')}
      </div>
    </div>
    <div class="card-actions">
      <button class="unavail-btn" data-unavail="${ex.id}">🚫 N/A</button>
      <button class="done-btn" data-done="${ex.id}">✓</button>
    </div>
  </div>
  <div class="card-body" id="body${ex.id}">
    <div class="ex-visual">
      ${ex.image
        ? `<img class="ex-photo" src="${ex.image}" alt="${ex.name}" loading="lazy">`
        : `<span class="ex-emoji">${ex.emoji}</span>`}
    </div>
    <div class="alt-panel" id="alt${ex.id}">
      <div class="alt-header">⚡ Free Weight Alternative</div>
      ${ex.altImage ? `<img class="alt-photo" src="${ex.altImage}" alt="${ex.alt.name}" loading="lazy">` : ''}
      <div class="alt-body">
        <div class="alt-name">${ex.alt.name}</div>
        <div class="alt-sets">${ex.alt.sets}</div>
        <div class="alt-tip">${ex.alt.tip}</div>
        ${ex.alt.referenceUrl ? `<a class="ref-link" href="${ex.alt.referenceUrl}" target="_blank" rel="noopener">📖 View Exercise Guide →</a>` : ''}
      </div>
    </div>
    <div class="card-detail">
      <table class="sets-table">
        <thead><tr><th>Set</th><th>Reps</th><th>Weight</th><th>Done</th></tr></thead>
        <tbody>
          ${ex.sets.map((s, i) => `
          <tr>
            <td>${s.isWarm ? `<span class="set-tag">Warm</span>` : s.label}</td>
            <td>${s.reps}</td>
            <td>${s.weight}</td>
            <td><input type="checkbox" class="set-check"
              data-ex="${ex.id}" data-set="${i}" data-rest="${s.rest}"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="muscle-section">Muscles Worked</div>
      <div class="muscle-list">
        ${ex.primaryMuscles.map(m => `<span class="muscle-pill primary">${m}</span>`).join('')}
        ${ex.secondaryMuscles.map(m => `<span class="muscle-pill secondary">${m}</span>`).join('')}
      </div>
      <div style="height:10px"></div>
      <div class="tip">${ex.tip}</div>
      ${refUrl ? `<a class="ref-link" href="${refUrl}" target="_blank" rel="noopener">📖 View Exercise Guide & Anatomy →</a>` : ''}
      <div class="rest-row">
        <span>Rest ${ex.restSecs}s between sets</span>
        <button class="rest-timer-btn" data-timer-ex="${ex.id}">⏱ Start Rest</button>
      </div>
    </div>
  </div>
</div>`;
}
