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

const hasM = (ex, ...names) => ex.muscles.some(m => names.includes(m));

Object.assign(TEMPLATES, {
  chest_tris: {
    label: 'Chest & Triceps',
    subtitle: 'Chest · Upper Chest · Triceps',
    categories: ['push'],
    match: ex => hasM(ex, 'Chest', 'Upper Chest') || (hasM(ex, 'Triceps') && !hasM(ex, 'Shoulders')),
    target: 6,
    notice: "<strong>Today's focus:</strong> Chest and triceps. Press movements first while you're fresh, then burn out the triceps with isolation work.",
    warmup: [
      '5 min treadmill brisk walk or light jog',
      '10 arm circles each direction',
      '10 push-ups (light, activate chest)',
      '10 band chest flyes or light presses'
    ],
    cooldown: [
      'Doorway chest opener · 30s',
      'Tricep overhead stretch · 30s each arm',
      'Cross-body shoulder stretch · 30s each side',
      'Deep breathing · 1 min'
    ]
  },
  back_bis: {
    label: 'Back & Biceps',
    subtitle: 'Back · Rear Delts · Biceps',
    categories: ['pull'],
    match: ex => hasM(ex, 'Back', 'Upper Back', 'Rear Delts', 'Biceps', 'Forearms'),
    target: 6,
    notice: "<strong>Today's focus:</strong> Back and biceps. Pull heavy on rows and pulldowns first, then finish the biceps with curls.",
    warmup: [
      '5 min treadmill brisk walk or light jog',
      '10 band pull-aparts',
      '10 light lat pulldowns to warm up lats',
      '10 arm circles each direction'
    ],
    cooldown: [
      'Lat stretch (hang from bar) · 30s',
      'Bicep wall stretch · 30s each arm',
      'Upper back stretch (hug yourself) · 30s',
      'Deep breathing · 1 min'
    ]
  },
  shoulders: {
    label: 'Shoulder Day',
    subtitle: 'Front · Side · Rear Delts',
    categories: ['push'],
    match: ex => hasM(ex, 'Shoulders', 'Rear Delts'),
    target: 5,
    notice: "<strong>Today's focus:</strong> All three heads of the delts. Press first, then raises — light weight, strict form, full control.",
    warmup: [
      '5 min treadmill brisk walk or light jog',
      '10 arm circles each direction',
      '10 shoulder rolls forward and back',
      '10 light lateral raises (empty hands)'
    ],
    cooldown: [
      'Cross-body shoulder stretch · 30s each side',
      'Behind-back shoulder stretch · 30s',
      'Neck side stretch · 20s each side',
      'Deep breathing · 1 min'
    ]
  },
  arms: {
    label: 'Arm Day',
    subtitle: 'Biceps · Triceps · Forearms',
    categories: ['push', 'pull'],
    match: ex => hasM(ex, 'Biceps', 'Forearms') || (hasM(ex, 'Triceps') && !hasM(ex, 'Chest', 'Upper Chest', 'Shoulders')),
    target: 6,
    notice: "<strong>Today's focus:</strong> Arms only — alternate biceps and triceps so one side rests while the other works. Chase the pump.",
    warmup: [
      '5 min treadmill brisk walk or light jog',
      '10 arm circles each direction',
      '15 light curls (empty hands or band)',
      '15 light pushdowns or band extensions'
    ],
    cooldown: [
      'Bicep wall stretch · 30s each arm',
      'Tricep overhead stretch · 30s each arm',
      'Wrist flexor stretch · 20s each side',
      'Deep breathing · 1 min'
    ]
  },
  full_body: {
    label: 'Full Body',
    subtitle: 'Push · Pull · Legs',
    categories: ['push', 'pull', 'legs'],
    target: 7,
    notice: "<strong>Today's focus:</strong> The whole body in one session — legs, pull, push in rotation. Great when training fewer days per week.",
    warmup: [
      '5 min treadmill brisk walk or light jog',
      '10 bodyweight squats (open hips)',
      '10 arm circles each direction',
      '10 band pull-aparts'
    ],
    cooldown: [
      'Quad stretch · 30s each side',
      'Seated hamstring stretch · 30s each leg',
      'Cross-body shoulder stretch · 30s each side',
      'Deep breathing · 1 min'
    ]
  }
});

const TYPE_ORDER = ['push', 'lower', 'pull', 'chest_tris', 'back_bis', 'shoulders', 'arms', 'upper', 'full_body'];

// Broad muscle families each split trains — used to rotate for recovery
const TYPE_CATS = {
  push: ['push'], lower: ['legs'], pull: ['pull'],
  chest_tris: ['push'], back_bis: ['pull'], shoulders: ['push'],
  arms: ['push', 'pull'], upper: ['push', 'pull'], full_body: ['push', 'pull', 'legs']
};

