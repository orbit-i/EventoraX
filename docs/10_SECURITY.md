# Security

## Confirmed for this module

- Public verify endpoint is rate-limited to 20 requests/minute per IP
- Public verify endpoint never returns internal error details
- Public verify endpoint only returns fields needed for public display

## Not yet implemented — outside this module's control

- No authentication exists anywhere in the system yet. Hasan's API
  currently uses a hardcoded placeholder tenant ID, not real auth.
- This module's own endpoints have no authentication check at all yet —
  anyone who can reach the server can call them. Needs to be addressed
  once Shahid's auth module is ready.

## Secrets handling

No real secrets exist in this module yet. When SMTP/database credentials
are added, they must go in a .env file, excluded from git via
.gitignore — never hardcoded into source files.