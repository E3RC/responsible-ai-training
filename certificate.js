const CERT_STORAGE_KEY = 'e3rc-responsible-ai-certificate-v1';

function certEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function localCertificateId() {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const suffix = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `E3RC-AI-1555-2026-${suffix}`;
}

function certificateApiBase() {
  return (window.E3RC_CONFIG && window.E3RC_CONFIG.apiBase) || '';
}

async function issueCertificateRecord(payload) {
  const apiBase = certificateApiBase();
  if (apiBase) {
    try {
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/certificates`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const record = await response.json();
        return {...record, serverVerified: true};
      }
    } catch (error) {
      console.warn('Certificate API unavailable; using local fallback.', error);
    }
  }

  return {
    id: localCertificateId(),
    studentName: payload.studentName,
    score: payload.score,
    courseVersion: payload.courseVersion,
    completedAt: payload.completedAt,
    serverVerified: false
  };
}

function verificationUrl(record) {
  const url = new URL('verify.html', window.location.href);
  url.searchParams.set('id', record.id);
  return url.toString();
}

function qrDataUrl(text) {
  if (typeof qrcode !== 'function') return '';
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createDataURL(6, 4);
}

function renderCertificatePreview(record) {
  const target = document.getElementById('certificatePreview');
  const verifyUrl = verificationUrl(record);
  const qr = qrDataUrl(verifyUrl);
  const completed = new Date(record.completedAt).toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'});

  target.innerHTML = `
    <div class="certificate-sheet">
      <div class="certificate-kicker">E3 Robotics Center • FRC Team 1555</div>
      <h2>Certificate of Completion</h2>
      <p class="certificate-subtitle">E3RC Responsible Artificial Intelligence Certification</p>
      <p>This certifies that</p>
      <div class="certificate-name">${certEscape(record.studentName)}</div>
      <p>successfully completed training in responsible AI use, engineering, academic integrity, privacy, digital citizenship, and ethical decision-making.</p>
      <div class="certificate-grid">
        <div><strong>Final score</strong><br>${record.score}%</div>
        <div><strong>Completed</strong><br>${certEscape(completed)}</div>
        <div><strong>Curriculum</strong><br>${certEscape(record.courseVersion)}</div>
        <div><strong>Certificate ID</strong><br>${certEscape(record.id)}</div>
      </div>
      <div class="certificate-bottom">
        <div>
          <strong>Responsible AI Five</strong><br>
          VERIFY • PROTECT • DISCLOSE • RESPECT • OWN IT
          <p class="muted small">This is an E3 Robotics Center credential and is not an official FIRST certification.</p>
        </div>
        ${qr ? `<img class="certificate-qr" src="${qr}" alt="Certificate verification QR code">` : ''}
      </div>
    </div>`;
}

async function downloadCertificatePdf(record) {
  if (!window.jspdf?.jsPDF) {
    alert('PDF library did not load. Use Print / Save as PDF instead.');
    return;
  }
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({orientation: 'landscape', unit: 'pt', format: 'letter'});
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const completed = new Date(record.completedAt).toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'});
  const verifyUrl = verificationUrl(record);
  const qr = qrDataUrl(verifyUrl);

  doc.setLineWidth(3);
  doc.rect(24, 24, width - 48, height - 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('E3 ROBOTICS CENTER • FRC TEAM 1555', width / 2, 70, {align:'center'});
  doc.setFontSize(30);
  doc.text('CERTIFICATE OF COMPLETION', width / 2, 120, {align:'center'});
  doc.setFontSize(18);
  doc.text('E3RC Responsible Artificial Intelligence Certification', width / 2, 155, {align:'center'});
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text('This certifies that', width / 2, 205, {align:'center'});
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(record.studentName, width / 2, 248, {align:'center'});
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const body = 'successfully completed training in responsible AI use, engineering, academic integrity, privacy, digital citizenship, and ethical decision-making.';
  doc.text(doc.splitTextToSize(body, 570), width / 2, 285, {align:'center'});
  doc.setFontSize(11);
  doc.text(`Final score: ${record.score}%`, 90, 360);
  doc.text(`Completed: ${completed}`, 90, 382);
  doc.text(`Curriculum: ${record.courseVersion}`, 90, 404);
  doc.text(`Certificate ID: ${record.id}`, 90, 426);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFY • PROTECT • DISCLOSE • RESPECT • OWN IT', 90, 465);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('E3 Robotics Center credential — not an official FIRST certification.', 90, 492);
  if (qr) doc.addImage(qr, 'PNG', width - 180, 360, 105, 105);
  doc.save(`${record.studentName.replace(/[^a-z0-9]+/gi, '-')}-E3RC-Responsible-AI-Certificate.pdf`);
}

function downloadCertificateSvg(record) {
  const completed = new Date(record.completedAt).toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'});
  const verifyUrl = verificationUrl(record);
  const qr = qrDataUrl(verifyUrl);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="850" viewBox="0 0 1100 850">
    <rect width="1100" height="850" fill="white"/><rect x="30" y="30" width="1040" height="790" fill="none" stroke="#102133" stroke-width="5"/>
    <text x="550" y="100" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700">E3 ROBOTICS CENTER • FRC TEAM 1555</text>
    <text x="550" y="175" text-anchor="middle" font-family="Arial" font-size="46" font-weight="700">CERTIFICATE OF COMPLETION</text>
    <text x="550" y="225" text-anchor="middle" font-family="Arial" font-size="25">E3RC Responsible Artificial Intelligence Certification</text>
    <text x="550" y="300" text-anchor="middle" font-family="Arial" font-size="20">This certifies that</text>
    <text x="550" y="365" text-anchor="middle" font-family="Arial" font-size="44" font-weight="700">${certEscape(record.studentName)}</text>
    <text x="550" y="420" text-anchor="middle" font-family="Arial" font-size="18">successfully completed E3RC training in responsible and ethical use of artificial intelligence.</text>
    <text x="100" y="525" font-family="Arial" font-size="18">Final score: ${record.score}%</text>
    <text x="100" y="560" font-family="Arial" font-size="18">Completed: ${certEscape(completed)}</text>
    <text x="100" y="595" font-family="Arial" font-size="18">Curriculum: ${certEscape(record.courseVersion)}</text>
    <text x="100" y="630" font-family="Arial" font-size="18">Certificate ID: ${certEscape(record.id)}</text>
    <text x="100" y="700" font-family="Arial" font-size="18" font-weight="700">VERIFY • PROTECT • DISCLOSE • RESPECT • OWN IT</text>
    ${qr ? `<image href="${qr}" x="835" y="525" width="170" height="170"/>` : ''}
    <text x="550" y="775" text-anchor="middle" font-family="Arial" font-size="13">E3 Robotics Center credential — not an official FIRST certification.</text>
  </svg>`;
  const blob = new Blob([svg], {type:'image/svg+xml'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${record.studentName.replace(/[^a-z0-9]+/gi, '-')}-E3RC-Responsible-AI-Certificate.svg`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function emailCertificate(record, email) {
  const apiBase = certificateApiBase();
  if (!apiBase || !record.serverVerified) throw new Error('Email delivery requires the certificate backend.');
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/certificates/${encodeURIComponent(record.id)}/email`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email})
  });
  if (!response.ok) throw new Error('Email delivery failed.');
}

