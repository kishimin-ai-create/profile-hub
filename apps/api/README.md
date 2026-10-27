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

The application source is not present yet, so `bun run dev` has nothing to start. The PostgreSQL
schema currently contains skills, favourites, social links, and portfolios; other entities and API
endpoints arrive separately.

To exercise the PostgreSQL schema integration test, apply migrations to a disposable test database
with `bun run db:migrate`, set `TEST_DATABASE_URL` to its connection URL, and run
`bun run test:medium`. Without `TEST_DATABASE_URL`, the database test is skipped. The test uses a
transaction and rolls back its inserts.