const FRIENDLY_LABELS = {
  push: 'Push Day (chest, shoulders, triceps)',
  pull: 'Pull Day (back, biceps, rear delts)',
  lower: 'Leg Day (quads, hamstrings, glutes)',
  chest_tris: 'Chest & Triceps',
  back_bis: 'Back & Biceps',
  shoulders: 'Shoulder Day (all three delt heads)',
  arms: 'Arm Day (biceps & triceps)',
  upper: 'Upper Body (full upper mix)',
  full_body: 'Full Body (push, pull, legs)'
};

function normalizeType(type) {
  if (TYPE_ORDER.includes(type)) return type;
  return 'full_body';
}

function categorize(ex) {
  const cats = new Set();
  ex.muscles.forEach(m => {
    const cat = MUSCLE_TO_CATEGORY[m];
    if (cat) cats.add(cat);
  });
  return [...cats];
}

// Normalized key for matching exercise names across sessions/variants
function recencyKey(name) {
  return name.toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\btriceps?\b/g, 'tricep')
    .replace(/\b(rope|bar|cable)\b/g, '')
    .replace(/\s+/g, ' ').trim();
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
  if (!history.length) return 'full_body';

  const typeMap = {};
  allWorkouts.forEach(w => { typeMap[w.id] = w.type; });

  // lastTypeIdx: sessions since each split was done; lastCatIdx: since each
  // muscle family (push/pull/legs) was trained. Lower index = more recent.
  const lastTypeIdx = {};
  TYPE_ORDER.forEach(t => { lastTypeIdx[t] = Infinity; });
  const lastCatIdx = { push: Infinity, pull: Infinity, legs: Infinity };

  history.forEach((entry, idx) => {
    const raw = entry.workoutType || typeMap[entry.workoutId] || 'full_body';
    // Home sessions: strength counts as a full-body day for recovery;
    // mobility/yoga/core/HIIT don't affect the gym rotation
    if (raw.startsWith('outdoor_')) return;
    if (raw.startsWith('home_') && raw !== 'home_strength') return;
    const type = normalizeType(raw === 'home_strength' ? 'full_body' : raw);
    if (lastTypeIdx[type] === Infinity) lastTypeIdx[type] = idx;
    (TYPE_CATS[type] || []).forEach(c => {
      if (lastCatIdx[c] > idx) lastCatIdx[c] = idx;
    });
  });

  // A split is only as fresh as its most-recently-trained muscle family.
  // Among equally fresh splits, prefer the one you've done least recently.
  let best = 'full_body', bestScore = -1, bestOwn = -1;
  TYPE_ORDER.forEach(t => {
    const score = Math.min(...TYPE_CATS[t].map(c => lastCatIdx[c]));
    const own = lastTypeIdx[t];
    if (score > bestScore || (score === bestScore && own > bestOwn)) {
      best = t; bestScore = score; bestOwn = own;
    }
  });

  return best;
}

