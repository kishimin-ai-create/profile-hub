---
name: adr-lifecycle
description: Govern the point-in-time lifecycle of Architecture Decision Records from proposal through implementation verification and acceptance. Use when assigning ADR status, sequencing implementation, recording timestamps, checking existing ADR timelines and contradictions, superseding decisions, or determining acceptance readiness.
---

# ADR Lifecycle

## Point-in-time requirement

Record the context as it existed when the decision was made. Do not rewrite it from the present perspective. Always record:

```markdown
## Decision Timestamp

Date:

Repository State:

Related Task:

Known Constraints At This Time:
```

Use a commit SHA, branch, tag, or PR for Repository State when possible. Do not inject future knowledge into a past ADR.

## Status transition rules

Permit only:

```text
Proposed -> Accepted
Proposed -> Rejected
Accepted -> Superseded
Accepted -> Deprecated
```

Prohibit `Accepted -> Proposed`, `Superseded -> Accepted`, `Rejected -> Accepted`, and `Deprecated -> Accepted`. Create a new ADR when reconsidering a decision.

## Proposed before implementation

For implementation involving an architecture decision, normally create a Proposed ADR before implementation begins. Require this order:

```text
Task Specification
-> Architecture Significance Gate
-> Proposed ADR
-> ADR Review
-> Human Decision
-> Implementation
-> Implementation Verification
-> Accepted
```

If production code was already changed while an architectural decision was required, report:

```text
Architecture Decision Implemented Before ADR

Affected Code:
Implicit Decision:
Required ADR:
Risk:
```

Do not treat a retrospective ADR as the normal flow.

## Implementation feedback loop

Do not accept an ADR based only on pre-implementation predictions. Run:

```text
Proposed ADR
-> Implementation
-> Observed Result
-> ADR Assumption Verification
-> Decision Re-evaluation
-> Accepted / New Decision Required
```

After implementation, record:

```markdown
## Implementation Verification

### Assumptions Verified

### Assumptions Invalidated

### Unexpected Findings

### Decision Still Valid

YES | NO
```

If Decision Still Valid is `NO`, do not accept the ADR; return to option analysis.

## Contradiction detection

Compare every new ADR with existing Accepted ADRs. Check direct, constraint, dependency, boundary, terminology, and assumption contradictions. If detected, output:

```markdown
## ADR Contradiction Detected

### Existing ADR

### Existing Decision

### Proposed Decision

### Contradiction

### Required Action
```

Do not ignore a contradiction and continue creating the ADR. Determine whether the proposal is a superseding decision.

## ADR timeline analysis

Do not read related ADRs only in number order. Build a decision timeline from Status and Decision Date, for example:

```text
ADR-0003 Accepted
-> ADR-0007 Superseded ADR-0003
-> ADR-0012 Rejected
-> Current Decision = ADR-0007
```

Do not treat a Rejected ADR as current architecture or a Superseded ADR as a current constraint. They may still inform Why Not analysis.

## ADR pull-request review gate

When ADRs live with code, subject them to pull-request review. Require all of:

- Human Decision confirmed
- Independent Review completed
- Critical findings resolved
- Implementation verification completed
- ADR merged

If the project defines `PR Merge = Accepted`, do not change status before merge. Use `Status: Proposed` before merge and `Status: Accepted` after merge.
