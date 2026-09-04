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
  <img src="https://img.shields.io/badge/-Next.js-000000.svg?logo=nextdotjs&style=for-the-badge&logoColor=white">
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

profile-hub is planned as three applications, so the tools used to edit the site stay out of what a
visitor downloads:

- **public site** — self-introduction, hobby articles, and engineering articles. No authentication.
- **admin console** — article, profile, skill, social link, and announcement management.
  Administrator only.
- **api** — the data behind both, keeping draft and published articles separate so a draft cannot
  reach the public site.

Articles are one entity distinguished by a `type` field (`hobby` / `engineering`) rather than one
table per category, so adding a category later adds neither tables, endpoints, nor screens.

This repository was previously **Daybook**, a diary application. Its application sources have been
removed, and the configuration, CI workflows, and documents are being rewritten around profile-hub.

<p align="right">(<a href="#top">back to top</a>)</p>

## Project Status

No application source is present. What remains is the toolchain, the CI workflows, and the
documents. Read this table before following any instruction elsewhere in the repository.

| Area          | State                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `backend/`    | Configuration only. Hono, Drizzle, ESLint, and TypeScript settings exist; `src/` does not.                      |
| `frontend/`   | Configuration only. Next.js, Storybook, Vitest, Playwright, and orval settings exist; `app/` and `src/` do not. |
| `docs/v1/`    | Describes the predecessor Daybook — diary domain, PostgreSQL, Next.js. Not yet rewritten.                       |
| `render.yaml` | Targets Render with `diary-*` service names. The planned host is Sakura Cloud AppRun.                           |
| Workspaces    | There is no root `package.json`. `backend/` and `frontend/` are installed separately.                           |

The target architecture — a Bun workspace monorepo of `apps/public-web`, `apps/admin-web`, and
`apps/api` on MySQL — is tracked in the issue tracker. The epic issue holds the v1 scope, the
technology choices, and the ordering of its child issues:
<https://github.com/kishimin-ai-create/profile-hub/issues/1>

<p align="right">(<a href="#top">back to top</a>)</p>

## Environment

| Language / Framework | Version |
| -------------------- | ------- |
| Bun                  | 1.3.14  |
| TypeScript           | 5.9.3   |
| Hono                 | 4.12.23 |
| Drizzle ORM          | 0.45.2  |
| Next.js              | 16.2.6  |
| React                | 19.2.4  |

Versions are the ones resolved in `backend/bun.lock` and `frontend/bun.lock`. Bun is pinned to
1.3.14 in the Dockerfiles, while CI installs the latest release. See `backend/package.json` and
`frontend/package.json` for the full dependency lists.

<p align="right">(<a href="#top">back to top</a>)</p>

## Directory Structure

```text
.
├── .github
│   └── workflows
├── backend
│   ├── AGENTS.md
│   ├── Dockerfile
│   ├── drizzle.config.ts
│   ├── eslint.config.mts
│   └── package.json
├── docs
│   └── v1
│       ├── requirements
│       └── specification
├── frontend
│   ├── .storybook
│   ├── public
│   ├── AGENTS.md
│   ├── Dockerfile
│   ├── next.config.ts
│   ├── orval.config.ts
│   ├── playwright.config.ts
│   └── package.json
├── pull-request
├── review
│   └── responses
├── .prettierrc
├── README.md
└── render.yaml
```

### Main Directories

| Directory           | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `.github/workflows` | Push, pull request, nightly, and coverage workflows                         |
| `backend`           | Hono API workspace. Configuration only; `src/` is absent                    |
| `docs/v1`           | Requirements and specifications, currently describing Daybook               |
| `frontend`          | Web application workspace. Configuration only; `app/` and `src/` are absent |
| `pull-request`      | Pull request drafts written before a pull request is opened                 |
| `review`            | Code review findings, and the replies written against them in `responses`   |

Each workspace and document directory carries an `AGENTS.md` stating the rules that apply inside it.

<p align="right">(<a href="#top">back to top</a>)</p>

## Getting Started

There is no application to start yet. These steps install the toolchain and run the checks that CI
runs, which is what the repository currently supports.

### Prerequisites

Install Bun. The Dockerfiles pin 1.3.14.

### Clone the Repository

```bash
git clone https://github.com/kishimin-ai-create/profile-hub.git
cd profile-hub
```

### Install Dependencies

Each workspace installs on its own, because no root workspace definition exists yet.

```bash
cd backend
bun install --frozen-lockfile
```

```bash
cd frontend
bun install --frozen-lockfile
```

### Run the Checks

```bash
bun run lint
bun run typecheck
```

Tests report nothing: no test files exist. CI detects this and skips the test, build, Storybook, and
E2E steps rather than failing, which is why a green pipeline does not currently mean the
applications work.

<p align="right">(<a href="#top">back to top</a>)</p>

## Available Commands

Run these from `backend/` or `frontend/`.

### backend

| Command                 | Description                     |
| ----------------------- | ------------------------------- |
| `bun install`           | Install dependencies            |
| `bun run test`          | Run tests                       |
| `bun run test:coverage` | Run tests and collect coverage  |
| `bun run lint`          | Run ESLint                      |
| `bun run typecheck`     | Type check with `tsgo --noEmit` |
| `bun run format:check`  | Check formatting with Prettier  |
| `bun run db:generate`   | Generate Drizzle migrations     |
| `bun run db:migrate`    | Apply Drizzle migrations        |
| `bun run dev`           | Start the API with hot reload   |

### frontend

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `bun install`           | Install dependencies               |
| `bun run test`          | Run Vitest                         |
| `bun run test:coverage` | Run Vitest and collect coverage    |
| `bun run e2e`           | Run Playwright end-to-end tests    |
| `bun run lint`          | Run ESLint                         |
| `bun run typecheck`     | Type check with `tsc --noEmit`     |
| `bun run format:check`  | Check formatting with Prettier     |
| `bun run api:generate`  | Generate the API client with orval |
| `bun run storybook`     | Start Storybook                    |
| `bun run dev`           | Start the development server       |
| `bun run build`         | Build the application              |

Tests are split by size. `test:small`, `test:medium`, and `test:large` exist in both workspaces and
select files by the `*.small.test.*`, `*.medium.test.*`, and `*.large.test.*` naming CI relies on.

<p align="right">(<a href="#top">back to top</a>)</p>

## Troubleshooting

Every entry here follows from the missing application sources described in
[Project Status](#project-status).

### `bun run dev` exits immediately in `backend/`

The script runs `src/index.ts`, and `backend/src/` does not exist in this repository. There is
nothing to start yet.

### `bun run build` fails in `frontend/`

Next.js needs an `app/` or `pages/` directory, and neither exists. CI works around this by checking
for those directories and skipping the build step, so this failure does not appear in the pipeline.

### `docker build` fails on `COPY src ./src`

Both Dockerfiles copy an application source directory that is not present. The images cannot be
built until the sources are restored.

### `backend/.env.example` describes PostgreSQL, but CI starts MySQL

`.env.example` still carries Daybook's `postgresql://` DSN and `diary_db` database name, while
`.github/workflows/test-coverage.yml` provisions `mysql:8.0`. MySQL is the target; treat
`.env.example` as outdated rather than authoritative.

<p align="right">(<a href="#top">back to top</a>)</p>

## License

No `LICENSE` file is present. Decide the license or the internal distribution policy before sharing
this repository outside the intended team.

<p align="right">(<a href="#top">back to top</a>)</p>