function selectExercises(pool, type, history) {
  const template = TEMPLATES[type];

  const candidates = pool.filter(ex =>
    template.match
      ? template.match(ex)
      : ex._cats.some(c => template.categories.includes(c))
  );

  // How many sessions ago was each exercise last performed? Uses the
  // exercises list saved with each completed session; falls back to the
  // predefined workout's roster for old history entries.
  const nameRecency = {};
  history.forEach((h, idx) => {
    let names = h.exercises;
    if (!names) names = pool.filter(ex => ex._src === h.workoutId).map(ex => ex.name);
    (names || []).forEach(n => {
      const k = recencyKey(n);
      if (nameRecency[k] === undefined) nameRecency[k] = idx;
    });
  });

  // Collapse near-identical variants (e.g. rope/bar/cable pushdowns) so a
  // split isn't three flavors of the same movement
  const dedupeKey = recencyKey;

  const byName = {};
  candidates.forEach(ex => {
    const key = dedupeKey(ex.name);
    if (!byName[key]) byName[key] = [];
    byName[key].push(ex);
  });

  const unique = Object.values(byName).map(variants => {
    const picked = variants[Math.floor(Math.random() * variants.length)];
    const r = nameRecency[recencyKey(picked.name)];
    return { ...picked, _fresh: r === undefined ? Infinity : r };
  });

  // Hard rule: don't repeat what the last session of THIS split used.
  // Among the rest, prefer least-recently-done with random jitter so
  // sibling splits sharing a pool don't settle into fixed halves.
  const lastSameSplit = history.find(h =>
    h.exercises && normalizeType(h.workoutType || '') === type);
  const avoid = new Set((lastSameSplit?.exercises || []).map(recencyKey));

  const CAP = 8, JITTER = 4;
  const scored = unique
    .map(e => ({ ...e, _score: Math.min(e._fresh, CAP) + Math.random() * JITTER }))
    .sort((a, b) => b._score - a._score);
  const preferred = scored.filter(e => !avoid.has(recencyKey(e.name)));
  const avoided   = scored.filter(e => avoid.has(recencyKey(e.name)));
  const ordered = [...preferred, ...avoided];

  let selected;

  if (type === 'full_body') {
    // Round-robin legs / pull / push so the session hits everything
    const all = ordered;
    const legs   = all.filter(e => e._cats.includes('legs'));
    const pulls  = all.filter(e => !e._cats.includes('legs') && e._cats.includes('pull'));
    const pushes = all.filter(e => !e._cats.includes('legs') && !e._cats.includes('pull'));
    const picks = [];
    const rounds = Math.ceil(template.target / 3);
    for (let i = 0; i < rounds; i++) {
      if (legs[i])   picks.push(legs[i]);
      if (pulls[i])  picks.push(pulls[i]);
      if (pushes[i]) picks.push(pushes[i]);
    }
    selected = picks.slice(0, template.target);
  } else if (type === 'upper') {
    const all = ordered;
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
    selected = ordered.slice(0, template.target);
    // Compounds first, isolation last
    const isCompound = ex => /press|pulldown|row|deadlift|squat/i.test(ex.name);
    selected.sort((a, b) => (isCompound(b) ? 1 : 0) - (isCompound(a) ? 1 : 0));
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

// Trim exercises/sets/rest so the session fits the available minutes.
// ~0.75 min of work per set plus its rest; warmup + cooldown ≈ 8 min overhead.
export function fitToTime(exercises, minutes) {
  const shortMode = minutes <= 25;   // 20 min: 2 work sets, 45s rest cap, no warm sets
  const medMode   = minutes <= 35;   // 30 min: 3 work sets, no warm sets
  const setCap    = shortMode ? 2 : medMode ? 3 : Infinity;

  const fitted = [];
  let est = 8;

  for (const ex of exercises) {
    const clone = { ...ex };
    const restS = shortMode ? Math.min(clone.restSecs, 45) : clone.restSecs;

    let warm = clone.sets.filter(s => s.isWarm);
    let work = clone.sets.filter(s => !s.isWarm);
    if (minutes < 45) warm = [];
    work = work.slice(0, setCap);

    clone.sets = [...warm, ...work].map(s => ({ ...s, rest: Math.min(s.rest || restS, restS) }));
    clone.restSecs = restS;

    const exTime = clone.sets.length * (0.75 + restS / 60);
    if (fitted.length >= 3 && est + exTime > minutes) break;
    est += exTime;
    fitted.push(clone);
    if (fitted.length >= 3 && est >= minutes - 3) break;
  }

  return { fitted, estMinutes: Math.round(est) };
}

export function generateWorkout(allWorkouts, history, opts = {}) {
  const pool = [];
  allWorkouts.forEach(w => {
    w.exercises.forEach(ex => {
      pool.push({ ...ex, _src: w.id, _cats: categorize(ex) });
    });
  });
  (opts.extraPool || []).forEach(ex => {
    pool.push({ ...ex, _src: 'pool', _cats: categorize(ex) });
  });

  const type = pickType(allWorkouts, history);
  const template = TEMPLATES[type];
  const exercises = selectExercises(pool, type, history);

  const minutes = opts.minutes || 60;
  const { fitted, estMinutes } = fitToTime(exercises, minutes);

  const numbered = fitted.map((ex, i) => {
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
  const timeLabel = minutes >= 75 ? '60+' : String(minutes);

  const workout = {
    id: `gen_${type}_${today.toISOString().slice(0, 10)}_${minutes}m`,
    type,
    title: template.label,
    subtitle: template.subtitle,
    gym: '⚡ Powerhouse Gym · South Lyon',
    badges: [
      { text: `Smart Pick · ${dateStr}`, type: 'alert' },
      { text: `Fits ${timeLabel} min`, type: 'info' }
    ],
    notice: template.notice,
    stats: {
      exercises: numbered.length,
      minutes: `~${estMinutes}`,
      totalSets
    },
    warmup: template.warmup,
    cooldown: template.cooldown,
    closing: "<strong style='color:#c0c040;'>Nice work!</strong> This workout was built from your history. Rest up and come back stronger.",
    exercises: numbered
  };

  let reason = buildReason(type, history, allWorkouts);
  reason += ` Trimmed to fit your <strong>${timeLabel}-minute</strong> window.`;

  return { workout, reason };
}
