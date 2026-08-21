# Progress Saving and Cross-Device Resume

The E3RC Responsible AI course is designed to take roughly 2–2.5 hours, so students are not expected to finish it in one sitting.

## Two layers of saving

### 1. Automatic local save

The web app stores progress in the browser after every completed milestone, including:

- pre-course baseline completion;
- completed module knowledge checks;
- final assessment score/status;
- post-course knowledge check.

This uses browser `localStorage`, so closing the tab or browser does not normally erase progress on the same device/browser profile.

### 2. Anonymous E3RC backup and resume code

When the optional Cloudflare Worker/D1 backend is configured, the course also creates a private 20-character resume code. The same progress JSON is backed up to E3RC's D1 database under that opaque code.

Example display format:

`A1B2-C3D4-E5F6-7890-ABCD`

The student can enter the code on another device to restore progress and continue at the first incomplete module.

## Privacy model

No name, email address, school ID, birth date, or login account is required to save course progress.

The progress service stores only:

- random resume code;
- course progress JSON;
- curriculum version;
- created timestamp;
- updated timestamp.

The student's name is requested only after the certification requirements are completed and the student chooses to create a certificate.

## Security model

The resume code functions like a bearer credential: anyone who knows the code can retrieve that progress record. Students are told to keep it private.

Codes are generated server-side using Web Crypto random bytes rather than `Math.random()`. The 20 hexadecimal characters represent 80 bits of random space.

The API validates payload size, uses prepared D1 statements with bound parameters, and limits cross-origin access with the configured CORS allowlist.

## API endpoints

- `POST /progress` — create a new anonymous progress record and resume code
- `GET /progress/:code` — retrieve saved progress
- `PUT /progress/:code` — update saved progress

## Deployment requirement

The static GitHub Pages site works without this backend, but only same-device local autosave is available until `window.E3RC_CONFIG.apiBase` is configured with the deployed Worker URL.

After deploying the Worker and D1 database:

1. Apply `backend/schema.sql` to the D1 database.
2. Deploy the Worker from `backend/`.
3. Configure the Worker's `ALLOWED_ORIGIN` for the GitHub Pages/custom-domain origin.
4. Set `window.E3RC_CONFIG.apiBase` in `index.html` and `verify.html` to the Worker URL.
5. Test save on one browser/device and restore with the resume code on another.

## Retention

Before production launch, E3RC should choose a retention policy. A reasonable starting point is to retain incomplete progress for one school/program year and retain issued certificate records longer. An automated cleanup task can be added later without changing the student workflow.
