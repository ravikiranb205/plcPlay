import { saveProfile, getProfile, getWeightLogs, getHistory } from './store.js';

const GOAL_LABELS = {
  weight_loss: 'Weight Loss',
  muscle_gain: 'Muscle Gain',
  fat_loss: 'Fat Loss',
  general: 'General Fitness'
};

const DIET_STYLES = {
  keto:          { label: 'Keto', carb: 5, protein: 30, fat: 65 },
  low_carb:      { label: 'Low Carb', carb: 20, protein: 35, fat: 45 },
  high_protein:  { label: 'High Protein', carb: 35, protein: 40, fat: 25 },
  mediterranean: { label: 'Mediterranean', carb: 45, protein: 25, fat: 30 },
  balanced:      { label: 'Balanced', carb: 40, protein: 30, fat: 30 },
  if_16_8:       { label: 'Intermittent Fasting (16:8)', carb: 40, protein: 30, fat: 30 }
};

const GOAL_DIET_MAP = {
  weight_loss: ['keto', 'low_carb', 'if_16_8', 'mediterranean'],
  muscle_gain: ['high_protein', 'balanced', 'mediterranean'],
  fat_loss: ['keto', 'low_carb', 'high_protein', 'if_16_8'],
  general: ['balanced', 'mediterranean', 'high_protein']
};

const GOAL_REASONS = {
  weight_loss: {
    keto: 'Keto forces your body to burn fat for fuel by cutting carbs drastically. Great for rapid weight loss.',
    low_carb: 'Reducing carbs helps control insulin and promotes fat burning while keeping you full.',
    if_16_8: 'Eating within an 8-hour window naturally reduces calorie intake and improves fat metabolism.',
    mediterranean: 'Rich in healthy fats and whole foods. Sustainable long-term approach to weight management.'
  },
  muscle_gain: {
    high_protein: 'High protein intake (1.6-2.2g/kg) maximizes muscle protein synthesis for growth.',
    balanced: 'Balanced macros with a calorie surplus provides the energy and building blocks for muscle.',
    mediterranean: 'Nutrient-dense, anti-inflammatory foods support recovery and lean mass gains.'
  },
  fat_loss: {
    keto: 'Ketosis shifts your metabolism to prioritize fat burning while preserving muscle.',
    low_carb: 'Lower carbs reduce water retention and promote steady fat oxidation.',
    high_protein: 'High protein preserves lean mass during a calorie deficit — lose fat, not muscle.',
    if_16_8: 'Time-restricted eating enhances fat burning hormones and improves body composition.'
  },
  general: {
    balanced: 'Even macros support all aspects of fitness — energy, recovery, and overall health.',
    mediterranean: 'One of the most studied diets for longevity, heart health, and sustained energy.',
    high_protein: 'Extra protein supports muscle recovery after workouts and keeps you satiated.'
  }
};

export function getDietRecommendations(profile) {
  const goal = profile.goal || 'general';
  const styles = GOAL_DIET_MAP[goal] || GOAL_DIET_MAP.general;
  const reasons = GOAL_REASONS[goal] || GOAL_REASONS.general;

  return styles.map(key => ({
    key,
    ...DIET_STYLES[key],
    reason: reasons[key] || '',
    recommended: key === styles[0]
  }));
}

export function getNutrientTargets(profile) {
  if (!profile) return null;

  const weight = parseFloat(profile.weight) || 70;
  const height = parseFloat(profile.height) || 170;
  const age = parseInt(profile.age) || 25;
  const sex = profile.sex || 'male';

  let bmr;
  if (sex === 'female') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  }

  const tdee = Math.round(bmr * 1.55);

  let calories;
  switch (profile.goal) {
    case 'weight_loss': calories = tdee - 500; break;
    case 'muscle_gain': calories = tdee + 300; break;
    case 'fat_loss':    calories = tdee - 300; break;
    default:            calories = tdee;
  }

  const style = DIET_STYLES[profile.dietStyle] || DIET_STYLES.balanced;

  const proteinCal = calories * (style.protein / 100);
  const carbCal    = calories * (style.carb / 100);
  const fatCal     = calories * (style.fat / 100);

  return {
    calories: Math.round(calories),
    protein: Math.round(proteinCal / 4),
    carbs: Math.round(carbCal / 4),
    fat: Math.round(fatCal / 9),
    water: Math.round(weight * 0.033 * 10) / 10,
    style: style.label
  };
}

