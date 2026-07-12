---
applyTo: ".github/agents/*.agent.md"
---

# Agent Work Record

Every agent invoked as part of an orchestrated run must return a factual Markdown work record so the OrchestratorAgent can preserve and aggregate the complete execution history.

## Why

- Downstream agents need an explicit, verifiable handoff instead of relying on conversational context.
- The final article, work summary, and pull request draft must be traceable to actual work and validation evidence.

## Required Record

Return Markdown with these headings in this order:

```markdown
# {AgentName} Work Record

- Run ID: {run-id}
- Phase: {phase}
- Attempt: {positive integer}
- Status: completed | needs-fix | blocked | failed

## Inputs
## Actions
## Files Changed
## Validation
## Findings and Decisions
## Handoff
```

- Use `None` when a section has no entries.
- Record commands and their observed outcomes under `Validation`.
- List repository-relative paths only.
- Put unresolved work, routable finding identifiers, and the next agent input under `Handoff`.
- Never report a file, command, result, decision, or completion status that was not observed.

## Orchestrator Persistence

Individual agents return the record to their caller. They do not need to write a second file solely for this record. OrchestratorAgent persists records as:

- `agent-work/{run-id}/{sequence}-{agent-name}-{attempt}.md`
- `agent-work/{run-id}/manifest.md`
- `agent-work/{run-id}/aggregate.md`

The manifest records phase state, attempts, artifact paths, and the changed-file ledger. The aggregate preserves every work record in execution order without deleting failures or superseded attempts.

## Scope

This instruction applies to every repository agent. Standalone invocations return the same Markdown record in the final response; orchestrated invocations also receive the run envelope from OrchestratorAgent.

### Exceptions

- Existing primary artifacts such as source files, tests, reviews, reports, documentation, articles, diary entries, and pull request drafts remain required.
- An agent that is blocked before making changes still returns a record with the evidence and blocker.

## Enforcement

- OrchestratorAgent must reject a phase handoff that lacks the required headings or a valid status.
- A phase cannot pass its exit gate until its work record and declared artifacts have been verified.
