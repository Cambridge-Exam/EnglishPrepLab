const startButton = document.querySelector('#start-recording');
const stopButton = document.querySelector('#stop-recording');
const downloadButton = document.querySelector('#download-recording');
const status = document.querySelector('#recording-status');
const preview = document.querySelector('#recording-preview');
const form = document.querySelector('#diagnostic-form');
const writing = document.querySelector('#writing');
const wordCount = document.querySelector('#word-count');
const saveStatus = document.querySelector('#save-status');
const clearButton = document.querySelector('#clear');
const storageKey = 'cambridge-diagnostic-student-responses-v1';
const phaseTwo = document.querySelector('#phase-2');
const phaseTwoIntro = document.querySelector('#phase-2-intro');
const resultSummary = document.querySelector('#result-summary');

// ============================================================
// TIMER
// ============================================================

const TOTAL_TIME_SECONDS = 75 * 60;
const timerElement = document.querySelector('#timer');
const timerContainer = document.querySelector('#timer-container');

let remainingTime = TOTAL_TIME_SECONDS;
let timerInterval = null;
let timerStarted = false;
let warning30Shown = false;
let timeoutShown = false;
let timerStartTime = null;

// ============================================================
// ANSWERS
// ============================================================

const answerGroups = {
  Grammar: {
    g1: 'a',
    g2: 'b',
    g3: 'b',
    g4: 'b',
    g5: 'b',
    g6: 'b',
    g7: 'a',
    g8: 'b'
  },

  Vocabulary: {
    v1: 'b',
    v2: 'a',
    v3: 'a',
    v4: 'a'
  },

  Reading: {
    r1: 'a',
    r2: 'a',
    r3: 'b'
  },

  'Use of English': {
    u1: 'a',
    u2: 'a',
    u3: 'a',
    u4: 'since',
    u5: 'had',
    u6: 'whose',
    u7: 'accessible',
    u8: 'helpful',
    u9: "doesn't have to bring",
    u10: 'promised to send'
  },

  Listening: {
    l1: 'c'
  },
};

// ============================================================
// RECORDING
// ============================================================

let recorder;
let stream;
let recordingUrl;
let recordedBlob;

function preferredMimeType() {
  return [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ].find((type) => MediaRecorder.isTypeSupported(type));
}

startButton.addEventListener('click', async () => {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    status.textContent =
      'Recording is not supported by this browser. Please use a recent Chrome, Edge, or Firefox browser.';
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const chunks = [];
    const mimeType = preferredMimeType();

    recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    );

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size) chunks.push(event.data);
    });

    recorder.addEventListener('stop', () => {
      recordedBlob = new Blob(chunks, {
        type: recorder.mimeType || 'audio/webm'
      });

      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }

      recordingUrl = URL.createObjectURL(recordedBlob);
      preview.src = recordingUrl;
      preview.hidden = false;
      downloadButton.disabled = false;

      stream.getTracks().forEach((track) => track.stop());

      status.textContent =
        'Recording ready. Listen to it or save a copy.';
    });

    recorder.start();

    startButton.disabled = true;
    stopButton.disabled = false;

    status.textContent =
      'Recording… Click “Stop recording” when you are finished.';
  } catch (error) {
    status.textContent =
      error.name === 'NotAllowedError'
        ? 'Microphone permission was refused. Allow microphone access and try again.'
        : 'The microphone could not be started. Check that it is connected and not in use by another app.';
  }
});

stopButton.addEventListener('click', () => {
  if (recorder?.state === 'recording') {
    recorder.stop();
  }

  startButton.disabled = false;
  stopButton.disabled = true;
});

downloadButton.addEventListener('click', () => {
  const extension = recordedBlob.type.includes('ogg')
    ? 'ogg'
    : recordedBlob.type.includes('mp4')
      ? 'm4a'
      : 'webm';

  const link = document.createElement('a');
  link.href = recordingUrl;
  link.download = `speaking-response.${extension}`;
  link.click();
});

window.addEventListener('beforeunload', () => {
  if (recordingUrl) {
    URL.revokeObjectURL(recordingUrl);
  }
});

// ============================================================
// TIMER FUNCTIONS
// ============================================================

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  if (!timerElement) return;

  timerElement.textContent = formatTime(remainingTime);
}

function getElapsedTime() {
  return TOTAL_TIME_SECONDS - remainingTime;
}

function startTimer() {
  if (timerStarted) return;

  timerStarted = true;
  timerStartTime = Date.now();

  timerInterval = setInterval(() => {
    if (remainingTime <= 0) {
      clearInterval(timerInterval);

      remainingTime = 0;
      updateTimerDisplay();

      if (timerContainer) {
        timerContainer.classList.remove(
          'timer-warning',
          'timer-critical'
        );
        timerContainer.classList.add('timer-finished');
      }

      if (!timeoutShown) {
        timeoutShown = true;

        alert(
          'Time is up!\n\n' +
          'The recommended 75 minutes have finished.\n\n' +
          'You can still complete and save your answers.'
        );
      }

      return;
    }

    remainingTime -= 1;
    updateTimerDisplay();

    // 30 minutes remaining
    if (remainingTime === 30 * 60 && !warning30Shown) {
      warning30Shown = true;

      if (timerContainer) {
        timerContainer.classList.add('timer-warning');
      }

      alert(
        '30 minutes remaining!\n\n' +
        'Try to manage your time carefully and make sure you complete all sections.'
      );
    }

    // Last 5 minutes
    if (remainingTime <= 5 * 60 && timerContainer) {
      timerContainer.classList.add('timer-critical');
    }
  }, 1000);
}

