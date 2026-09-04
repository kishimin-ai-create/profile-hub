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

The application source is not present yet; the endpoints, the data model, and the Drizzle schema
arrive with their own issues. `bun run dev` therefore has nothing to start.
