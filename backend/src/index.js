function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8', ...headers}});
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(v => v.trim()).filter(Boolean);
  if (origin && (allowed.includes(origin) || allowed.includes('*'))) {
    return {'Access-Control-Allow-Origin': origin, 'Vary':'Origin'};
  }
  return {};
}

function certificateId() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const suffix = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `E3RC-AI-1555-2026-${suffix}`;
}

function resumeCode() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function normalizeResumeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 20);
}

function cleanName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 100);
}

function validScore(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 80 && Number(value) <= 100;
}

function validateProgressPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const text = JSON.stringify(value);
  if (text.length > 50000) return null;
  return text;
}

async function getCertificate(env, id) {
  return env.DB.prepare(`
    SELECT id, student_name AS studentName, score, course_version AS courseVersion,
           completed_at AS completedAt, created_at AS createdAt
    FROM certificates WHERE id = ?1
  `).bind(id).first();
}

async function createCertificate(request, env) {
  const body = await request.json();
  const studentName = cleanName(body.studentName);
  const score = Number(body.score);
  const courseVersion = String(body.courseVersion || '').trim().slice(0, 40);
  const completedAt = String(body.completedAt || '').trim();

  if (!studentName || !validScore(score) || !courseVersion || !completedAt) {
    return json({error:'Invalid certificate request.'}, 400);
  }

  const id = certificateId();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO certificates (id, student_name, score, course_version, completed_at, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `).bind(id, studentName, score, courseVersion, completedAt, createdAt).run();

  return json({id, studentName, score, courseVersion, completedAt, createdAt}, 201);
}

async function createProgress(request, env) {
  const body = await request.json();
  const progressJson = validateProgressPayload(body.progress);
  const courseVersion = String(body.courseVersion || '').trim().slice(0, 40);
  if (!progressJson || !courseVersion) return json({error:'Invalid progress payload.'}, 400);

  const code = resumeCode();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO course_progress (resume_code, progress_json, course_version, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(code, progressJson, courseVersion, now, now).run();

  return json({resumeCode: code, updatedAt: now}, 201);
}

async function getProgress(env, code) {
  const normalized = normalizeResumeCode(code);
  if (normalized.length !== 20) return null;
  const row = await env.DB.prepare(`
    SELECT resume_code AS resumeCode, progress_json AS progressJson,
           course_version AS courseVersion, created_at AS createdAt, updated_at AS updatedAt
    FROM course_progress WHERE resume_code = ?1
  `).bind(normalized).first();
  if (!row) return null;
  return {...row, progress: JSON.parse(row.progressJson)};
}

async function updateProgress(request, env, code) {
  const normalized = normalizeResumeCode(code);
  if (normalized.length !== 20) return json({error:'Invalid resume code.'}, 400);

  const body = await request.json();
  const progressJson = validateProgressPayload(body.progress);
  const courseVersion = String(body.courseVersion || '').trim().slice(0, 40);
  if (!progressJson || !courseVersion) return json({error:'Invalid progress payload.'}, 400);

  const now = new Date().toISOString();
  const result = await env.DB.prepare(`
    UPDATE course_progress
    SET progress_json = ?1, course_version = ?2, updated_at = ?3
    WHERE resume_code = ?4
  `).bind(progressJson, courseVersion, now, normalized).run();

  if (!result.meta?.changes) return json({error:'Resume code not found.'}, 404);
  return json({resumeCode: normalized, updatedAt: now});
}

async function sendCertificateEmail(request, env, id) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !env.PUBLIC_VERIFY_BASE) {
    return json({error:'Email service is not configured.'}, 503);
  }
  const cert = await getCertificate(env, id);
  if (!cert) return json({error:'Certificate not found.'}, 404);

  const body = await request.json();
  const email = String(body.email || '').trim().slice(0, 254);
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({error:'Valid email required.'}, 400);

  const verifyUrl = `${env.PUBLIC_VERIFY_BASE.replace(/\/$/, '')}/verify.html?id=${encodeURIComponent(cert.id)}`;
  const safeName = cert.studentName.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const html = `
    <h1>E3RC Responsible AI Certificate</h1>
    <p>Congratulations, <strong>${safeName}</strong>.</p>
    <p>You completed the E3RC Responsible Artificial Intelligence Certification with a final score of <strong>${cert.score}%</strong>.</p>
    <p>Certificate ID: <strong>${cert.id}</strong></p>
    <p><a href="${verifyUrl}">Verify or open your certificate record</a></p>
    <p>E3 Robotics Center • FRC Team 1555</p>
    <p><small>This is an E3 Robotics Center credential and is not an official FIRST certification.</small></p>`;

  const response = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`, 'Content-Type':'application/json'},
    body:JSON.stringify({from:env.MAIL_FROM, to:[email], subject:'Your E3RC Responsible AI Certificate', html})
  });
  if (!response.ok) {
    console.error(JSON.stringify({event:'certificate_email_failed', id, status:response.status}));
    return json({error:'Email provider rejected the request.'}, 502);
  }
  console.log(JSON.stringify({event:'certificate_email_sent', id}));
  return json({ok:true});
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') {
      return new Response(null, {status:204, headers:{...cors, 'Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type'}});
    }

    try {
      const url = new URL(request.url);
      const parts = url.pathname.split('/').filter(Boolean);

      if (request.method === 'POST' && url.pathname === '/certificates') {
        const response = await createCertificate(request, env);
        Object.entries(cors).forEach(([k,v]) => response.headers.set(k,v));
        return response;
      }

      if (request.method === 'POST' && url.pathname === '/progress') {
        const response = await createProgress(request, env);
        Object.entries(cors).forEach(([k,v]) => response.headers.set(k,v));
        return response;
      }

      if (parts[0] === 'progress' && parts[1] && parts.length === 2 && request.method === 'GET') {
        const saved = await getProgress(env, parts[1]);
        return saved ? json(saved, 200, cors) : json({error:'Resume code not found.'}, 404, cors);
      }

      if (parts[0] === 'progress' && parts[1] && parts.length === 2 && request.method === 'PUT') {
        const response = await updateProgress(request, env, parts[1]);
        Object.entries(cors).forEach(([k,v]) => response.headers.set(k,v));
        return response;
      }

      if (parts[0] === 'certificates' && parts[1] && parts.length === 2 && request.method === 'GET') {
        const cert = await getCertificate(env, parts[1]);
        return cert ? json(cert, 200, cors) : json({error:'Certificate not found.'}, 404, cors);
      }

      if (parts[0] === 'certificates' && parts[1] && parts[2] === 'email' && request.method === 'POST') {
        const response = await sendCertificateEmail(request, env, parts[1]);
        Object.entries(cors).forEach(([k,v]) => response.headers.set(k,v));
        return response;
      }

      if (url.pathname === '/health') return json({ok:true}, 200, cors);
      return json({error:'Not found.'}, 404, cors);
    } catch (error) {
      console.error(JSON.stringify({event:'request_error', message:error instanceof Error ? error.message : String(error)}));
      return json({error:'Internal server error.'}, 500, cors);
    }
  }
};
