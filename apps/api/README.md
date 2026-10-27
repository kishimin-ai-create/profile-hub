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
process is running. The PostgreSQL schema contains the six v1 entities; resource endpoints arrive
separately.

To exercise the PostgreSQL schema integration test, apply migrations to a disposable test database
with `bun run db:migrate`, set `TEST_DATABASE_URL` to its connection URL, and run
`bun run test:medium`. Without `TEST_DATABASE_URL`, the database test is skipped. The test uses a
transaction and rolls back its inserts.

`src/infrastructures/db/seed-fixture.sql` contains fictional development data for both sections.
Apply it only to a disposable development database after the migrations. It does not create an
administrator account and is not idempotent; repeated application creates duplicate rows.
