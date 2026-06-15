const CIRC = 2 * Math.PI * 90; // 565.5

let timerInterval = null;
let timerTotal = 60;

export function startTimer(seconds, currentExercise, allExercises) {
  clearInterval(timerInterval);
  timerTotal = seconds;
  let remaining = seconds;

  const overlay  = document.getElementById('timerOverlay');
  const countEl  = document.getElementById('timerCount');
  const arc      = document.getElementById('timerArc');
  const nameEl   = document.getElementById('timerExName');
  const doneMsg  = document.getElementById('timerDoneMsg');
  const nextUp   = document.getElementById('nextUp');
  const nextName = document.getElementById('nextName');
  const nextMeta = document.getElementById('nextMeta');
  const nextPhoto= document.getElementById('nextPhoto');

  nameEl.textContent = currentExercise ? `${currentExercise.name} — Rest` : 'Rest';
  countEl.textContent = remaining;
  doneMsg.classList.remove('show');
  arc.style.strokeDashoffset = '0';

  // Next-up card
  const nextEx = allExercises
    ? allExercises.find(e => e.id > currentExercise.id)
    : null;

  function setNextPhoto(el, ex, fallbackEmoji) {
    if (ex?.image) {
      el.innerHTML = `<img src="${ex.image}" alt="${ex.name}" style="width:56px;height:56px;object-fit:cover;border-radius:6px;">`;
    } else {
      el.textContent = fallbackEmoji;
    }
  }

  if (nextEx) {
    nextName.textContent = nextEx.name;
    nextMeta.textContent = `${nextEx.sets.filter(s => !s.isWarm).length} sets · ${nextEx.restSecs}s rest`;
    setNextPhoto(nextPhoto, nextEx, nextEx.emoji);
    nextUp.classList.remove('hidden');
  } else {
    nextName.textContent = currentExercise ? 'Last one — you\'re done!' : 'Finished!';
    nextMeta.textContent = 'Cool down next';
    setNextPhoto(nextPhoto, currentExercise, '🏁');
    nextUp.classList.remove('hidden');
  }

  overlay.classList.add('show');

  timerInterval = setInterval(() => {
    remaining--;
    countEl.textContent = remaining;
    arc.style.strokeDashoffset = ((timerTotal - remaining) / timerTotal) * CIRC;

    if (remaining <= 0) {
      clearInterval(timerInterval);
      countEl.textContent = '0';
      arc.style.strokeDashoffset = CIRC;
      doneMsg.classList.add('show');
      setTimeout(() => overlay.classList.remove('show'), 1800);
    }
  }, 1000);
}

export function stopTimer() {
  clearInterval(timerInterval);
  document.getElementById('timerOverlay').classList.remove('show');
}
