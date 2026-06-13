const STATE_KEY   = id => `plc_state_${id}`;
const HISTORY_KEY = 'plc_history';

export function saveState(workoutId, state) {
  localStorage.setItem(STATE_KEY(workoutId), JSON.stringify(state));
}

export function loadState(workoutId) {
  try { return JSON.parse(localStorage.getItem(STATE_KEY(workoutId))); }
  catch { return null; }
}

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

export function pushHistory(entry) {
  const hist = getHistory();
  hist.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 100)));
}
