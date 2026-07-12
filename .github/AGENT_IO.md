# Agent I/O Reference

Input/output/path settings that vary per application.
When porting to another project, start from this file to update each `.agent.md`.

---

## Quick Reference

| Agent | Input (what to provide) | Output file / location |
|---|---|---|
| [OrchestratorAgent](#orchestratoragent) | Spec `.md` path | `review/`, `blog/`, `diary/` |
| [RedAgent](#redagent) | Spec + target + scope | Test files (`*.test.ts`) |
| [GreenAgent](#greenagent) | Failing test file + spec + target | Implementation file |
| [RefactorAgent](#refactoragent) | Implementation file + test file + target | Refactored implementation file |
| [FixAgent](#fixagent) | Bug report + target file + spec | Test + fixed implementation file |
| [CodeReviewAgent](#codereviewagent) | Branch / file / PR number | `review/{topic}-YYYYMMDD.md` |
| [ReviewResponseAgent](#reviewresponseagent) | File path under `review/` (optional) | Appended to `review/` file + code edits |
| [RegressionTestAgent](#regressiontestagent) | Changed files / bug description / spec | Test files |
| [ArticleWriterAgent](#articlewriteragent) | diff / spec / PR context | `blog/{title}.md` |
| [WorkSummaryAgent](#worksummaryagent) | Scope hint / changed files | `diary/YYYYMMDD.md` |
| [PullRequestWriterAgent](#pullrequestwriteragent) | diff / spec / task context | `pull-request/{title}.md` |
| [OpenApiWriterAgent](#openapiwriteragent) | Backend implementation files + scope | `docs/spec/backend/openapi.yaml` |
| [UIDesignAgent](#uidesignagent) | Component path / design reference / scope | Frontend `.tsx` + `.stories.tsx` |
| [DetailedDesignAgent](#detaileddesignagent) | Requirement / ADR / target area | `docs/v1/specification/` |
| [TaskSpecificationAgent](#taskspecificationagent) | Feature / requirement / design context | `docs/spec/features/{feature}.md` |
| [DocumentationUpdateAgent](#documentationupdateagent) | Diff / changed files / documentation scope | Existing documentation in place |
| TaskSpecificationWriterAgent | Compatibility name | Delegates to `TaskSpecificationAgent` |
| DocumentUpdateAgent | Compatibility name | Delegates to `DocumentationUpdateAgent` |

---

## OrchestratorAgent

**Role**: Orchestrates the full TDD cycle — Red → Green → Refactor → Review.

### Input
| Item | Description |
|---|---|
| Spec (required) | Markdown path such as `docs/spec/features/{feature}.md` |
| Scope (optional) | Target layer (Domain / Usecase / Interface / Component) |
| Config (optional) | Framework preferences etc. |

### Output
| Artifact | Path |
|---|---|
| Review file | `review/{feature-slug}-YYYYMMDD.md` |
| Blog article | `blog/{title}.md` |
| Work diary | `diary/YYYYMMDD.md` |

### Per-app configuration
- Spec path structure under `docs/spec/features/`
- Naming convention for `{feature-slug}`

---

## RedAgent

**Role**: Generates failing tests from specifications.

### Input
| Item | Description |
|---|---|
| Spec (required) | Markdown under `docs/spec/` |
| Target (required) | Path of the module under test (e.g. `createApp usecase`) |
| Scope (required) | Which layer to write tests for (Domain / Usecase / Interface / Component) |

### Output
| Artifact | Path |
|---|---|
| Test file | `backend/src/**/*.test.ts` or `frontend/src/**/*.test.tsx` |

### Per-app configuration
- Test framework (this project: Vitest / React Testing Library)
- Test file placement conventions
- Test run command (this project: `npm run test`)

---

## GreenAgent

**Role**: Writes the minimal implementation to make failing tests pass.

### Input
| Item | Description |
|---|---|
| Failing test file (required) | Full path of `*.test.ts` / `*.test.tsx` |
| Spec (required) | Markdown describing expected behavior |
| Target (required) | Module path where the implementation should be placed |
| Domain / Tech (optional) | Backend (TypeScript + Hono) / Frontend (React + TypeScript) etc. |

### Output
| Artifact | Path |
|---|---|
| Implementation file | Path specified by Target |

### Per-app configuration
- Framework (this project: Hono / React)
- DB / ORM (this project: MySQL + mysql2)
- Test run command (this project: `npm run test`)

---

## RefactorAgent

**Role**: Improves internal code quality without changing external behavior.

### Input
| Item | Description |
|---|---|
| Implementation file (required) | Full path of the file to refactor |
| Test file (reference) | Path of tests that define the external contract |
| Spec (optional, for context) | Under `docs/spec/` |
| Target (required) | Target file or module |
| Focus area (optional) | Aspects to prioritize (e.g. deduplication, naming improvement) |

### Output
| Artifact | Path |
|---|---|
| Refactored implementation | Same path as input (overwritten) |

### Per-app configuration
- Verification commands (this project: `npm run typecheck` → `npm run lint` → `npm run test`)
- Backend verification runs from `backend/`
- Frontend verification runs from `frontend/`

---

## FixAgent

**Role**: Fixes bugs, rule violations, and broken behavior with minimal changes in the TDD cycle.

### Input
| Item | Description |
|---|---|
| Bug report / symptom (required) | What is broken and how it manifests |
| Target file (required) | Path of the implementation file containing the defect |
| Test code (reference) | Path of the existing test suite |
| Spec (optional) | Definition of correct behavior |
| Rule violation (optional) | The violated rule and its location |

### Output
| Artifact | Path |
|---|---|
| Reproduction test + fixed implementation | Added to the test file for the target file |
| Commit (1 fix = 1 commit) | git history |

### Per-app configuration
- Verification commands (this project: `npm run typecheck` → `npm run lint` → `npm run test`)
- Test placement rule (this project: append to the test file of the broken layer)

---

## CodeReviewAgent

**Role**: Analyzes code changes and writes a structured review file to `review/`.

### Input
| Item | Description |
|---|---|
| Branch name / commit SHA / PR number | Defines the review scope |
| File or directory (optional) | Path to focus on |
| Spec (optional) | Context file under `docs/spec/` |

### Output
| Artifact | Path |
|---|---|
| Review file | `review/{work-description}-YYYYMMDD.md` |

**Review file format**: Findings with priority badges ( P1 /  P2 /  P3) + summary

### Per-app configuration
- Path of `review/` directory
- Date command (Windows: `Get-Date -Format "yyyyMMdd"` / Unix: `date "+%Y%m%d"`)

---

## ReviewResponseAgent

**Role**: Responds to review comments in `review/` with code fixes or written replies.

### Input
| Item | Description |
|---|---|
| Review file path (optional) | Path under `review/`. Auto-detects most recently added file if omitted. |
| Scope hint (optional) | File name / comment title / affected area |

**Auto-detection command**:
```bash
git --no-pager log --diff-filter=A --name-only --pretty=format: -- review/ | head -1
```

### Output
| Artifact | Location |
|---|---|
| Code fix | Target implementation file (direct edit) |
| Reply text | Appended below each finding in the `review/` file |
| Disposition block | `fixed` / `reply only` / `needs clarification` appended to each finding |

### Per-app configuration
- Path of `review/` directory
- Review file format (skip judgment based on presence of Disposition: block)

---

## RegressionTestAgent

**Role**: Adds and runs safety-net tests for already-implemented code outside the TDD cycle.

### Input
| Item | Description |
|---|---|
| Changed files / directory / branch / diff (optional) | Target for analysis |
| Bug description (optional) | Problem to be covered by regression tests |
| Spec / design document (optional) | Reference for expected behavior |
| Scope hint (optional) | `backend API` / `usecase layer` / `critical flow` etc. |

### Output
| Artifact | Path |
|---|---|
| Test files | Path following existing test stack conventions |
| Test run result summary | Agent output |

### Per-app configuration
- Test framework (this project: Vitest)
- Run commands (this project: `npm run test:unit` / `npm run test:integration`)
- Test placement conventions

---

## ArticleWriterAgent

**Role**: Converts completed development work into a Japanese technical article and saves it to `blog/`.

### Input
| Item | Description |
|---|---|
| Changed files / diff (primary) | What was implemented |
| Spec / requirements (optional) | Why the change was needed |
| PR summary / commit context (optional) | Background of decisions |
| Target readers (optional) | Team members / beginners / frontend engineers etc. |
| Format (optional) | Blog post / devlog / release note / Zenn article etc. |
| Tone (optional) | Formal / casual / concise / educational |
| Length (optional) | Short / standard / in-depth |
| Topic type (optional) | Trending tech / updated feature / technical issue / error resolution |

### Output
| Artifact | Path |
|---|---|
| Technical article (Japanese Markdown) | `blog/{title}.md` |

**1 topic = 1 file**. Multiple topics → multiple files.

### Per-app configuration
- Path of `blog/` directory
- Default language (this project: Japanese)

---

## WorkSummaryAgent

**Role**: Generates a work diary entry from repository changes and appends it to `diary/YYYYMMDD.md`.

### Input
| Item | Description |
|---|---|
| Scope hint (optional) | `this session` / `backend only` / `recent changes` etc. |
| Changed files (optional) | List of target files |
| Task context (optional) | Repository context about recent work |

### Output
| Artifact | Path |
|---|---|
| Work diary entry (English) | `diary/YYYYMMDD.md` (appended if file exists) |

**Prohibited**: No `git commit` / `git push` (file write only)

### Per-app configuration
- Path of `diary/` directory (this project: requires `-f` because it is in `.gitignore`)
- Section separator format (this project: `## Session N` + `---`)

---

## PullRequestWriterAgent

**Role**: Generates a PR description Markdown from repository changes and saves it to `pull-request/`.

### Input
| Item | Description |
|---|---|
| Changed files / diff (primary) | What changed |
| Spec / task context (optional) | Intent behind the change |
| Related issue / ticket number (optional) | For linking |
| Scope hint (optional) | `this session` / `latest changes` / feature name |
| Output file name (optional) | Auto-generated from title if not specified |

### Output
| Artifact | Path |
|---|---|
| PR description Markdown | `pull-request/{title}.md` |

**PR section order** (fixed):
`## Title` → `## Summary` → `## Related Tasks` → `## What was done` → `## What is not included` → `## Impact` → `## Testing` → `## Notes`

**Template file**: `.github/pull_request_template.md`

### Per-app configuration
- PR template path (this project: `.github/pull_request_template.md`)
- Path of `pull-request/` directory

---

## OpenApiWriterAgent

**Role**: Outputs the implemented backend API as an OpenAPI spec to `docs/spec/backend/openapi.yaml`.

### Input
| Item | Description |
|---|---|
| Backend changed files (primary) | Route definitions, validators, controllers |
| Existing spec (optional) | Current OpenAPI under `docs/spec/` |
| Scope hint (optional) | Endpoint path / feature name / commit range |

### Output
| Artifact | Path |
|---|---|
| OpenAPI spec (YAML) | `docs/spec/backend/openapi.yaml` |

Overwrites existing file if present (does not create a parallel file).

### Per-app configuration
- Output path (default: `docs/spec/backend/openapi.yaml`)
- API version and base path

---

## UIDesignAgent

**Role**: Improves frontend appearance, styling, and accessibility with Tailwind CSS.

### Input
| Item | Description |
|---|---|
| Component path (optional) | e.g. `frontend/src/features/todo/TodoItem.tsx` |
| Design reference (optional) | Description / screenshot reference / document under `docs/design/` |
| Scope keyword (optional) | `"adjust global spacing"` / `"make mobile-friendly"` etc. |

When no scope is specified, audits and improves all of `frontend/src`.

### Output
| Artifact | Path |
|---|---|
| Updated components | `frontend/src/**/*.tsx` (Tailwind classes applied) |
| Storybook stories | `frontend/src/**/*.stories.tsx` (created or updated) |

**Prohibited**: Changing component logic / `style={{}}` inline styles / adding new npm packages

### Per-app configuration
- CSS framework (this project: Tailwind CSS v4)
- Component placement path (this project: `frontend/src/features/`)
- Build / lint commands (this project: `cd frontend && npm run build` / `npm run lint`)
- Design document path (this project: `docs/design/`)

---

## DetailedDesignAgent

**Role**: Converts requirements and accepted architecture decisions into detailed design documentation.

### Input
| Item | Description |
|---|---|
| Requirement or target area (required) | Feature or subsystem to design |
| Requirements and ADRs (required) | Authoritative behavior and architecture constraints |
| Existing design and repository evidence (optional) | Current design, code, and tests used for traceability |

### Output
| Artifact | Path |
|---|---|
| Detailed design | `docs/v1/specification/` |

### Per-app configuration
- Requirements source: `docs/v1/requirements/`
- Detailed design location: `docs/v1/specification/`
- Project design entrypoint: `.github/DESIGN.md`

---

## TaskSpecificationAgent

**Role**: Produces one implementation-ready, verifiable feature task specification.

### Input
| Item | Description |
|---|---|
| Feature or work objective (required) | One coherent implementation outcome |
| Requirements, ADRs, and designs (required) | Sources for scope and acceptance criteria |
| Repository evidence and constraints (optional) | Affected areas, dependencies, and validation context |

### Output
| Artifact | Path |
|---|---|
| Task specification | `docs/spec/features/{feature}.md` |

### Per-app configuration
- Task specification location: `docs/spec/features/`
- Filename convention: kebab-case feature slug
- One independently actionable task per file

---

## DocumentationUpdateAgent

**Role**: Updates existing repository documentation in place from verified changes.

### Input
| Item | Description |
|---|---|
| Change scope (required) | Diff, files, commit, branch, feature, or named document |
| Repository evidence (required) | Changed code, tests, configuration, requirements, or decisions |
| Documentation scope (optional) | Documents or documentation areas to prioritize |

### Output
| Artifact | Path |
|---|---|
| Updated documentation | Existing authoritative document paths, edited in place |
| Conflict or blocker report | Agent output when sources disagree or authority is missing |

### Per-app configuration
- Product behavior source: `docs/v1/requirements/`
- Architecture decision source: `.github/ADR/`
- Design entrypoint: `.github/DESIGN.md`

---

## Orchestration Contract

## Orchestrated Run Envelope

Every OrchestratorAgent child receives:

| Field | Meaning |
|---|---|
| Run ID | Stable `{feature-slug}-{YYYYMMDD-HHmmss}` identifier |
| Phase and attempt | State-machine phase and positive attempt number |
| Task specification | Canonical path under `docs/spec/features/` |
| Changed-file ledger | Repository-relative paths changed in the run |
| Prior artifacts | Work records, reviews, reports, and validation evidence needed for the phase |
| Exit gate | Observable conditions the child must satisfy |

Every child returns the Markdown schema in
`.github/instructions/agent-work-record.instructions.md`. OrchestratorAgent saves
records under `agent-work/{run-id}/`, maintains `manifest.md`, and appends every
attempt to `aggregate.md` in execution order.

## Complete Orchestration Sequence

```text
TaskSpecificationAgent
RedAgent -> GreenAgent -> RefactorAgent (repeat until all acceptance criteria pass)
CodeReviewAgent -> ReviewResponseAgent -> FixDispatcherAgent (repeat until no actionable finding)
MutationTestAgent -> FixDispatcherAgent (repeat until no killable survivor)
CodeReviewAgent -> ReviewResponseAgent -> FixDispatcherAgent (final clean review)
DocumentationUpdateAgent
PullRequestWriterAgent
ArticleWriterAgent
WorkSummaryAgent
```

`TaskSpecificationWriterAgent` and `DocumentUpdateAgent` are compatibility
aliases only. The Orchestrator uses the canonical names.

An unchanged failure may occur at most three consecutive times in one phase.
On the third occurrence the run becomes `blocked`; its manifest and aggregate
remain available for diagnosis. A successful gate resets the phase counter.

### Phase Handoff Requirements

- Red: failing targeted test for the expected reason.
- Green: targeted tests pass with minimal implementation.
- Refactor: tests remain green and each acceptance criterion has evidence.
- Review: stable finding IDs; ReviewResponse disposition for every finding;
  FixDispatcher verification for actionable findings.
- Mutation: Markdown report, survivor IDs and classification; no killable
  survivor at exit.
- Documentation: changed authoritative paths or evidence-backed no-op.
- Delivery: PR draft exists before article and work summary are generated.

## Global Configuration (Affects All Agents)

| Setting | Value in This Project | Affected Agents |
|---|---|---|
| Backend test command | `cd backend && npm run test` | FixAgent / RefactorAgent / GreenAgent / RegressionTestAgent |
| Type check command | `cd backend && npm run typecheck` | FixAgent / RefactorAgent |
| Lint command (BE) | `cd backend && npm run lint` | FixAgent / RefactorAgent |
| Frontend build | `cd frontend && npm run build` | UIDesignAgent |
| Lint command (FE) | `cd frontend && npm run lint` | UIDesignAgent |
| Design documents | `docs/design/` | All agents |
| API spec | `docs/spec/` | RedAgent / GreenAgent / OrchestratorAgent |
| Review file location | `review/` | CodeReviewAgent / ReviewResponseAgent |
| Blog article location | `blog/` | ArticleWriterAgent |
| Work diary location | `diary/` | WorkSummaryAgent |
| PR draft location | `pull-request/` | PullRequestWriterAgent |
| OpenAPI spec | `docs/spec/backend/openapi.yaml` | OpenApiWriterAgent |
| PR template | `.github/pull_request_template.md` | PullRequestWriterAgent |
| Detailed designs | `docs/v1/specification/` | DetailedDesignAgent / DocumentationUpdateAgent |
| Feature task specifications | `docs/spec/features/` | TaskSpecificationAgent / OrchestratorAgent |
