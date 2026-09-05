<div id="top"></div>

# profile-hub

Build a personal profile site as three separated applications: a public site, an administrator
console, and an API.

## Tech Stack

<p style="display: inline">
  <img src="https://img.shields.io/badge/-Bun-000000.svg?logo=bun&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-TypeScript-3178C6.svg?logo=typescript&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-Hono-E36002.svg?logo=hono&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-Drizzle%20ORM-C5F74F.svg?logo=drizzle&style=for-the-badge&logoColor=black">
  <img src="https://img.shields.io/badge/-Vite-646CFF.svg?logo=vite&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-React-61DAFB.svg?logo=react&style=for-the-badge&logoColor=black">
</p>

## Table of Contents

1. [About the Project](#about-the-project)
2. [Project Status](#project-status)
3. [Environment](#environment)
4. [Directory Structure](#directory-structure)
5. [Getting Started](#getting-started)
6. [Available Commands](#available-commands)
7. [Troubleshooting](#troubleshooting)
8. [License](#license)

## About the Project

profile-hub is three applications, so the tools used to edit the site stay out of what a visitor
downloads:

- **public-web** — self-introduction, hobby articles, and engineering articles. No authentication,
  and no authentication dependencies in the bundle.
- **admin-web** — article, profile, skill, social link, and announcement management. Administrator
  only.
- **api** — the data behind both, keeping draft and published articles separate so a draft cannot
  reach the public site.

Articles are one entity distinguished by a `type` field (`hobby` / `engineering`) rather than one
table per category, so adding a category later adds neither tables, endpoints, nor screens.

This repository was previously **Daybook**, a diary application. Its application sources were
removed, and the configuration, CI workflows, and documents are being rewritten around profile-hub.

<p align="right">(<a href="#top">back to top</a>)</p>

## Project Status

The monorepo, the shared lint baseline, and the CI workflows are in place. The applications
themselves are scaffolds: each one builds, lints, type checks, and runs its tests, but none of the
product features exist yet.

| Area              | State                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| `apps/api`        | Configuration and the Drizzle config factory. No routes, no schema         |
| `apps/public-web` | Vite scaffold that renders a placeholder. No routing, no pages             |
| `apps/admin-web`  | Vite scaffold that renders a placeholder. No auth guard, no screens        |
| `packages/config` | Complete. Shared ESLint, oxlint, markuplint, Prettier, and TypeScript base |
| `packages/ui`     | Empty on purpose until the design token set is settled                     |
| Requirements      | None. The predecessor's documents were removed and have no replacement yet |
| Deployment        | Nothing configured. `infra/` is a placeholder                              |
| Container images  | Only `apps/api` has a Dockerfile, and it expects sources that do not exist |

The lint baseline is ported from [mojica](https://github.com/kishimin/mojica); see
`packages/config/README.md` for what is enforced and what was deliberately left out. The remaining
work — the data model, the endpoints, the screens, i18n, SEO, and deployment — is tracked in the
issue tracker: <https://github.com/kishimin-ai-create/profile-hub/issues/1>

<p align="right">(<a href="#top">back to top</a>)</p>

## Environment

| Language / Framework | Version |
| -------------------- | ------- |
| Bun                  | 1.3.13  |
| TypeScript           | 5.9.3   |
| Hono                 | 4.13.5  |
| Drizzle ORM          | 0.45.2  |
| Vite                 | 7.3.6   |
| React                | 19.2.8  |

Versions are the ones resolved in `bun.lock`. See each workspace's `package.json` for its full
dependency list.

<p align="right">(<a href="#top">back to top</a>)</p>

## Directory Structure

```text
.
├── .github
│   └── workflows
├── apps
│   ├── admin-web
│   │   ├── .storybook
│   │   ├── public
│   │   └── src
│   ├── api
│   └── public-web
│       ├── .storybook
│       ├── public
│       └── src
├── infra
├── packages
│   ├── config
│   │   ├── eslint
│   │   └── tsconfig
│   ├── types
│   ├── ui
│   └── utils
├── bun.lock
├── package.json
└── README.md
```

### Main Directories

| Directory           | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| `.github/workflows` | Pull request, push, and nightly workflows                       |
| `apps/admin-web`    | Administrator console (Vite + React)                            |
| `apps/api`          | Hono API                                                        |
| `apps/public-web`   | Public site (Vite + React)                                      |
| `infra`             | Sakura Cloud configuration, not yet written                     |
| `packages/config`   | Shared lint, formatting, and TypeScript baselines               |
| `packages/types`    | Types shared between the applications and the API               |
| `packages/ui`       | Shared UI components, empty until the design tokens are settled |
| `packages/utils`    | Utilities shared between the applications and the API           |

<p align="right">(<a href="#top">back to top</a>)</p>

## Getting Started

### Prerequisites

Install Bun 1.3.13 or newer.

### Clone the Repository

```bash
git clone https://github.com/kishimin-ai-create/profile-hub.git
cd profile-hub
```

### Install Dependencies

One install at the root resolves every workspace under `apps/` and `packages/`.

```bash
bun install
```

### Start an Application

```bash
cd apps/public-web
bun run dev
```

Open:

```text
http://localhost:3000
```

The administrator console runs on port 3002. The API has no entry point yet, so `bun run dev` in
`apps/api` has nothing to start.

### Run the Checks

From any workspace:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

From the repository root, across every workspace at once:

```bash
bun run format:check
bun run lint
bun run typecheck
bun run test
```

<p align="right">(<a href="#top">back to top</a>)</p>

## Available Commands

Run these from a workspace directory unless stated otherwise.

| Command                 | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `bun install`           | Install every workspace's dependencies (repository root) |
| `bun run dev`           | Start the development server                             |
| `bun run build`         | Build the application                                    |
| `bun run test`          | Run the tests                                            |
| `bun run test:coverage` | Run the tests and collect coverage                       |
| `bun run e2e`           | Run the Playwright end-to-end tests (frontends)          |
| `bun run lint`          | Run `oxlint`, then `eslint`                              |
| `bun run lint:markup`   | Run markuplint over the JSX (frontends)                  |
| `bun run typecheck`     | Type check without emitting                              |
| `bun run format:check`  | Check formatting with Prettier (repository root)         |
| `bun run storybook`     | Start Storybook (frontends)                              |
| `bun run vrt`           | Compare visual regression snapshots (frontends)          |
| `bun run api:generate`  | Generate the API client with orval (frontends)           |

Tests are split by size. `test:small`, `test:medium`, and `test:large` exist in every workspace and
select files by the `*.small.test.*`, `*.medium.test.*`, and `*.large.test.*` naming that CI relies
on.

The custom ESLint rules have their own regression suite:

```bash
cd packages/config
bun run test
```

<p align="right">(<a href="#top">back to top</a>)</p>

## Troubleshooting

### `bun run dev` exits immediately in `apps/api`

The script runs `src/index.ts`, and `apps/api/src/` does not exist yet. The API entry point and its
routes arrive with their own issues.

### `Cannot find type definition file for 'bun-types'`

The installed package is `@types/bun`, which registers the type name `bun`. Use `"types": ["bun"]`
in `tsconfig.json`; `bun-types` is not resolvable on its own under Bun's isolated workspace linking.

### ESLint reports errors that `oxlint` did not

That is the intended split. `bun run lint` runs `oxlint` first for the rules it covers, then ESLint
for everything else, and `eslint-plugin-oxlint` switches off the ESLint rules oxlint already
reported so the same violation is never printed twice.

### A new directory under `src/` is not covered by the boundary rules

`eslint-plugin-boundaries` only checks directories it can classify. Add the directory to the shared
list in `packages/config/eslint/react.mjs`, or it will be silently exempt from
`boundaries/dependencies`.

### `docker build` fails on `COPY src ./src`

`apps/api/Dockerfile` copies an application source directory that is not present. The frontends have
no Dockerfile at all; container images and the delivery method are settled in the deployment issue.

<p align="right">(<a href="#top">back to top</a>)</p>

## License

No `LICENSE` file is present. Decide the license or the internal distribution policy before sharing
this repository outside the intended team.

<p align="right">(<a href="#top">back to top</a>)</p>
