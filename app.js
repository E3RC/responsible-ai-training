async function loadCourse() {
  const response = await fetch('content/course.json');
  if (!response.ok) throw new Error('Unable to load course metadata.');
  return response.json();
}

function renderRules(rules) {
  const target = document.getElementById('rules');
  target.replaceChildren(...rules.map(rule => {
    const card = document.createElement('article');
    card.className = 'card';
    const title = document.createElement('h3');
    title.textContent = rule.label;
    const body = document.createElement('p');
    body.textContent = rule.description;
    card.append(title, body);
    return card;
  }));
}

function renderModules(modules) {
  const target = document.getElementById('modules');
  target.replaceChildren(...modules.map(module => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `${module.id}. ${module.title}`;
    const meta = document.createElement('div');
    meta.className = 'module-meta';
    meta.textContent = `Approx. ${module.minutes} minutes`;
    item.append(title, meta);
    return item;
  }));
}

loadCourse()
  .then(course => {
    renderRules(course.rules);
    renderModules(course.modules);
    document.getElementById('startButton').addEventListener('click', () => {
      document.getElementById('modules').scrollIntoView({ behavior: 'smooth' });
    });
  })
  .catch(error => {
    console.error(error);
    document.getElementById('modules').innerHTML = '<li>Course metadata could not be loaded.</li>';
  });
