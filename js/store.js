const STATE_KEY   = id => `fitwin_state_${id}`;
const HISTORY_KEY = 'fitwin_history';
const PROFILE_KEY = 'fitwin_profile';
const WEIGHT_KEY  = 'fitwin_weight_log';

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

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); }
  catch { return null; }
}

export function logWeight(exerciseName, setLabel, weight) {
  const logs = getWeightLogs();
  logs.unshift({ exerciseName, setLabel, weight, date: new Date().toISOString() });
  localStorage.setItem(WEIGHT_KEY, JSON.stringify(logs.slice(0, 1000)));
}

export function getWeightLogs() {
  try { return JSON.parse(localStorage.getItem(WEIGHT_KEY)) || []; }
  catch { return []; }
}

export function getLastWeight(exerciseName) {
  const logs = getWeightLogs();
  const last = logs.find(l => l.exerciseName === exerciseName);
  return last ? last.weight : null;
}