async function showCertificatePanel(score, courseVersion) {
  const panel = document.getElementById('certificatePanel');
  panel.classList.remove('hidden');
  panel.scrollIntoView({behavior:'smooth'});
  const existing = JSON.parse(localStorage.getItem(CERT_STORAGE_KEY) || 'null');
  const form = document.getElementById('certificateForm');
  const status = document.getElementById('certificateStatus');

  if (existing && existing.score === score && existing.courseVersion === courseVersion) {
    renderCertificatePreview(existing);
    document.getElementById('certificateActions').classList.remove('hidden');
    form.classList.add('hidden');
    wireCertificateActions(existing);
    return;
  }

  form.classList.remove('hidden');
  document.getElementById('certificateActions').classList.add('hidden');
  form.onsubmit = async event => {
    event.preventDefault();
    const studentName = document.getElementById('studentName').value.trim();
    if (!studentName) return;
    status.textContent = 'Issuing certificate…';
    const record = await issueCertificateRecord({studentName, score, courseVersion, completedAt:new Date().toISOString()});
    localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(record));
    renderCertificatePreview(record);
    form.classList.add('hidden');
    document.getElementById('certificateActions').classList.remove('hidden');
    status.textContent = record.serverVerified ? 'Server-verified certificate issued.' : 'Certificate created locally. Server verification/email are not enabled yet.';
    wireCertificateActions(record);
  };
}

function wireCertificateActions(record) {
  document.getElementById('downloadPdf').onclick = () => downloadCertificatePdf(record);
  document.getElementById('downloadSvg').onclick = () => downloadCertificateSvg(record);
  document.getElementById('printCertificate').onclick = () => window.print();
  document.getElementById('copyVerifyLink').onclick = async () => navigator.clipboard.writeText(verificationUrl(record));
  document.getElementById('emailCertificate').onclick = async () => {
    const email = prompt('Email address for certificate delivery:');
    if (!email) return;
    try {
      await emailCertificate(record, email.trim());
      alert('Certificate email sent.');
    } catch (error) {
      alert(error.message);
    }
  };
}
