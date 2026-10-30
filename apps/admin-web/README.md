# @profile-hub/admin-web

The administrator console: article, profile, skill, social link, and announcement management.
Administrator only, and deliberately a separate application so its routes and dependencies never
reach a visitor of the public site.

Dependencies are installed once from the repository root, because this workspace is part of a Bun
workspace:

```bash
bun install
```

Start the development server:

```bash
bun run dev
```

Open:

```text
http://localhost:3002
```

Run the checks:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

The login screen, session restoration, protected routes, and dashboard logout are implemented on the
authentication development branch. Management screens remain in progress. Browser cookie behavior
and multiple-tab session coordination still need verification before production.