export function renderRegistration() {
  return `
<div class="reg-header">
  <div class="reg-logo">FitWin</div>
  <div class="reg-tagline">Set up your profile to get personalized workouts and nutrition.</div>
</div>
<form class="reg-form" id="regForm">
  <div class="reg-section">Personal Info</div>
  <input type="text" class="reg-input" placeholder="Your Name" id="regName" required>
  <div class="reg-row">
    <input type="number" class="reg-input" placeholder="Age" id="regAge" required min="13" max="99" inputmode="numeric">
    <select class="reg-input" id="regSex" required>
      <option value="">Sex</option>
      <option value="male">Male</option>
      <option value="female">Female</option>
      <option value="other">Other</option>
    </select>
  </div>
  <select class="reg-input" id="regNationality" required>
    <option value="">Nationality / Region</option>
    <option value="indian">Indian</option>
    <option value="american">American</option>
    <option value="mexican">Mexican</option>
    <option value="mediterranean">Mediterranean</option>
    <option value="east_asian">East Asian</option>
    <option value="southeast_asian">Southeast Asian</option>
    <option value="middle_eastern">Middle Eastern</option>
    <option value="european">European</option>
    <option value="african">African</option>
    <option value="south_american">South American</option>
  </select>

  <div class="reg-section">Body Stats</div>
  <div class="reg-row">
    <div class="reg-unit-wrap">
      <input type="number" class="reg-input" placeholder="Weight" id="regWeight" required min="30" max="300" step="0.1" inputmode="decimal">
      <span class="reg-unit">kg</span>
    </div>
    <div class="reg-unit-wrap">
      <input type="number" class="reg-input" placeholder="Height" id="regHeight" required min="100" max="250" inputmode="decimal">
      <span class="reg-unit">cm</span>
    </div>
  </div>

  <div class="reg-section">Your Gym</div>
  <input type="text" class="reg-input" placeholder="Gym Name" id="regGymName">
  <input type="text" class="reg-input" placeholder="City / Location" id="regGymLocation">

  <div class="reg-section">Fitness Goal</div>
  <div class="reg-chips" id="regGoals">
    <button type="button" class="reg-chip" data-goal="weight_loss">Weight Loss</button>
    <button type="button" class="reg-chip" data-goal="muscle_gain">Muscle Gain</button>
    <button type="button" class="reg-chip" data-goal="fat_loss">Fat Loss</button>
    <button type="button" class="reg-chip" data-goal="general">General Fitness</button>
  </div>

  <div class="reg-section">Diet Preference</div>
  <div class="reg-chips" id="regDiet">
    <button type="button" class="reg-chip" data-diet="non_veg">Non-Veg</button>
    <button type="button" class="reg-chip" data-diet="vegetarian">Vegetarian</button>
    <button type="button" class="reg-chip" data-diet="vegan">Vegan</button>
    <button type="button" class="reg-chip" data-diet="pescatarian">Pescatarian</button>
  </div>

  <div class="reg-section">Cuisine Preferences</div>
  <div class="reg-chips multi" id="regCuisine">
    <button type="button" class="reg-chip" data-cuisine="indian">Indian</button>
    <button type="button" class="reg-chip" data-cuisine="american">American</button>
    <button type="button" class="reg-chip" data-cuisine="mediterranean">Mediterranean</button>
    <button type="button" class="reg-chip" data-cuisine="east_asian">East Asian</button>
    <button type="button" class="reg-chip" data-cuisine="mexican">Mexican</button>
    <button type="button" class="reg-chip" data-cuisine="middle_eastern">Middle Eastern</button>
  </div>

  <div class="reg-diet-rec hidden" id="regDietRec"></div>

  <button type="submit" class="reg-submit" id="regSubmit" disabled>Get Started</button>
</form>
<div style="height:40px"></div>`;
}

