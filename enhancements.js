let prepostData = null;

async function waitForCourseRuntime() {
  for (let i = 0; i < 100; i += 1) {
    if (typeof courseData !== 'undefined' && courseData && Array.isArray(questionBank)) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Course runtime did not initialize.');
}

function assessmentAnswersMatch(a, b) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function renderMeasurement(mode) {
  const panel = document.getElementById('measurementPanel');
  const title = document.getElementById('measurementTitle');
  const intro = document.getElementById('measurementIntro');
  const target = document.getElementById('measurementContent');
  panel.classList.remove('hidden');
  title.textContent = mode === 'pre' ? 'Before you begin' : 'Post-course knowledge check';
  intro.textContent = mode === 'pre'
    ? 'This 10-question baseline does not affect certification. It helps E3RC measure what students learn.'
    : 'Answer the same concepts again so E3RC can measure learning improvement. This does not change your passing final score.';
  target.replaceChildren();

  const form = document.createElement('form');
  prepostData.questions.forEach((question, index) => form.append(questionInput(question, index, `${mode}-assessment`)));
  const result = document.createElement('div');
  result.className = 'quiz-result';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = mode === 'pre' ? 'Save baseline and start course' : 'Finish post-course check';
  form.append(submit, result);

  form.addEventListener('submit', event => {
    event.preventDefault();
    let correct = 0;
    prepostData.questions.forEach(question => {
      const fieldset = form.querySelector(`[data-question-id="${question.id}"]`);
      const chosen = selectedAnswers(fieldset);
      if (assessmentAnswersMatch(chosen, [...question.correct].sort((a,b) => a-b))) correct += 1;
    });
    const score = Math.round((correct / prepostData.questions.length) * 100);
    progress.measurement = progress.measurement || {};
    progress.measurement[mode] = {score, completedAt:new Date().toISOString()};
    saveProgress();

    if (mode === 'pre') {
      result.innerHTML = `<div class="success"><strong>Baseline saved: ${score}%.</strong> This score does not count toward certification.</div>`;
      document.getElementById('startButton').disabled = false;
      setTimeout(() => {
        panel.classList.add('hidden');
        openFirstIncomplete();
      }, 500);
    } else {
      const pre = progress.measurement.pre?.score;
      const delta = typeof pre === 'number' ? score - pre : null;
      const improvement = delta === null ? '' : ` Knowledge change: ${delta >= 0 ? '+' : ''}${delta} percentage points.`;
      result.innerHTML = `<div class="success"><strong>Post-course score: ${score}%.</strong>${improvement}</div>`;
      setTimeout(() => {
        panel.classList.add('hidden');
        showCertificatePanel(progress.final.score, courseData.version);
      }, 600);
    }
  });

  target.append(form);
  panel.scrollIntoView({behavior:'smooth'});
}

async function initializeEnhancements() {
  await waitForCourseRuntime();
  const [extra, prepost] = await Promise.all([
    loadJson('content/questions-extra.json'),
    loadJson('content/prepost.json')
  ]);
  questionBank.push(...extra.questions);
  prepostData = prepost;
  progress.measurement = progress.measurement || {};

  const startButton = document.getElementById('startButton');
  if (!progress.measurement.pre) {
    startButton.disabled = true;
    renderMeasurement('pre');
  }

  let lastHandledFinal = progress.final?.completedAt || null;
  setInterval(() => {
    if (!progress.final?.passed) return;
    if (progress.measurement.post && !localStorage.getItem('e3rc-responsible-ai-certificate-v1')) {
      showCertificatePanel(progress.final.score, courseData.version);
      return;
    }
    if (!progress.measurement.post && progress.final.completedAt !== lastHandledFinal) {
      lastHandledFinal = progress.final.completedAt;
      renderMeasurement('post');
    }
  }, 400);

  if (progress.final?.passed && !progress.measurement.post) renderMeasurement('post');
  if (progress.final?.passed && progress.measurement.post) showCertificatePanel(progress.final.score, courseData.version);
}

initializeEnhancements().catch(error => console.error('Enhancement initialization failed:', error));