// Start timer when Sarah actually begins the test.
form.addEventListener('input', startTimer);
form.addEventListener('change', startTimer);

updateTimerDisplay();

// ============================================================
// WORD COUNT
// ============================================================

function updateWordCount() {
  const words =
    writing.value.trim().match(/\S+/g)?.length || 0;

  wordCount.textContent =
    `${words} word${words === 1 ? '' : 's'}`;
}

// ============================================================
// RESTORE RESPONSES
// ============================================================

function restoreResponses() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(storageKey)
    );

    if (!saved?.responses) return;

    Object.entries(saved.responses).forEach(([name, value]) => {
      const fields = form.elements.namedItem(name);

      if (!fields) return;

      if (fields instanceof RadioNodeList) {
        const selected = [...fields].find(
          (field) => field.value === value
        );

        if (selected) {
          selected.checked = true;
        }
      } else {
        fields.value = value;
      }
    });

    // Restore timer information if available
    if (typeof saved.remainingTime === 'number') {
      remainingTime = Math.max(
        0,
        Math.min(TOTAL_TIME_SECONDS, saved.remainingTime)
      );
    }

    updateTimerDisplay();

    saveStatus.textContent =
      'Saved responses restored from this browser.';

    showPhaseTwo(
      saved.responses,
      saved.elapsedTime
    );

  } catch {
    localStorage.removeItem(storageKey);
  }
}

// ============================================================
// SCORING
// ============================================================

function normalise(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[.!,?]/g, '')
    .replace(/\s+/g, ' ');
}

function levelFor(score, total) {
  const percentage = score / total;

  if (percentage >= 0.88) {
    return 'performance compatible with B2 or above';
  }

  if (percentage >= 0.70) {
    return 'performance compatible with B1+';
  }

  if (percentage >= 0.50) {
    return 'performance compatible with B1';
  }

  return 'performance currently below B1 on this section';
}

function showPhaseTwo(responses, elapsedTime = null) {
  let totalCorrect = 0;
  let totalQuestions = 0;

  resultSummary.replaceChildren();

  Object.entries(answerGroups).forEach(
    ([skill, answers]) => {
      const entries = Object.entries(answers);

      const correct = entries.filter(
        ([name, answer]) =>
          normalise(responses[name]) === normalise(answer)
      ).length;

      totalCorrect += correct;
      totalQuestions += entries.length;

      const row = document.createElement('div');

      row.className = 'result-row';

      row.innerHTML = `
        <strong>${skill}</strong>
        <span>${correct}/${entries.length}</span>
        <span>${levelFor(correct, entries.length)}</span>
      `;

      resultSummary.append(row);
    }
  );

  const objectiveLevel =
    levelFor(totalCorrect, totalQuestions);

  let timeMessage = '';

  if (typeof elapsedTime === 'number') {
    timeMessage =
      ` Time used: ${formatTime(elapsedTime)}.`;
  }

  phaseTwoIntro.textContent =
    `Measured result for the automatically marked sections: ` +
    `${totalCorrect}/${totalQuestions}. ` +
    `Your provisional overall result is ${objectiveLevel}.` +
    `${timeMessage} ` +
    `It remains incomplete until Writing and Speaking have been reviewed.`;

  phaseTwo.hidden = false;

  phaseTwo.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// ============================================================
// SAVE
// ============================================================

writing.addEventListener('input', updateWordCount);

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const responses = Object.fromEntries(
    new FormData(form).entries()
  );

  const elapsedTime = getElapsedTime();

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      savedAt: new Date().toISOString(),
      responses,
      remainingTime,
      elapsedTime
    })
  );

  saveStatus.textContent =
    'Your written and selected responses have been saved on this device.';

  showPhaseTwo(responses, elapsedTime);
});

// ============================================================
// CLEAR
// ============================================================

clearButton.addEventListener('click', () => {
  localStorage.removeItem(storageKey);

  form.reset();

  updateWordCount();

  // Reset timer
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  remainingTime = TOTAL_TIME_SECONDS;
  timerStarted = false;
  warning30Shown = false;
  timeoutShown = false;
  timerStartTime = null;

  if (timerContainer) {
    timerContainer.classList.remove(
      'timer-warning',
      'timer-critical',
      'timer-finished'
    );
  }

  updateTimerDisplay();

  saveStatus.textContent =
    'Saved written and selected responses have been cleared from this device.';

  phaseTwo.hidden = true;
});

// ============================================================
// INITIALISATION
// ============================================================

restoreResponses();
updateWordCount();
updateTimerDisplay();