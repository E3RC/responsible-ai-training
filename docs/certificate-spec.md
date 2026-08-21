# Certificate and Verification Specification

## Credential

**E3RC Responsible Artificial Intelligence Certification**

**FIRST Robotics Competition — Team 1555**

Descriptor: **Responsible AI Use • Engineering • Academic Integrity • Digital Citizenship**

## Required certificate fields

- Student full name
- Organization: E3 Robotics Center
- Team: FRC Team 1555
- Completion date
- Final assessment score
- Curriculum version
- Unique certificate ID
- QR code to verification URL

## Certificate ID

Recommended format:

`E3RC-AI-1555-YYYY-NNNN`

Example:

`E3RC-AI-1555-2026-0047`

The backend should generate IDs. Do not trust browser-generated sequential IDs as authoritative.

## Verification URL

Recommended public pattern:

`https://ai.e3rc.org/verify/<certificate-id>`

The verification page should show only the minimum information needed to confirm validity:

- Valid / revoked status
- Student name
- Credential name
- Organization and team
- Completion date
- Curriculum version
- Certificate ID

Do not expose student email addresses or other private profile information.

## Completion screen actions

After passing, offer:

1. Download certificate PDF
2. Display certificate QR code
3. Copy verification link
4. Email certificate on explicit request

Email should be optional. The email address may be requested at completion time rather than required for course participation.

## Revocation / correction

The verification backend should allow an administrator to revoke or supersede a certificate when issued in error or when a student's name requires correction. The original ID should resolve to a clear status rather than silently disappearing.

## Data record

Minimum recommended record:

```json
{
  "certificateId": "E3RC-AI-1555-2026-0047",
  "studentName": "Example Student",
  "organization": "E3 Robotics Center",
  "team": "1555",
  "completedAt": "2026-08-21T18:00:00Z",
  "score": 90,
  "courseVersion": "2026.1",
  "status": "valid"
}
```

## Architecture recommendation

The course itself may be hosted statically on GitHub Pages. Certificate issuance, verification records, and email should use a small server-side service such as a Cloudflare Worker plus a lightweight persistent store.

No secret keys or email-provider credentials belong in the public GitHub Pages bundle.
