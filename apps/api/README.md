# @profile-hub/api

The Hono API behind the public site and the administrator console.

Dependencies are installed once from the repository root, because this workspace is part of a Bun
workspace:

```bash
bun install
```

Run the checks from this directory:

```bash
bun run lint
bun run typecheck
bun run test
```

Start the API with `bun run dev`. The `GET /health` endpoint returns `{"status":"ok"}` when the
process is running. Apply the migrations before using the PostgreSQL-backed endpoints.

Set `PUBLIC_ORIGIN` and `ADMIN_ORIGIN` to the exact browser origins permitted to call the API. If an
origin is not configured it is not allowed; requests without an Origin header remain available to
non-browser clients. Credentialed CORS is enabled only for the configured administrator origin.

## Administrator authentication

Set `JWT_SECRET` to a randomly generated secret of at least 32 UTF-8 bytes. Keep it outside the
repository and use the same value for all API instances. A valid secret is required before login can
rotate a session. Passwords are verified using Argon2id; this API does not expose account creation.
To create the first administrator after migrating an empty database, set `ADMIN_EMAIL` and provide
the password as UTF-8 bytes on standard input to `bun run admin:bootstrap`. Provide the bytes from a
trusted secret source without placing the password in shell history or command-line arguments. The
command reads through EOF, preserves every character including newlines, and rejects input above
4096 bytes. It requires an email and a password of 8–1024 characters, and refuses to create another
administrator if any user already exists. No signup endpoint is exposed.

| Method | Path                              | Authentication and result                                     |
| ------ | --------------------------------- | ------------------------------------------------------------- |
| POST   | `/api/admin/auth/login`           | JSON email and password; returns a token pair                 |
| POST   | `/api/admin/auth/refresh`         | Bearer refresh token; rotates and returns tokens              |
| GET    | `/api/admin/auth/me`              | Bearer access token; returns the administrator ID             |
| POST   | `/api/admin/auth/logout`          | Bearer access token; revokes its session version              |
| POST   | `/api/admin/auth/browser/login`   | Credentials; sets the refresh cookie and returns access token |
| POST   | `/api/admin/auth/browser/refresh` | Refresh cookie; rotates it and returns access token           |
| POST   | `/api/admin/auth/browser/logout`  | Refresh cookie; revokes and expires it                        |

Login accepts at most 4096 bytes. Incorrect credentials receive the same error response whether the
account is absent or the password is wrong. Login uses one shared limit of five attempts per minute
across all API instances. This fixed window allows bursts across window boundaries and one client
can temporarily deny login to others; review the policy and deployment protections before
production. Requests over the limit return 429. The refresh and logout operations advance the user's
session version, invalidating tokens with the old version. A refresh that advances the version but
fails before returning replacement tokens requires a new login.

Access tokens expire after at most 15 minutes. Refresh tokens expire after at most 24 hours of
inactivity, and every session expires seven days after authentication even if refreshed. Deploying
the authentication-time claim invalidates older tokens without it.

The bearer endpoints return both tokens in JSON. Browser-specific login and refresh endpoints return
the access token and keep the refresh token in a host-only Secure, HttpOnly, SameSite=None cookie.
Browser session changes require the configured administrator Origin and `X-Admin-Request: 1`. The
browser client has a login and session flow on its development branch, but cross-site cookie
restrictions have not been tested. An XSS vulnerability can still make authenticated requests even
though it cannot read the HttpOnly cookie. Authentication, security review, and production
deployment remain in progress; a successful unit or integration test does not establish production
readiness.

To exercise the PostgreSQL schema integration test, apply migrations to a disposable test database
with `bun run db:migrate`, set `TEST_DATABASE_URL` to its connection URL, and run
`bun run test:medium`. Without `TEST_DATABASE_URL`, the database test is skipped. The test uses a
transaction and rolls back its inserts.

`src/infrastructures/db/seed-fixture.sql` contains fictional development data for both sections.
Apply it only to a disposable development database after the migrations. It does not create an
administrator account and is not idempotent; repeated application creates duplicate rows.
