# E3RC Responsible AI Training

A public, open-source training and certification program for **E3 Robotics Center** and **FIRST Robotics Competition Team 1555** focused on responsible, ethical, safe, and effective use of artificial intelligence in robotics, schoolwork, and everyday life.

> This is an E3 Robotics Center program. It is aligned with FIRST culture and Core Values, but it is **not an official FIRST certification**.

## Current course

**E3RC Responsible Artificial Intelligence Certification — 2026.1 draft**

Target completion time: approximately **145 minutes**.

1. AI Is a Tool, Not an Authority
2. Verify Before You Trust
3. AI and Schoolwork
4. AI in Engineering and Robotics
5. Teamwork, Credit, and Authorship
6. Bias, Fairness, and Inclusion
7. Privacy, Security, and Confidential Information
8. Deepfakes, Misinformation, and Personal Life
9. Competition, Coopertition, and Community Responsibility
10. Responsible AI Commitment and Final Assessment

## The Responsible AI Five

- **VERIFY** — AI output is not automatically true.
- **PROTECT** — Protect private, sensitive, confidential, and credential information.
- **DISCLOSE** — Be honest about meaningful AI assistance when appropriate.
- **RESPECT** — Do not use AI to deceive, bully, impersonate, exploit, or harm others.
- **OWN IT** — You remain responsible for what you submit, publish, build, or deploy.

## Student experience

The GitHub Pages application currently supports:

- 10 curriculum modules rendered from Markdown
- local browser progress saving
- 3-question randomized knowledge checks for Modules 1–9
- 64-question scenario bank across robotics, academics, security, fairness, misinformation, and FIRST culture
- 10-question pre-course baseline
- matching post-course measurement and percentage-point improvement
- randomized 20-question final assessment
- 80% certification passing score
- topic-level remediation after a failed final
- student Responsible AI commitment
- certificate name entry only after passing
- downloadable PDF certificate
- downloadable SVG certificate
- browser print / Save as PDF
- certificate QR code and verification link
- optional centrally verifiable certificate records
- optional email delivery

## Certificate architecture

The course is intentionally split into two layers.

### Static course — GitHub Pages

The entire curriculum and assessment UI can run as a static public site. Without any backend, students can complete the course and create a **local-only** certificate.

### Verification service — optional Cloudflare Worker + D1

`backend/` contains an optional verification API that can:

- issue unique E3RC certificate IDs;
- store minimal completion records;
- verify a QR-scanned certificate from any device;
- send certificate information and a verification link by email.

Email addresses are not retained in the D1 certificate schema.

See [`backend/README.md`](backend/README.md).

## Current-source policy

AI guidance changes quickly. The curriculum therefore has a dated source register at [`docs/current-sources-2026.md`](docs/current-sources-2026.md).

The 2026.1 source review was performed **August 21, 2026** and includes current material from:

- FIRST
- Indiana Department of Education
- U.S. Department of Education
- Federal Trade Commission
- NIST
- UNESCO
- U.S. Copyright Office
- Cloudflare documentation for the optional certificate service

Each future course release should update the source-review date and curriculum version.

## Repository layout

```text
curriculum/                 Human-readable lesson source
content/course.json         Course structure and version
content/questions.json      Core question bank
content/questions-extra.json Expanded question bank
content/prepost.json        Pre/post learning measurement
index.html                  GitHub Pages training app
app.js                      Core course/progress/final logic
enhancements.js             Pre/post and expanded-bank integration
certificate.js              Certificate generation and credential flow
verify.html / verify.js     Public QR verification page
docs/                       Course, certificate, and source documentation
backend/                    Optional Cloudflare Worker + D1 verification service
```

## GitHub Pages

After the draft PR is merged into `main`, enable GitHub Pages for the repository using the **root of the `main` branch**. The site is plain static HTML/CSS/JavaScript and requires no build step.

Expected default URL:

`https://e3rc.github.io/responsible-ai-training/`

A custom domain such as `ai.e3rc.org` can be added later without changing the course architecture.

## Privacy principles

The course intentionally minimizes student data.

The static course stores progress in the student's own browser. A certificate requires only the student's chosen display name. If the optional backend is enabled, the central record stores the certificate ID, name, final score, curriculum version, and completion timestamps. Email is collected only if the student explicitly requests delivery.

## Credential assurance

The current browser-first design is appropriate for Team 1555 internal training and makes the course inexpensive to host. The optional backend verifies that a certificate record exists, but the first release still trusts the browser's report of the passing score when issuing that record.

If E3RC later wants the credential to serve as a higher-assurance external certification, final scoring should be validated server-side before issuance. That limitation is documented rather than hidden.

## Development status

The first full curriculum and interactive-course draft is under review in **PR #1**. Production deployment, student testing, and final certificate-service configuration are the remaining launch steps.
