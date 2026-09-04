# @profile-hub/public-web

The public site: self-introduction, hobby articles, and engineering articles. No authentication, and
no authentication dependencies.

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
http://localhost:3000
```

Run the checks:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Routing, the shared layout, and the pages themselves arrive with their own issues. What renders
today is a placeholder that proves the toolchain and the shared workspace packages resolve.
