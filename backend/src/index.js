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

function cleanName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 100);
}

function validScore(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 80 && Number(value) <= 100;
}

async function getCertificate(env, id) {
  return env.DB.prepare(`
    SELECT id, student_name AS studentName, score, course_version AS courseVersion,
           completed_at AS completedAt, created_at AS createdAt
    FROM certificates WHERE id = ?
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
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, studentName, score, courseVersion, completedAt, createdAt).run();

  return json({id, studentName, score, courseVersion, completedAt, createdAt}, 201);
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
      return new Response(null, {status:204, headers:{...cors, 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type'}});
    }

    try {
      const url = new URL(request.url);
      const parts = url.pathname.split('/').filter(Boolean);

      if (request.method === 'POST' && url.pathname === '/certificates') {
        const response = await createCertificate(request, env);
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
