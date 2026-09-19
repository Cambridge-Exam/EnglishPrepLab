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

const answerGroups = {
  Grammar: { g1: 'a', g2: 'b', g3: 'b', g4: 'b', g5: 'b', g6: 'b', g7: 'a', g8: 'b' },
  Vocabulary: { v1: 'b', v2: 'a', v3: 'a', v4: 'a' },
  Reading: { r1: 'a', r2: 'a', r3: 'b' },
  'Use of English': { u1: 'a', u2: 'a', u3: 'a', u4: 'since', u5: 'had', u6: 'whose', u7: 'accessible', u8: 'helpful', u9: "doesn't have to bring", u10: 'promised to send' },
  Listening: { l1: 'c' },
};

let recorder;
let stream;
let recordingUrl;
let recordedBlob;

function preferredMimeType() {
  return ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4']
    .find((type) => MediaRecorder.isTypeSupported(type));
}

startButton.addEventListener('click', async () => {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    status.textContent = 'Recording is not supported by this browser. Please use a recent Chrome, Edge, or Firefox browser.';
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    const mimeType = preferredMimeType();
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size) chunks.push(event.data);
    });
    recorder.addEventListener('stop', () => {
      recordedBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      recordingUrl = URL.createObjectURL(recordedBlob);
      preview.src = recordingUrl;
      preview.hidden = false;
      downloadButton.disabled = false;
      stream.getTracks().forEach((track) => track.stop());
      status.textContent = 'Recording ready. Listen to it or save a copy.';
    });
    recorder.start();
    startButton.disabled = true;
    stopButton.disabled = false;
    status.textContent = 'Recording… Click “Stop recording” when you are finished.';
  } catch (error) {
    status.textContent = error.name === 'NotAllowedError'
      ? 'Microphone permission was refused. Allow microphone access and try again.'
      : 'The microphone could not be started. Check that it is connected and not in use by another app.';
  }
});

stopButton.addEventListener('click', () => {
  if (recorder?.state === 'recording') recorder.stop();
  startButton.disabled = false;
  stopButton.disabled = true;
});

downloadButton.addEventListener('click', () => {
  const extension = recordedBlob.type.includes('ogg') ? 'ogg' : recordedBlob.type.includes('mp4') ? 'm4a' : 'webm';
  const link = document.createElement('a');
  link.href = recordingUrl;
  link.download = `speaking-response.${extension}`;
  link.click();
});

window.addEventListener('beforeunload', () => recordingUrl && URL.revokeObjectURL(recordingUrl));

function updateWordCount() {
  const words = writing.value.trim().match(/\S+/g)?.length || 0;
  wordCount.textContent = `${words} word${words === 1 ? '' : 's'}`;
}

function restoreResponses() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved?.responses) return;
    Object.entries(saved.responses).forEach(([name, value]) => {
      const fields = form.elements.namedItem(name);
      if (!fields) return;
      if (fields instanceof RadioNodeList) {
        const selected = [...fields].find((field) => field.value === value);
        if (selected) selected.checked = true;
      } else fields.value = value;
    });
    saveStatus.textContent = 'Saved responses restored from this browser.';
    showPhaseTwo(saved.responses);
  } catch { localStorage.removeItem(storageKey); }
}

function normalise(value) {
  return String(value || '').trim().toLowerCase().replace(/[.!,?]/g, '').replace(/\s+/g, ' ');
}

function levelFor(score, total) {
  const percentage = score / total;
  if (percentage >= .88) return 'performance compatible with B2 or above';
  if (percentage >= .70) return 'performance compatible with B1+';
  if (percentage >= .50) return 'performance compatible with B1';
  return 'performance currently below B1 on this section';
}

function showPhaseTwo(responses) {
  let totalCorrect = 0;
  let totalQuestions = 0;
  resultSummary.replaceChildren();
  Object.entries(answerGroups).forEach(([skill, answers]) => {
    const entries = Object.entries(answers);
    const correct = entries.filter(([name, answer]) => normalise(responses[name]) === normalise(answer)).length;
    totalCorrect += correct;
    totalQuestions += entries.length;
    const row = document.createElement('div');
    row.className = 'result-row';
    row.innerHTML = `<strong>${skill}</strong><span>${correct}/${entries.length}</span><span>${levelFor(correct, entries.length)}</span>`;
    resultSummary.append(row);
  });
  const objectiveLevel = levelFor(totalCorrect, totalQuestions);
  phaseTwoIntro.textContent = `Measured result for the automatically marked sections: ${totalCorrect}/${totalQuestions}. Your provisional overall result is ${objectiveLevel}. It remains incomplete until Writing and Speaking have been reviewed.`;
  phaseTwo.hidden = false;
  phaseTwo.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

writing.addEventListener('input', updateWordCount);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const responses = Object.fromEntries(new FormData(form).entries());
  localStorage.setItem(storageKey, JSON.stringify({ savedAt: new Date().toISOString(), responses }));
  saveStatus.textContent = 'Your written and selected responses have been saved on this device.';
  showPhaseTwo(responses);
});
clearButton.addEventListener('click', () => {
  localStorage.removeItem(storageKey);
  form.reset();
  updateWordCount();
  saveStatus.textContent = 'Saved written and selected responses have been cleared from this device.';
  phaseTwo.hidden = true;
});
restoreResponses();
updateWordCount();
