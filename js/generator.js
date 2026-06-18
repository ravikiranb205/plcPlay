const MUSCLE_TO_CATEGORY = {
  'Back': 'pull', 'Upper Back': 'pull', 'Biceps': 'pull',
  'Rear Delts': 'pull', 'Forearms': 'pull',
  'Chest': 'push', 'Upper Chest': 'push', 'Shoulders': 'push',
  'Triceps': 'push',
  'Quads': 'legs', 'Glutes': 'legs', 'Hamstrings': 'legs',
  'Calves': 'legs', 'Core': 'legs'
};

const TEMPLATES = {
  push: {
    label: 'Push Day',
    subtitle: 'Chest · Shoulders · Triceps',
    categories: ['push'],
    target: 6,
    notice: "<strong>Today's focus:</strong> Push muscles — chest, shoulders, triceps. Heavy compounds first, finish with isolation work.",
    warmup: [
      '5 min treadmill brisk walk or light jog',
      '10 arm circles each direction',
      '10 shoulder rolls',
      '10 push-ups (light, activate chest and triceps)'
    ],
    cooldown: [
      'Cross-body shoulder stretch · 30s each side',
      'Doorway chest opener · 30s',
      'Tricep overhead stretch · 30s each arm',
      'Deep breathing · 1 min'
    ]
  },
  pull: {
    label: 'Pull Day',
    subtitle: 'Back · Biceps · Rear Delts',
    categories: ['pull'],
    target: 6,
    notice: "<strong>Today's focus:</strong> Pull muscles — back, biceps, rear delts. Squeeze at the top of every rep. Mind-muscle connection is king.",
    warmup: [
      '5 min treadmill brisk walk or light jog',
      '10 arm circles each direction',
      '10 band pull-aparts or light reverse flyes',
      '10 light lat pulldowns to warm up lats'
    ],
    cooldown: [
      'Lat stretch (hang from bar) · 30s',
      'Cross-body shoulder stretch · 30s each side',
      'Bicep wall stretch · 30s each arm',
      'Deep breathing · 1 min'
    ]
  },
  lower: {
    label: 'Leg Day',
    subtitle: 'Quads · Hamstrings · Glutes · Core',
    categories: ['legs'],
    target: 6,
    notice: "<strong>Today's focus:</strong> Lower body and core. Prioritize form over weight — knees tracking over toes, full range of motion.",
    warmup: [
      '5 min treadmill brisk walk or light jog',
      '10 bodyweight squats (open hips)',
      '10 leg swings each side',
      '10 glute bridges'
    ],
    cooldown: [
      'Quad stretch · 30s each side',
      'Seated hamstring stretch · 30s each leg',
      'Pigeon stretch · 30s each side',
      'Deep breathing · 1 min'
    ]
  },
  upper: {
    label: 'Upper Body',
    subtitle: 'Chest · Back · Shoulders · Arms',
    categories: ['push', 'pull'],
    target: 7,
    notice: "<strong>Today's focus:</strong> Full upper body — alternating push and pull for balanced training and active recovery between sets.",
    warmup: [
      '5 min treadmill brisk walk or light jog',
      '10 arm circles each direction',
      '10 shoulder rolls',
      '10 band pull-aparts or light shoulder work'
    ],
    cooldown: [
      'Cross-body shoulder stretch · 30s each side',
      'Doorway chest opener · 30s',
      'Lat stretch · 30s each side',
      'Deep breathing · 1 min'
    ]
  }
};

const TYPE_ORDER = ['push', 'lower', 'pull', 'upper'];

const FRIENDLY_LABELS = {
  push: 'Push Day (chest, shoulders, triceps)',
  pull: 'Pull Day (back, biceps, rear delts)',
  lower: 'Leg Day (quads, hamstrings, glutes)',
  upper: 'Upper Body (full upper mix)'
};

function normalizeType(type) {
  if (type === 'full_body') return 'upper';
  if (TYPE_ORDER.includes(type)) return type;
  return 'upper';
}

