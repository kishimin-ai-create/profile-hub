---
name: adr-review
description: Conduct independent and final quality review of Architecture Decision Records. Use when reviewing an ADR draft, enforcing acceptance and pull-request gates, verifying required sections, detecting contradictions or unsupported claims, and producing a strict pass/fail quality assessment.
---

# ADR Review

## Cross-model review

When available, ask an agent or model other than the ADR drafter to critically review the draft. Do not instruct the reviewer to support the recommendation. Review for:

- Missing Context
- Invented Context
- Weak Alternatives
- Strawman Options
- Hidden Assumptions
- Sycophancy
- Logical Contradictions
- Unsupported Recommendation
- Missing Why Not
- Ignored Existing ADR
- Decision Bundling
- Premature Acceptance

Record:

```markdown
## Independent Review

### Findings

### ADR Changes Required

### Recommendation Challenged

YES | NO
```

Do not accept while a material finding remains unresolved.

## Strict ADR quality gate

Before completion, require every check to be `YES`:

```text
Architecture Significant = YES
Single Decision = YES
Decision Trigger documented = YES
Context contains only verified facts or classified assumptions = YES
Unknowns are explicit = YES
At least 2 realistic options = YES
No strawman option = YES
Why Not documented for every rejected option = YES
Adversarial Review completed = YES
Sycophancy Check passed = YES
Existing ADR timeline reviewed = YES
ADR contradictions checked = YES
Recommendation supported by evidence = YES
Reversibility classified = YES
Reconsideration Triggers documented = YES
Human Decision confirmed before Accepted = YES
Implementation Verification completed before Accepted = YES
Independent Review critical findings = 0
ADR is point-in-time record = YES
```

Do not treat the ADR as complete if any check is `NO`.

## Required additional output

Add every section below to the existing ADR output format:

```markdown
## Decision Timestamp

## Decision Trigger

## Architecture Significance

## Decision Inputs

## Assumptions

## Unknowns

## Adversarial Review

### Strongest Argument Against Recommended Option

### Failure Scenario

### Hidden Cost

### Assumption Most Likely to Be Wrong

### Condition Where Another Option Becomes Better

## Decision Matrix

## Why Not

## Reversibility

## Reconsideration Triggers

## Implementation Verification

## Independent Review
```

Do not silently remove an inapplicable section. Write:

```text
Not Applicable

Reason:
```

## Additional prohibited actions

Do not:

- use the user's proposal as the recommendation's default;
- fill Context with unverified information;
- mix facts and assumptions;
- resolve an `UNKNOWN` through speculation;
- create an ADR without the Architecture Significance Gate;
- record multiple decisions in one ADR;
- rewrite past context with knowledge learned after the decision;
- omit Why Not;
- create a weak strawman option;
- recommend without evidence or solely from AI inference;
- decide by speculation when a spike is required;
- directly modify an Accepted ADR;
- mark Accepted before Implementation Verification;
- make Reconsideration Triggers vague;
- ignore material cross-model review findings;
- mark Accepted before PR merge; or
- decide from Decision Matrix scores alone.
