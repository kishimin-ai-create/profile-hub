---
name: adr-analysis
description: Perform adversarial, evidence-based option analysis for Architecture Decision Records. Use when comparing alternatives, challenging a recommendation, documenting rejected options, classifying reversibility, defining reconsideration triggers, or detecting sycophancy and unsupported reasoning.
---

# ADR Analysis

## Adversarial review principle

Do not defer to the user, task specification, or current implementation. Do not assume the requested direction is correct. Always question whether:

- the request itself is wrong;
- the current architecture is wrong;
- an existing ADR is invalid in the current context;
- the user is steering toward one option;
- the AI is conforming to conversation context; or
- the first option created an anchoring bias.

Do not use unsupported praise such as "good policy," "valid," "appropriate," "best," "no problem," "common," or "recommended." Attempt falsification before evaluation.

## Mandatory counterargument

Before recommending, review from the position that rejects the intended recommendation. Always produce:

```markdown
## Adversarial Review

### Strongest Argument Against Recommended Option

### Failure Scenario

### Hidden Cost

### Assumption Most Likely to Be Wrong

### Condition Where Another Option Becomes Better
```

Do not invent a weak criticism. Present the strongest counterargument capable of changing the recommendation. If that review changes the recommendation, record that fact.

## Sycophancy detection

Before generating the ADR, check whether:

- the user's first proposal was copied directly into the recommendation;
- the user's wording was used as evidence;
- opposing options received less research;
- only recommended-option advantages are concrete;
- only alternative-option disadvantages are concrete; or
- reasons were produced after deciding the recommendation.

If any item applies, rerun option analysis.

## Why-not requirement

Do not complete an ADR with adoption reasons alone. For every rejected option, record:

```markdown
### Why Not [Option]

Rejected Because:

Evidence:

Trade-off We Avoided:

Trade-off We Accepted Instead:
```

"Because it is complex" is insufficient. Explain what is problematic, in which context, and to what degree. Preserve enough information for a future agent to propose the option again when conditions change.

## Reconsideration triggers

For every accepted ADR, record observable conditions:

```markdown
## Reconsideration Triggers

Reconsider this decision if:

- ...
- ...
```

Examples include application count growing from 3 to at least 10, shared-package release coordination becoming a primary development bottleneck, isolation requirements changing, or changing the current hosting platform. Never write only "reconsider as needed."

## Reversibility classification

Classify the decision as `HIGH`, `MEDIUM`, `LOW`, or `IRREVERSIBLE`. Record:

```markdown
## Reversibility

Classification:

Rollback Method:

Migration Cost:

Data Migration Required:

Downtime Risk:

Lock-in:
```

For `LOW` or `IRREVERSIBLE`, apply stricter option analysis and require at least three options.

## Final principle

Act as the cross-examiner, not the advocate, of an architecture decision. Doubt the first proposal, the user's proposal, the existing architecture, the continued validity of existing ADRs, and most strongly the agent's own recommendation.

Do not write prose that makes a decision look correct. Explore as fully as possible how it could be wrong, then record why it is still selected. Enable future humans and agents to understand not only why it was selected, but why alternatives were not and what change should cause abandonment.

Treat an ADR not as an architecture explanation but as an immutable decision record fixing the constraints, assumptions, evidence, counterarguments, and accepted risks at that point in time.
