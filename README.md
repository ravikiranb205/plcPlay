# PLC Workout PWA

A fully offline, installable progressive web app for gym workouts. No backend, no accounts, no build step — pure HTML/CSS/vanilla JS.

---

## Features

- **3 workouts** built in: Day 1 (Comeback), Day 3 (Upper Body), Day 4 (Legs)
- **Check a set → rest timer auto-starts**, with a "Next Up" card showing what's coming
- **N/A button** on each exercise reveals a free-weight alternative
- **Auto-collapse** when you mark an exercise done
- **Progress bar** in the sticky header fills as sets are checked
- **localStorage persistence** — your progress survives app close and page reload
- **History log** — every completed workout is saved with date and set count
- **PWA** — install to your home screen for full-screen offline access on iOS and Android

---

## Test Locally

You need a local server (browsers block ES modules from `file://`).

**Option A — Python (no install):**
```bash
cd /path/to/plcPlay
python3 -m http.server 8080
```
Open `http://localhost:8080` in your browser.

**Option B — VS Code Live Server:**
Install the "Live Server" extension, right-click `index.html` → Open with Live Server.

**Option C — Node `serve`:**
```bash
npx serve .
```

### Test the PWA install on mobile
Open the local server URL on your phone (your computer and phone must be on the same WiFi).
- **iOS:** Safari → Share → Add to Home Screen
- **Android:** Chrome will show an "Add to Home Screen" banner automatically

---

## Deploy Free to GitHub Pages

### Step 1: Push your code
```bash
git add .
git commit -m "Add workout PWA"
git push origin main
```

### Step 2: Enable GitHub Pages
1. Go to your repo on GitHub
2. **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **Deploy from a branch**
4. Branch: `main`, folder: `/ (root)` → click **Save**

### Step 3: Get your shareable link
After 1–2 minutes, GitHub Pages will publish your app at:
```
https://<your-username>.github.io/<repo-name>/
```
You can find the exact URL in **Settings → Pages** once it's live.

Send that URL to friends and family. They can tap "Add to Home Screen" in their browser to install it just like a native app — works fully offline after the first load.

---

## Adding a New Workout

Open `data/workouts.json` and add a new object to the array. Follow the same structure as the existing entries:

```json
{
  "id": "day5",
  "title": "Day 5 — Push",
  "subtitle": "Upper Body · Moderate",
  "gym": "Powerhouse Gym · South Lyon",
  "badges": [
    { "text": "Chest focus", "type": "alert" }
  ],
  "notice": "<strong>Today:</strong> Your notice text here.",
  "stats": { "exercises": 5, "minutes": "~50", "totalSets": 18 },
  "warmup": ["5 min cardio", "Arm circles"],
  "cooldown": ["Chest stretch · 30s"],
  "closing": "",
  "exercises": [
    {
      "id": 1,
      "name": "Barbell Bench Press",
      "emoji": "🏋️",
      "muscles": ["Chest", "Triceps"],
      "primaryMuscles": ["Pectoralis Major"],
      "secondaryMuscles": ["Triceps", "Anterior Delt"],
      "tip": "<strong>Form:</strong> Your tip here.",
      "sets": [
        { "label": "Warm", "reps": "12", "weight": "Light", "rest": 90, "isWarm": true },
        { "label": "Set 1", "reps": "8", "weight": "Moderate", "rest": 90 },
        { "label": "Set 2", "reps": "8", "weight": "Same", "rest": 90 }
      ],
      "restSecs": 90,
      "alt": {
        "name": "Dumbbell Bench Press",
        "sets": "3 sets × 8 · 90s",
        "tip": "Alternative tip here.",
        "emoji": "💪"
      }
    }
  ]
}
```

**Key rules:**
- `id` must be unique (e.g. `"day5"`, `"push-a"`)
- Exercise `id` values are just numbers, unique within that workout (1, 2, 3…)
- `isWarm: true` displays "Warm" in the set label column
- `emoji` is used as the exercise photo placeholder
- Save the file and refresh — the new workout appears on the home screen immediately

---

## File Structure

```
index.html          Home, workout, and history views
css/styles.css      All styles (dark theme, cards, timer, etc.)
js/app.js           Routing, home screen, history, PWA setup
js/workout.js       Renders a workout from JSON, wires all interactions
js/timer.js         Rest timer with SVG arc countdown and next-up panel
js/store.js         localStorage read/write helpers
data/workouts.json  All workout definitions — edit here to add/modify workouts
manifest.json       PWA manifest (name, icons, standalone mode)
sw.js               Service worker — caches everything for offline use
icons/              App icons (192×192 and 512×512 PNG)
reference/          Original standalone HTML files (for reference only)
```
