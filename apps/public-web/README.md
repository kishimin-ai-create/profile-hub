<div id="top"></div>

# @profile-hub/public-web

Provide separate Engineering and Hobby entry points through an unauthenticated React SPA.

## Tech Stack

<p style="display: inline">
  <img alt="Bun" src="https://img.shields.io/badge/-Bun-000000.svg?logo=bun&style=for-the-badge&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-3178C6.svg?logo=typescript&style=for-the-badge&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/-React-61DAFB.svg?logo=react&style=for-the-badge&logoColor=black">
  <img alt="Vite" src="https://img.shields.io/badge/-Vite-646CFF.svg?logo=vite&style=for-the-badge&logoColor=white">
</p>

## Table of Contents

1. [About the Project](#about-the-project)
2. [Environment](#environment)
3. [Directory Structure](#directory-structure)
4. [Getting Started](#getting-started)
5. [Usage](#usage)
6. [Available Commands](#available-commands)
7. [Troubleshooting](#troubleshooting)

## About the Project

The foundation provides five routes, section-scoped navigation, separate greeting bands, a
responsive shell, a copyright-only footer, metadata, and a 404 state. Engineering and Hobby never
link directly to one another; the logo returns to home, which offers both entry points.

Profile, portfolio, favourite and contact data remain separate feature work. Home keeps functional
entry links until its dedicated design is ready. No real API endpoint client is shipped yet. The
transport, Query provider, loading/error/retry presentation and Orval configuration are ready for
those features. There is no authentication provider, token storage or admin import.

<p align="right">(<a href="#top">back to top</a>)</p>

## Environment

| Language / Framework | Version   |
| -------------------- | --------- |
| Bun                  | 1.3.13    |
| TypeScript           | ^5.9.3    |
| React                | ^19.2.4   |
| Vite                 | ^7.3.6    |
| TanStack Router      | ^1.170.46 |
| TanStack Query       | ^5.100.14 |

Ranges are declared in `package.json`; resolved versions are in the repository's `bun.lock`.

<p align="right">(<a href="#top">back to top</a>)</p>

## Directory Structure

```text
src/
├── app/           # Router, shell, metadata configuration and styles
├── features/      # Separate Engineering and Hobby UI
├── components/    # Presentation and metadata primitives
├── providers/     # Public query client lifetime
├── api/           # Transport; endpoints arrive from OpenAPI
├── models/        # Generated API models
├── hooks/         # Reserved for shared hooks
├── lib/           # Reserved for library integration
├── schemas/       # Reserved for application-owned schemas
├── types/         # Reserved for shared UI types
├── utils/         # Reserved for pure helpers
└── tests/         # Setup and generator fixture
```

### Main Directories

| Directory                                    | Responsibility                                                   |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `src/app`                                    | Compose features and shared code; shared code must not import it |
| `src/features`                               | Own each feature without importing another feature               |
| `src/components`, `src/providers`, `src/api` | Shared presentation, Query cache and HTTP transport              |
| `e2e`                                        | Chromium/WebKit journeys and viewport checks                     |
| `.storybook`                                 | Static examples; behavior lives in test suites                   |

Reserved directories carry `.gitkeep` until needed. Extract UI to `packages/ui` only when another
application actually needs the same component.

<p align="right">(<a href="#top">back to top</a>)</p>

## Getting Started

Run `bun install` from the repository root, then run from this directory:

```bash
bun run dev
```

Open <http://localhost:3000>. The shell works without a running API. For data features, configure
`VITE_API_URL` and `OPENAPI_URL` using `.env.example`. See the
[generation fixture instructions](src/tests/fixtures/README.md) for an isolated generator check.

<p align="right">(<a href="#top">back to top</a>)</p>

## Usage

| Route                  | Foundation rendering                        |
| ---------------------- | ------------------------------------------- |
| `/`                    | Engineering and Hobby entry links           |
| `/engineering`         | Engineering-specific Hello                  |
| `/engineering/contact` | Engineering Contact placeholder             |
| `/hobby`               | Hobby-specific Hello                        |
| `/hobby/contact`       | Hobby Contact placeholder                   |
| Unknown paths          | Not-found heading with the shared home logo |

Feature queries run under `PublicQueryProvider` and can pass their result to `QueryState`. Fresh
data is cached for one minute; failures require an explicit retry. Features own query keys, response
validation, and empty data presentation. `PageMetadata` accepts a title, description and optional
OGP image. It renders on the client; prerendering and crawler SEO remain #22.

<p align="right">(<a href="#top">back to top</a>)</p>

## Available Commands

| Command                                         | Purpose                                                      |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `bun run format` / `bun run format:check`       | Format/check source and documentation                        |
| `bun run typecheck`                             | Compile TypeScript without emitting                          |
| `bun run lint` / `bun run lint:markup`          | Static, architecture and markup checks                       |
| `bun run test` / `bun run test:coverage`        | Behavior tests and coverage                                  |
| `bun run build` / `bun run preview`             | Build/serve the SPA                                          |
| `bun run storybook` / `bun run build-storybook` | Develop/build static examples                                |
| `bun run e2e --workers=2`                       | Run both browser projects                                    |
| `bun run api:generate`                          | Generate Query clients/models/Zod schemas from `OPENAPI_URL` |

The PR CI workflow targets `main` only. Stacked PRs need local verification until retargeted.
Production hosting must provide an SPA fallback for direct URLs; deployment is separate work.

<p align="right">(<a href="#top">back to top</a>)</p>

## Troubleshooting

If Windows refuses port 3000 with `EACCES`, use an available port:

```powershell
bun run dev --host 127.0.0.1 --port 43017
```

With that server running, run browser checks in another terminal:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:43017"
bun run e2e --workers=2
```

`OPENAPI_URL is required` means generation has no input; it is not needed to start the SPA.

<p align="right">(<a href="#top">back to top</a>)</p>
