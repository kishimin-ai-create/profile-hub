---
name: adr-core
description: Establish the scope, evidence, context, and required structure of an Architecture Decision Record. Use when deciding whether an ADR is required, gathering decision inputs, separating facts from assumptions, defining options, or drafting the core record.
---

# ADR Core

Apply these rules in addition to the ADR Agent's existing rules. Prefer the stricter rule when rules conflict.

## Core objective

Do not use an ADR to justify an architecture decision. Create a record that lets future developers answer:

- Why was this decision necessary?
- Why was this option selected?
- Why were the other options rejected?
- What assumptions and constraints existed at the time?
- What evidence supported the decision?
- What risks were knowingly accepted?
- What would cause reconsideration?

Record the reasoning process that led to the decision, not merely an explanation of the decision.

## Architecture significance gate

Do not turn every design choice into an ADR. Before writing one, determine whether the choice materially affects at least one of:

- system, application, or module structure or boundaries;
- dependency direction or an external dependency;
- an interface;
- data ownership or persistence;
- a security boundary;
- deployment or operational characteristics;
- non-functional characteristics;
- construction technique;
- long-term maintenance; or
- reversibility.

Record:

```markdown
## Architecture Significance

Affected Areas:

Why This Decision Is Architecturally Significant:
```

If no material effect exists, output `ADR NOT REQUIRED` and stop. Do not generate unnecessary ADRs.

## One ADR, one decision

Put only one decision in an ADR. Check whether:

- the decision sentence contains multiple uses of "and";
- it contains multiple independent technology selections;
- one decision would remain valid if another changed; or
- the decisions have different option sets.

Split independently changeable decisions. For example, "Adopt a monorepo, use Next.js, and adopt PostgreSQL" contains at least three decisions and requires separate ADRs.

## Decision trigger

Require:

```markdown
## Decision Trigger

What changed?

Why is the existing approach insufficient?

Why must this decision be made now?
```

"To build a new feature" is insufficient. Consider retaining the existing decision as an option.

## Fact, assumption, inference, constraint, and unknown

Do not mix facts and speculation in Context. Classify every decision driver as:

- `FACT`: verifiable from the repository, task specification, existing ADR, or execution result;
- `ASSUMPTION`: treated as true at decision time but not verified;
- `INFERENCE`: derived from multiple facts;
- `CONSTRAINT`: difficult to change or outside the current change scope; or
- `UNKNOWN`: currently unverifiable.

Record:

```markdown
## Decision Inputs

| Input | Classification | Evidence |
|---|---|---|
| hobby-web and work-web remain separate | CONSTRAINT | Task Specification |
| shared UI can be reused | ASSUMPTION | Unverified |
```

Do not label an input `FACT` without evidence. Do not present background inferred from conversation as fact. Do not fill unknowns by guessing.

## Context hallucination check

For every Context sentence, ask:

- Who supplied this information?
- Can it be confirmed in the repository?
- Is it in the task specification?
- Is it in an existing ADR?
- Did the AI infer and add it?

Delete background without an identifiable source or move it to `ASSUMPTION`. Do not put "generally ..." claims in Context. Include only facts relevant to the current decision trigger.

## Evidence requirement

Evaluate recommendation evidence in this priority order:

1. Repository evidence
2. Prototype or spike result
3. Benchmark
4. Test result
5. Official documentation
6. Existing ADR
7. Project experience
8. External article
9. General knowledge
10. AI inference

Do not recommend solely from AI inference. Propose a spike when an important decision lacks evidence.

## Spike requirement

When differences between options cannot be decided analytically, do not guess. Output:

```markdown
## Spike Required

### Question

### Options To Test

### Minimal Experiment

### Measurement

### Time Box

### Decision After Spike
```

Treat a spike as the smallest experiment that obtains only the information required for the decision, not production implementation.

## Decision matrix

For three or more options, create:

```markdown
## Decision Matrix

| Criterion | Weight | Option A | Option B | Option C |
|---|---:|---:|---:|---:|
| Isolation | 5 | | | |
| Development Cost | 4 | | | |
| AI Agent Compatibility | 4 | | | |
```

Derive weights from project constraints. Do not choose weights to favor the recommendation. Use scores only as a thinking aid; never decide from the score alone.

## Knowledge asset requirement

Write for future AI agents as well as humans. Prohibit vague references such as "as stated above," "that issue," "the previous implementation," "the current configuration," and "the usual method." Make the decision context understandable from the ADR alone without copying the entire repository description. Explicitly reference related ADRs, tasks, and PRs.
