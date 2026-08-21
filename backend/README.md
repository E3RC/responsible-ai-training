# Certificate verification backend

This optional Cloudflare Worker turns locally generated course certificates into centrally verifiable E3RC credentials and enables email delivery.

The training site itself remains static and can run on GitHub Pages without this service. When the backend is not configured, students can still complete the course and download/print a certificate, but the verification page will label it as local-only.

## What the Worker stores

Only the minimum certificate record:

- certificate ID
- student name
- final score
- curriculum version
- completion timestamp
- record creation timestamp

Email addresses are used only for an explicit send request and are **not stored** by this schema.

## Current Cloudflare design

The Worker follows current Cloudflare guidance reviewed August 21, 2026:

- current compatibility date
- `nodejs_compat`
- D1 binding instead of Cloudflare REST calls
- prepared statements with bound parameters
- Web Crypto for credential IDs
- no secrets committed to source
- observability enabled

Relevant Cloudflare docs:

- https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/d1/worker-api/
- https://developers.cloudflare.com/d1/worker-api/prepared-statements/

## Deploy

From `backend/`:

```bash
npm install -D wrangler
npx wrangler d1 create e3rc-responsible-ai-certificates
```

Copy the returned database ID into `wrangler.jsonc`.

Apply the schema:

```bash
npx wrangler d1 execute e3rc-responsible-ai-certificates --remote --file=./schema.sql
```

If using email delivery through Resend, add the API key as a Worker secret:

```bash
npx wrangler secret put RESEND_API_KEY
```

Do **not** place the API key in `wrangler.jsonc`, JavaScript, GitHub, or the Pages site.

Deploy:

```bash
npx wrangler deploy
```

After deployment, set the public Worker URL in both `index.html` and `verify.html`:

```js
window.E3RC_CONFIG = { apiBase: 'https://YOUR-WORKER.workers.dev' };
```

For production, update these Worker variables in `wrangler.jsonc` as needed:

- `ALLOWED_ORIGIN` — GitHub Pages/custom training domain; comma-separate additional allowed origins.
- `PUBLIC_VERIFY_BASE` — public base URL of the training site.
- `MAIL_FROM` — verified sender identity used by the email provider.

## Endpoints

### `POST /certificates`

Issues a credential after a passing result. Expected fields:

```json
{
  "studentName": "Jordan Smith",
  "score": 90,
  "courseVersion": "2026.1-draft",
  "completedAt": "2026-08-21T18:00:00.000Z"
}
```

### `GET /certificates/:id`

Returns the public verification record.

### `POST /certificates/:id/email`

Sends the certificate record and verification link to an explicitly supplied email address. The email address is not retained in D1.

### `GET /health`

Simple deployment health check.

## Important production note

The first release trusts the browser's statement that the student passed when it requests certificate issuance. Before using the certificate as a high-assurance credential outside Team 1555, add server-side proof of assessment completion (for example, a server-issued assessment token or moving final scoring to the backend). For the intended E3RC training use, this separation lets us launch the course quickly while keeping the limitation explicit.
