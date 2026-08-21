const RESUME_CODE_KEY = 'e3rc-responsible-ai-resume-code-v1';

function progressApiBase() {
  return String(window.E3RC_CONFIG?.apiBase || '').replace(/\/$/, '');
}

function formatResumeCode(code) {
  return String(code || '').replace(/[^A-Fa-f0-9]/g, '').toUpperCase().match(/.{1,4}/g)?.join('-') || '';
}

function normalizeResumeCode(code) {
  return String(code || '').replace(/[^A-Fa-f0-9]/g, '').toUpperCase().slice(0, 20);
}

function setSyncStatus(message, kind = 'muted') {
  const target = document.getElementById('syncStatus');
  if (!target) return;
  target.className = kind;
  target.textContent = message;
}

function renderResumeCode(code) {
  const normalized = normalizeResumeCode(code);
  const row = document.getElementById('resumeCodeRow');
  const value = document.getElementById('resumeCodeValue');
  if (!row || !value) return;
  if (!normalized) {
    row.classList.add('hidden');
    value.textContent = '';
    return;
  }
  row.classList.remove('hidden');
  value.textContent = formatResumeCode(normalized);
}

async function createRemoteProgress() {
  const apiBase = progressApiBase();
  if (!apiBase || !courseData) return null;

  const response = await fetch(`${apiBase}/progress`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({progress, courseVersion: courseData.version})
  });
  if (!response.ok) throw new Error('Unable to create a resume code.');
  const data = await response.json();
  const code = normalizeResumeCode(data.resumeCode);
  localStorage.setItem(RESUME_CODE_KEY, code);
  renderResumeCode(code);
  return code;
}

async function saveRemoteProgress(currentProgress = progress) {
  const apiBase = progressApiBase();
  if (!apiBase || !courseData) {
    setSyncStatus('Saved on this device. Cross-device backup becomes available when the E3RC progress service is enabled.');
    return;
  }

  try {
    setSyncStatus('Saving progress to E3RC…');
    let code = normalizeResumeCode(localStorage.getItem(RESUME_CODE_KEY));
    if (!code) code = await createRemoteProgress();
    if (!code) return;

    const response = await fetch(`${apiBase}/progress/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({progress: currentProgress, courseVersion: courseData.version})
    });
    if (!response.ok) throw new Error('Remote progress save failed.');
    const data = await response.json();
    renderResumeCode(code);
    setSyncStatus(`Saved on this device and backed up to E3RC at ${new Date(data.updatedAt).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}.`, 'success-text');
  } catch (error) {
    console.error('Progress sync failed:', error);
    setSyncStatus('Saved on this device. E3RC backup could not be updated right now.', 'warning-text');
  }
}

async function resumeFromCode(rawCode) {
  const apiBase = progressApiBase();
  if (!apiBase) throw new Error('Cross-device resume is not enabled yet.');
  const code = normalizeResumeCode(rawCode);
  if (code.length !== 20) throw new Error('Enter the complete 20-character resume code.');

  const response = await fetch(`${apiBase}/progress/${encodeURIComponent(code)}`);
  if (response.status === 404) throw new Error('That resume code was not found.');
  if (!response.ok) throw new Error('Unable to retrieve saved progress.');
  const data = await response.json();

  if (!data.progress || typeof data.progress !== 'object') throw new Error('Saved progress is invalid.');
  progress = data.progress;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  localStorage.setItem(RESUME_CODE_KEY, code);
  renderResumeCode(code);
  renderProgress();
  renderModules(courseData.modules);
  setSyncStatus(`Progress restored. Last E3RC backup: ${new Date(data.updatedAt).toLocaleString()}.`, 'success-text');
  openFirstIncomplete();
}

async function initializeProgressSync() {
  const apiBase = progressApiBase();
  const code = normalizeResumeCode(localStorage.getItem(RESUME_CODE_KEY));
  renderResumeCode(code);

  if (apiBase) {
    setSyncStatus(code ? 'Progress is saved locally and backed up to E3RC.' : 'Progress is saved locally. A private resume code will be created after your first completed step.');
  } else {
    setSyncStatus('Progress is saved automatically on this device. Cross-device resume will activate when the E3RC progress service is deployed.');
  }

  document.getElementById('copyResumeCode')?.addEventListener('click', async () => {
    const saved = normalizeResumeCode(localStorage.getItem(RESUME_CODE_KEY));
    if (!saved) return;
    await navigator.clipboard.writeText(formatResumeCode(saved));
    setSyncStatus('Resume code copied. Keep it private; anyone with the code can open this course progress.', 'success-text');
  });

  document.getElementById('resumeForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const input = document.getElementById('resumeCodeInput');
    const button = event.submitter;
    if (button) button.disabled = true;
    try {
      setSyncStatus('Loading saved progress…');
      await resumeFromCode(input.value);
      input.value = '';
    } catch (error) {
      setSyncStatus(error.message, 'warning-text');
    } finally {
      if (button) button.disabled = false;
    }
  });

  document.getElementById('createResumeCode')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try {
      let saved = normalizeResumeCode(localStorage.getItem(RESUME_CODE_KEY));
      if (!saved) saved = await createRemoteProgress();
      if (saved) {
        await saveRemoteProgress(progress);
        setSyncStatus('Resume code ready. Save or copy it before switching devices.', 'success-text');
      } else {
        setSyncStatus('Cross-device resume is not enabled yet.', 'warning-text');
      }
    } catch (error) {
      setSyncStatus(error.message, 'warning-text');
    } finally {
      event.currentTarget.disabled = false;
    }
  });
}

window.E3RCProgressSync = {save: saveRemoteProgress, resume: resumeFromCode};
initializeProgressSync().catch(error => console.error('Progress sync initialization failed:', error));