export function wireRegistrationEvents(onComplete) {
  const form = document.getElementById('regForm');
  if (!form) return;

  let selectedGoal = '';
  let selectedDiet = '';
  const selectedCuisines = new Set();

  form.querySelector('#regGoals').addEventListener('click', e => {
    const chip = e.target.closest('.reg-chip');
    if (!chip) return;
    form.querySelectorAll('#regGoals .reg-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedGoal = chip.dataset.goal;
    showDietRec();
    checkReady();
  });

  form.querySelector('#regDiet').addEventListener('click', e => {
    const chip = e.target.closest('.reg-chip');
    if (!chip) return;
    form.querySelectorAll('#regDiet .reg-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedDiet = chip.dataset.diet;
    checkReady();
  });

  form.querySelector('#regCuisine').addEventListener('click', e => {
    const chip = e.target.closest('.reg-chip');
    if (!chip) return;
    chip.classList.toggle('selected');
    const val = chip.dataset.cuisine;
    if (selectedCuisines.has(val)) selectedCuisines.delete(val);
    else selectedCuisines.add(val);
    checkReady();
  });

  function showDietRec() {
    if (!selectedGoal) return;
    const recs = getDietRecommendations({ goal: selectedGoal });
    const el = document.getElementById('regDietRec');
    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="reg-section">Recommended Diet Style</div>
      <div class="diet-rec-list">
        ${recs.map(r => `
          <label class="diet-rec-option ${r.recommended ? 'recommended' : ''}">
            <input type="radio" name="dietStyle" value="${r.key}" ${r.recommended ? 'checked' : ''}>
            <div class="diet-rec-info">
              <div class="diet-rec-name">${r.label} ${r.recommended ? '<span class="rec-badge">Best for you</span>' : ''}</div>
              <div class="diet-rec-reason">${r.reason}</div>
              <div class="diet-rec-macros">Carbs ${r.carb}% · Protein ${r.protein}% · Fat ${r.fat}%</div>
            </div>
          </label>
        `).join('')}
      </div>`;
  }

  function checkReady() {
    const name = form.querySelector('#regName').value.trim();
    const age = form.querySelector('#regAge').value;
    const ready = name && age && selectedGoal && selectedDiet;
    form.querySelector('#regSubmit').disabled = !ready;
  }

  form.querySelectorAll('.reg-input').forEach(inp => {
    inp.addEventListener('input', checkReady);
    inp.addEventListener('change', checkReady);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const dietStyleEl = form.querySelector('input[name="dietStyle"]:checked');
    const profile = {
      name:        form.querySelector('#regName').value.trim(),
      age:         parseInt(form.querySelector('#regAge').value),
      sex:         form.querySelector('#regSex').value,
      nationality: form.querySelector('#regNationality').value,
      weight:      parseFloat(form.querySelector('#regWeight').value) || 70,
      height:      parseFloat(form.querySelector('#regHeight').value) || 170,
      gymName:     form.querySelector('#regGymName').value.trim() || 'My Gym',
      gymLocation: form.querySelector('#regGymLocation').value.trim() || '',
      goal:        selectedGoal,
      dietPreference: selectedDiet,
      cuisinePreferences: [...selectedCuisines],
      dietStyle:   dietStyleEl ? dietStyleEl.value : 'balanced',
      createdAt:   new Date().toISOString()
    };
    saveProfile(profile);
    requestNotificationPermission();
    onComplete?.(profile);
  });
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function renderProfile() {
  const profile = getProfile();
  if (!profile) return '<div class="history-empty">No profile set up yet.</div>';

  const targets = getNutrientTargets(profile);
  const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
  const logs = getWeightLogs();
  const hist = getHistory();

  const recentWeights = {};
  logs.slice(0, 50).forEach(l => {
    if (!recentWeights[l.exerciseName]) recentWeights[l.exerciseName] = [];
    if (recentWeights[l.exerciseName].length < 3) recentWeights[l.exerciseName].push(l);
  });

  return `
<div class="home-header">
  <div class="home-gym-label">${profile.gymName ? `⚡ ${profile.gymName}${profile.gymLocation ? ' · ' + profile.gymLocation : ''}` : '⚡ FitWin'}</div>
  <div class="home-title">${profile.name}</div>
  <div class="home-sub">${GOAL_LABELS[profile.goal] || 'Fitness'} · ${DIET_STYLES[profile.dietStyle]?.label || 'Balanced'}</div>
</div>

<div class="profile-stats-grid">
  <div class="ps-box"><div class="ps-val">${profile.weight}<span class="ps-unit">kg</span></div><div class="ps-label">Weight</div></div>
  <div class="ps-box"><div class="ps-val">${profile.height}<span class="ps-unit">cm</span></div><div class="ps-label">Height</div></div>
  <div class="ps-box"><div class="ps-val">${bmi}</div><div class="ps-label">BMI</div></div>
  <div class="ps-box"><div class="ps-val">${hist.length}</div><div class="ps-label">Workouts</div></div>
</div>

<div class="section-heading">Daily Nutrition Targets</div>
<div class="nutrient-grid">
  <div class="nut-box cal"><div class="nut-val">${targets.calories}</div><div class="nut-label">Calories</div></div>
  <div class="nut-box pro"><div class="nut-val">${targets.protein}g</div><div class="nut-label">Protein</div></div>
  <div class="nut-box carb"><div class="nut-val">${targets.carbs}g</div><div class="nut-label">Carbs</div></div>
  <div class="nut-box fat"><div class="nut-val">${targets.fat}g</div><div class="nut-label">Fat</div></div>
  <div class="nut-box water"><div class="nut-val">${targets.water}L</div><div class="nut-label">Water</div></div>
</div>

${Object.keys(recentWeights).length ? `
<div class="section-heading">Recent Weight Log</div>
<div class="weight-log-list">
  ${Object.entries(recentWeights).map(([name, entries]) => `
    <div class="wl-exercise">
      <div class="wl-name">${name}</div>
      ${entries.map(e => {
        const d = new Date(e.date);
        return `<div class="wl-entry"><span class="wl-set">${e.setLabel}</span><span class="wl-weight">${e.weight} lbs</span><span class="wl-date">${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>`;
      }).join('')}
    </div>
  `).join('')}
</div>` : ''}

<div class="profile-actions">
  <button class="edit-profile-btn" id="editProfileBtn">Edit Profile</button>
</div>
<div style="height:20px"></div>`;
}
