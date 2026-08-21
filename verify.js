const VERIFY_LOCAL_KEY = 'e3rc-responsible-ai-certificate-v1';

function verifyApiBase() {
  return (window.E3RC_CONFIG && window.E3RC_CONFIG.apiBase) || '';
}

function renderVerification(record, source) {
  const target = document.getElementById('verifyResult');
  const completed = new Date(record.completedAt).toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'});
  const verified = source === 'server';
  target.innerHTML = `
    <div class="${verified ? 'success' : 'warning'}">
      <h2>${verified ? 'Certificate valid ✓' : 'Local certificate found'}</h2>
      <p><strong>${record.studentName}</strong></p>
      <p>E3RC Responsible Artificial Intelligence Certification</p>
      <p><strong>Final score:</strong> ${record.score}%<br>
      <strong>Completed:</strong> ${completed}<br>
      <strong>Curriculum:</strong> ${record.courseVersion}<br>
      <strong>Certificate ID:</strong> ${record.id}</p>
      ${verified ? '<p>This record was confirmed by the E3RC credential service.</p>' : '<p>This record exists only in this browser. It is not independently server-verified yet.</p>'}
    </div>`;
}

async function verifyCertificate() {
  const id = new URLSearchParams(location.search).get('id');
  const target = document.getElementById('verifyResult');
  if (!id) {
    target.innerHTML = '<div class="warning"><h2>Certificate ID required</h2><p>No certificate ID was provided.</p></div>';
    return;
  }

  const apiBase = verifyApiBase();
  if (apiBase) {
    try {
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/certificates/${encodeURIComponent(id)}`);
      if (response.ok) {
        renderVerification(await response.json(), 'server');
        return;
      }
      if (response.status === 404) {
        target.innerHTML = `<div class="warning"><h2>Certificate not found</h2><p>No server record exists for <strong>${id}</strong>.</p></div>`;
        return;
      }
    } catch (error) {
      console.warn('Verification service unavailable.', error);
    }
  }

  const local = JSON.parse(localStorage.getItem(VERIFY_LOCAL_KEY) || 'null');
  if (local && local.id === id) {
    renderVerification(local, 'local');
    return;
  }
  target.innerHTML = `<div class="warning"><h2>Unable to verify</h2><p>The E3RC credential service is not configured or reachable, and this browser does not contain a matching local certificate for <strong>${id}</strong>.</p></div>`;
}

verifyCertificate();
