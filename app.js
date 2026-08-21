const STORAGE_KEY = 'e3rc-responsible-ai-progress-v1';

let courseData;
let questionBank = [];
let progress = loadProgress();

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { completed: {}, final: null };
  } catch {
    return { completed: {}, final: null };
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  renderProgress();
  renderModules(courseData.modules);
  void window.E3RCProgressSync?.save(progress);
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderRules(rules) {
  const target = document.getElementById('rules');
  target.replaceChildren(...rules.map(rule => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<h3>${rule.label}</h3><p>${rule.description}</p>`;
    return card;
  }));
}

function renderProgress() {
  if (!courseData) return;
  const completedCount = courseData.modules.filter(m => progress.completed[m.id]).length;
  const percent = Math.round((completedCount / courseData.modules.length) * 100);
  document.getElementById('progressTitle').textContent = `${completedCount} of ${courseData.modules.length} modules complete`;
  document.getElementById('progressBar').style.width = `${percent}%`;
  const finalText = progress.final?.passed
    ? ` Final passed: ${progress.final.score}%.`
    : ' Progress is saved automatically.';
  document.getElementById('progressDetail').textContent = `${percent}% complete.${finalText}`;
}

function renderModules(modules) {
  const target = document.getElementById('modules');
  target.replaceChildren(...modules.map(module => {
    const item = document.createElement('li');
    item.className = progress.completed[module.id] ? 'complete' : '';

    const left = document.createElement('div');
    left.innerHTML = `<strong>${module.id}. ${module.title}</strong><div class="module-meta">Approx. ${module.minutes} minutes</div>`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'module-button';
    button.textContent = progress.completed[module.id] ? 'Review ✓' : 'Open';
    button.addEventListener('click', () => openModule(module));

    item.append(left, button);
    return item;
  }));
}

function questionInput(question, index, prefix) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'question-card';
  fieldset.dataset.questionId = question.id;

  const legend = document.createElement('legend');
  legend.textContent = `${index + 1}. ${question.prompt}`;
  fieldset.append(legend);

  question.choices.forEach((choice, choiceIndex) => {
    const label = document.createElement('label');
    label.className = 'choice';
    const input = document.createElement('input');
    input.type = question.type === 'multi-choice' ? 'checkbox' : 'radio';
    input.name = `${prefix}-${question.id}`;
    input.value = String(choiceIndex);
    label.append(input, document.createTextNode(choice));
    fieldset.append(label);
  });

  return fieldset;
}

function selectedAnswers(fieldset) {
  return [...fieldset.querySelectorAll('input:checked')]
    .map(input => Number(input.value))
    .sort((a, b) => a - b);
}

function answersMatch(a, b) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

async function openModule(module) {
  document.getElementById('finalPanel').classList.add('hidden');
  const panel = document.getElementById('lessonPanel');
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('lessonMeta').textContent = `Module ${module.id} • ~${module.minutes} minutes`;

  const response = await fetch(module.contentPath);
  if (!response.ok) {
    document.getElementById('lessonContent').innerHTML = '<p>Lesson content could not be loaded.</p>';
    return;
  }

  const markdown = await response.text();
  document.getElementById('lessonContent').innerHTML = DOMPurify.sanitize(marked.parse(markdown));
  renderKnowledgeCheck(module);
}

function renderKnowledgeCheck(module) {
  const target = document.getElementById('knowledgeCheck');
  const candidates = questionBank.filter(q => q.module === module.id);
  const questions = shuffle(candidates).slice(0, Math.min(3, candidates.length));

  target.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = module.id === '10' ? 'Final certification' : 'Knowledge check';
  target.append(heading);

  if (module.id === '10') {
    const note = document.createElement('p');
    note.textContent = 'Complete Modules 1–9, then take the randomized 20-question final assessment.';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Start Final Assessment';
    const prerequisitesMet = courseData.modules
      .filter(m => m.id !== '10')
      .every(m => progress.completed[m.id]);
    button.disabled = !prerequisitesMet;
    button.addEventListener('click', startFinal);
    target.append(note, button);
    return;
  }

  const form = document.createElement('form');
  questions.forEach((question, index) => form.append(questionInput(question, index, `module-${module.id}`)));

  const result = document.createElement('div');
  result.className = 'quiz-result';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Check answers';
  form.append(submit, result);

  form.addEventListener('submit', event => {
    event.preventDefault();
    let correct = 0;
    const feedback = [];

    questions.forEach((question, index) => {
      const fieldset = form.querySelector(`[data-question-id="${question.id}"]`);
      const chosen = selectedAnswers(fieldset);
      const isCorrect = answersMatch(chosen, [...question.correct].sort((a, b) => a - b));
      if (isCorrect) correct += 1;
      feedback.push(`<p><strong>${index + 1}. ${isCorrect ? 'Correct' : 'Review this one'}.</strong> ${question.explanation}</p>`);
    });

    const required = Math.ceil(questions.length * 0.67);
    if (correct >= required) {
      progress.completed[module.id] = true;
      saveProgress();
      result.innerHTML = `<div class="success"><strong>${correct}/${questions.length} correct.</strong> Module complete.</div>${feedback.join('')}`;
    } else {
      result.innerHTML = `<div class="warning"><strong>${correct}/${questions.length} correct.</strong> Review the lesson and try again.</div>${feedback.join('')}`;
    }
  });

  target.append(form);
}

function startFinal() {
  const panel = document.getElementById('finalPanel');
  document.getElementById('lessonPanel').classList.add('hidden');
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth' });

  const pool = questionBank.filter(q => q.module !== '10');
  const questions = shuffle(pool).slice(0, Math.min(courseData.finalQuestionCount, pool.length));
  const target = document.getElementById('finalContent');
  target.replaceChildren();

  const heading = document.createElement('h2');
  heading.textContent = 'Final Assessment';
  const intro = document.createElement('p');
  intro.textContent = `${questions.length} randomized questions. A score of ${courseData.passingScore}% or higher earns a passing result.`;

  const form = document.createElement('form');
  questions.forEach((question, index) => form.append(questionInput(question, index, 'final')));

  const result = document.createElement('div');
  result.className = 'quiz-result';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Submit Final Assessment';
  form.append(submit, result);

  form.addEventListener('submit', event => {
    event.preventDefault();
    let correct = 0;
    const missedModules = new Set();

    questions.forEach(question => {
      const fieldset = form.querySelector(`[data-question-id="${question.id}"]`);
      const chosen = selectedAnswers(fieldset);
      if (answersMatch(chosen, [...question.correct].sort((a, b) => a - b))) {
        correct += 1;
      } else {
        missedModules.add(question.module);
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= courseData.passingScore;
    progress.final = { score, passed, completedAt: new Date().toISOString() };
    if (passed) progress.completed['10'] = true;
    saveProgress();

    if (passed) {
      result.innerHTML = `<div class="success"><h3>Passed — ${score}%</h3><p>You have met the assessment requirement for the E3RC Responsible Artificial Intelligence Certification.</p><p>Complete the post-course check to unlock your certificate.</p></div>`;
    } else {
      const moduleNames = [...missedModules]
        .map(id => courseData.modules.find(m => m.id === id)?.title)
        .filter(Boolean)
        .join(', ');
      result.innerHTML = `<div class="warning"><h3>${score}% — not yet passing</h3><p>Review these areas before retrying: ${moduleNames || 'course concepts'}.</p><button id="retryFinal" type="button">Try another randomized final</button></div>`;
      result.querySelector('#retryFinal').addEventListener('click', startFinal);
    }
  });

  target.append(heading, intro, form);
}

function openFirstIncomplete() {
  const next = courseData.modules.find(module => !progress.completed[module.id]) || courseData.modules[0];
  openModule(next);
}

function showModules() {
  document.getElementById('lessonPanel').classList.add('hidden');
  document.getElementById('finalPanel').classList.add('hidden');
  document.getElementById('modules').scrollIntoView({ behavior: 'smooth' });
}

Promise.all([
  loadJson('content/course.json'),
  loadJson('content/questions.json')
])
  .then(([course, questions]) => {
    courseData = course;
    questionBank = questions.questions;
    renderRules(course.rules);
    renderModules(course.modules);
    renderProgress();

    document.getElementById('startButton').addEventListener('click', openFirstIncomplete);
    document.getElementById('backToModules').addEventListener('click', showModules);
    document.getElementById('backFromFinal').addEventListener('click', showModules);
  })
  .catch(error => {
    console.error(error);
    document.getElementById('modules').innerHTML = '<li>Course data could not be loaded.</li>';
  });
