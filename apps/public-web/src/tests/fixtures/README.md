# Client generation fixture

`generation.openapi.json` is a generator smoke fixture, not the profile-hub API contract. It
exercises a typed response model, an Axios/TanStack Query hook, and a Zod response schema.

In a disposable checkout, run from `apps/public-web`:

```powershell
$env:OPENAPI_URL = (Resolve-Path src/tests/fixtures/generation.openapi.json).Path
bun run api:generate
bun run typecheck --force
```

For feature development, set `OPENAPI_URL` to the real API's OpenAPI document instead. The fixture's
`/__generation_smoke__` endpoint must not be treated as a production endpoint. Generated smoke
clients and schemas are temporary verification output and are not committed.