function categorize(ex) {
  const cats = new Set();
  ex.muscles.forEach(m => {
    const cat = MUSCLE_TO_CATEGORY[m];
    if (cat) cats.add(cat);
  });
  return [...cats];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickType(allWorkouts, history) {
  if (!history.length) return 'upper';

  const typeMap = {};
  allWorkouts.forEach(w => { typeMap[w.id] = w.type; });

  const lastDone = {};
  TYPE_ORDER.forEach(t => { lastDone[t] = Infinity; });

  history.forEach((entry, idx) => {
    const raw = entry.workoutType || typeMap[entry.workoutId] || 'upper';
    const type = normalizeType(raw);
    if (lastDone[type] === Infinity) lastDone[type] = idx;
  });

  let best = TYPE_ORDER[0];
  let bestScore = -1;
  TYPE_ORDER.forEach(t => {
    if (lastDone[t] > bestScore) {
      bestScore = lastDone[t];
      best = t;
    }
  });

  return best;
}

function selectExercises(pool, type, history) {
  const template = TEMPLATES[type];

  const candidates = pool.filter(ex =>
    ex._cats.some(c => template.categories.includes(c))
  );

  const lastWorkoutExNames = new Set();
  if (history.length > 0) {
    const lastId = history[0].workoutId;
    pool.filter(ex => ex._src === lastId).forEach(ex => lastWorkoutExNames.add(ex.name));
  }

  const byName = {};
  candidates.forEach(ex => {
    if (!byName[ex.name]) byName[ex.name] = [];
    byName[ex.name].push(ex);
  });

  const unique = Object.entries(byName).map(([name, variants]) => {
    const picked = variants[Math.floor(Math.random() * variants.length)];
    return { ...picked, _wasRecent: lastWorkoutExNames.has(name) };
  });

  const fresh = unique.filter(ex => !ex._wasRecent);
  const recent = unique.filter(ex => ex._wasRecent);

  let selected;

  if (type === 'upper') {
    const all = shuffle([...fresh, ...recent]);
    const pushExs = all.filter(ex => ex._cats.includes('push') && !ex._cats.includes('pull'));
    const pullExs = all.filter(ex => ex._cats.includes('pull') && !ex._cats.includes('push'));
    const mixed = all.filter(ex => ex._cats.includes('pull') && ex._cats.includes('push'));

    const half = Math.ceil(template.target / 2);
    const picks = [];
    picks.push(...pullExs.slice(0, half));
    picks.push(...pushExs.slice(0, half));
    picks.push(...mixed);
    selected = picks.slice(0, template.target);

    const interleaved = [];
    const p = selected.filter(e => !e._cats.includes('pull'));
    const l = selected.filter(e => e._cats.includes('pull'));
    const maxLen = Math.max(p.length, l.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < l.length) interleaved.push(l[i]);
      if (i < p.length) interleaved.push(p[i]);
    }
    selected = interleaved;
  } else {
    selected = [...shuffle(fresh), ...shuffle(recent)].slice(0, template.target);
  }

  if (selected.length < 3 && candidates.length >= 3) {
    selected = shuffle(candidates)
      .filter((ex, i, arr) => arr.findIndex(e => e.name === ex.name) === i)
      .slice(0, template.target);
  }

  return selected;
}

function buildReason(type, history, allWorkouts) {
  if (!history.length) {
    return `No workout history yet. Starting with <strong>${FRIENDLY_LABELS[type]}</strong> to build a solid foundation.`;
  }

  const last = history[0];
  const lastDate = new Date(last.date);
  const hoursAgo = Math.round((Date.now() - lastDate) / 36e5);
  const daysAgo = hoursAgo < 24 ? 'today' : hoursAgo < 48 ? 'yesterday' : `${Math.floor(hoursAgo / 24)}d ago`;

  let reason = `Last session: <strong>${last.workoutTitle}</strong> (${daysAgo}).`;
  reason += ` Today's smart pick: <strong>${FRIENDLY_LABELS[type]}</strong> — targets muscles you haven't hit recently.`;

  if (hoursAgo < 18) {
    reason += ' ⚠️ You trained recently — listen to your body.';
  }

  return reason;
}

export function generateWorkout(allWorkouts, history) {
  const pool = [];
  allWorkouts.forEach(w => {
    w.exercises.forEach(ex => {
      pool.push({ ...ex, _src: w.id, _cats: categorize(ex) });
    });
  });

  const type = pickType(allWorkouts, history);
  const template = TEMPLATES[type];
  const exercises = selectExercises(pool, type, history);

  const numbered = exercises.map((ex, i) => {
    const clean = { ...ex };
    delete clean._src;
    delete clean._cats;
    delete clean._wasRecent;
    clean.id = i + 1;
    return clean;
  });

  const totalSets = numbered.reduce((a, ex) => a + ex.sets.length, 0);
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const workout = {
    id: `gen_${type}_${today.toISOString().slice(0, 10)}`,
    type,
    title: template.label,
    subtitle: template.subtitle,
    gym: '⚡ Powerhouse Gym · South Lyon',
    badges: [
      { text: `Smart Pick · ${dateStr}`, type: 'alert' },
      { text: 'Generated from history', type: 'info' }
    ],
    notice: template.notice,
    stats: {
      exercises: numbered.length,
      minutes: `~${Math.round(totalSets * 2.5)}`,
      totalSets
    },
    warmup: template.warmup,
    cooldown: template.cooldown,
    closing: "<strong style='color:#c0c040;'>Nice work!</strong> This workout was built from your history. Rest up and come back stronger.",
    exercises: numbered
  };

  const reason = buildReason(type, history, allWorkouts);

  return { workout, reason };
}
