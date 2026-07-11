---
name: mutation-testing
description: Mutation testing workflow for proving that tests detect meaningful product-code defects. Use when running mutation tests, analyzing survived or uncovered mutants, strengthening tests from a mutation report, classifying equivalent or invalid mutants, investigating mutation timeouts, or reporting mutation-testing completion.
---

# Mutation Testing

Treat mutation testing as an assessment of test effectiveness, not as a score-maximization exercise. Prove that the test suite fails when product behavior is meaningfully broken.

## Quality Standard

Finish only when all killable mutants are detected and every remaining mutant is individually classified with evidence.

Require:

```text
Actionable Survived Mutants = 0
Unclassified Mutants = 0
Not Covered Mutants = 0
Uninvestigated Timeouts = 0
Effective Mutation Score = 100%
```

Calculate:

```text
Effective Mutation Score = Killed / (Killed + Actionable Survived)
```

Do not require a raw mutation score of 100% when justified equivalent or tool-invalid mutants remain. Do not accept a high raw score as completion without classifying every survivor.

Allow only these final mutant states:

1. Killed
2. Logically proven equivalent
3. Proven tool-invalid with reproducible evidence

Never accept "unimportant code," "tests are difficult to write," or a sufficiently high mutation score as a reason to exclude a mutant or stop.

## Establish Preconditions

Before mutation testing:

1. Inspect the project structure.
2. Identify the test framework and mutation tool.
3. Identify the product code in scope.
4. Run the existing tests and confirm they pass.
5. Collect coverage only to identify execution gaps before mutation testing.
6. Repeat the normal suite when flakiness is plausible.

Do not begin while the baseline suite fails. Do not treat coverage, including 100% coverage, as proof that assertions detect defects.

Reject tests that merely execute a function, omit return-value checks, assert `true`, check only existence or absence of exceptions, update snapshots unconditionally, or check only that a mock was called. Test observable behavior.

## Prioritize Targets

Mutate product code, prioritizing:

1. Domain and business logic
2. Validation and conditional branches
3. Boundary decisions and data transformations
4. Authorization and state transitions
5. Monetary and numeric calculations
6. Date and time processing
7. Locale, publication, and display decisions
8. Advertising-display conditions
9. CRUD input validation

Consider generated code, framework-generated code, declarations, type-only definitions, static configuration, and generated migrations as exclusion candidates. Never exclude them automatically; record the reason for each exclusion.

## Exercise Mutation Categories

Enable supported categories and design inputs that make their behavioral differences observable.

### Conditional boundaries

Detect changes between `>`, `>=`, `<`, and `<=`. Test `N - 1`, `N`, and `N + 1`, or meaningful semantic equivalents when those values do not fit the domain.

### Conditional negation

Detect equality changes, boolean inversion, and negated conditions. Verify both true and false behavior.

### Arithmetic changes

Detect substitutions among arithmetic operators, including modulo changes. Avoid values such as zero or one when they make different operators produce the same result.

### Value changes

Detect changes to booleans, constants, arguments, and thresholds. Give specification-significant values names that reveal their meaning in the test case.

### Statement changes

Detect removal of statements, returns, calls, or assignments and changes in processing order. If removal has no observable effect, investigate whether the tests are weak or the production statement is unnecessary.

### Return-value changes

Detect replacement with `null`, `undefined`, empty values, inverted booleans, empty objects, or empty arrays. Assert returned content, not merely its presence.

## Run the Iterative Workflow

Follow this loop until no actionable survivor remains:

1. Run mutation tests and obtain the report.
2. Extract every survived, uncovered, timed-out, errored, or unknown mutant.
3. Analyze one mutant at a time.
4. Classify its cause.
5. Add or improve the smallest specification-focused test when a test gap exists.
6. Run the normal test suite.
7. Rerun mutation tests.
8. Inspect the new result and repeat.

Do not stop after the first run or after crossing a score threshold.

## Analyze Each Survivor

For every survivor:

1. Read the mutation report before editing tests.
2. Compare the original and mutated production code.
3. Explain their semantic difference.
4. Identify inputs that expose the difference.
5. Explain why the current tests missed it.
6. Classify it as one of:
   - Test Gap
   - Equivalent Mutant
   - Product Code Smell
   - Product Bug
   - Tool Limitation
   - Flaky / Timeout

Never leave a mutant unclassified or dismiss multiple survivors with a general assumption.

## Resolve Test Gaps

Add the smallest test that expresses the missing product behavior. Prefer, in order:

1. Add a case to an existing table-driven test.
2. Add a case to an existing parameterized test.
3. Add an assertion to an existing test.
4. Improve an existing test input.
5. Add a new test case.

For each change, record:

```text
Test Case:
Target Mutant:
Why it survived:
Why this case kills it:
```

Do not write artificial mutant-specific tests or assert implementation details when observable product behavior can be tested.

## Design Effective Inputs and Assertions

Select specification-relevant cases from normal values, minimum and maximum values, values immediately around boundaries, zero, negatives, empty strings or arrays, nullish values, duplicates, unknown or invalid values, long values, and locale variants. Explain why the selected cases matter; do not add every category mechanically.

Prefer exact assertions of expected values and state. Avoid assertions that only prove a value exists, is truthy, or has a nonzero collection length when the specification permits a more precise result.

When using a partial match, be able to explain why a full match is inappropriate.

Do not rely solely on snapshots. Inspect every snapshot difference and update it only for an explained specification change.

Avoid mocks that reimplement product behavior. Unless a call itself is the contract, assert the externally observable result rather than only call count or arguments.

## Classify Non-Test Gaps

### Equivalent mutant

Classify a mutant as equivalent only when all valid inputs produce the same externally observable behavior. Explain the original behavior, mutated behavior, affected input domain, and logical reason they are equivalent. Use a focused test or verification code when helpful; examples alone are insufficient.

Record:

```text
Mutant ID:
File:
Line:
Mutation:
Classification: Equivalent
Reason:
Verification:
```

### Product code smell

Report unreachable code, meaningless conditions, redundant branches, duplicate processing, constant-result conditions, or behaviorally unnecessary statements. Do not change product code during this task.

Record:

```text
Classification: Product Code Smell
Target:
Problem:
Why it survived:
Recommended response:
```

### Product bug

Stop and report the expected behavior, current behavior, reproduction condition, related mutant, and recommended response. Do not adapt tests to the bug or fix production code without separate authorization.

Record before stopping:

```text
Classification: Product Bug
Target code:
Expected behavior:
Current behavior:
Reproduction condition:
Related mutant:
Recommended response:
```

### Tool limitation

Require reproducible evidence that the mutant is invalid or caused by the tool. Do not infer tool failure merely because a mutant is difficult to kill.

### Flaky test or timeout

Investigate baseline duration, mutation timeout, timeout coefficient, worker count, parallelism, affected tests, and affected mutants. Check whether the mutation creates an infinite loop. Record the reason for any configuration change; never treat a timeout as a kill.

## Respect Change Boundaries

Limit changes to:

- Test code
- Test fixtures
- Test helpers
- Mutation-test configuration
- Mutation-report tooling

Do not change product code to kill mutants. Present decision evidence to a human before changing configuration in a way that narrows scope.

When any configuration change is needed, present the decision evidence to a human. Obtain human approval before narrowing mutation scope through mutation-test configuration.

Do not game results by weakening assertions, deleting tests, updating snapshots without justification, reducing mutation scope, disabling mutators, adding exclusions, or ignoring timeouts and errors.

## Report Results

Report mutation statistics:

```text
Total Mutants:
Killed:
Survived:
Equivalent:
Not Covered:
Timeout:
Invalid:
Raw Mutation Score:
Effective Mutation Score:
```

Include the initial and final raw scores and actionable-survivor counts. For every added test, report its target mutant, mutation type, missing behavior, added case, and result.

Use these exact result sections:

```text
Initial Result
Initial Mutation Score:
Initial Actionable Survived:

Final Result
Final Mutation Score:
Final Actionable Survived:
```

List every remaining mutant with ID, file, line, mutation, classification, reason, and evidence. Explicitly state when none remain.

## Completion Criteria

Report completion only after:

- The normal test suite passes.
- Mutation tests have been rerun after changes.
- Actionable survived mutants equal zero.
- Unclassified and not-covered mutants equal zero.
- Every timeout is investigated.
- Every equivalent mutant has documented reasoning.
- Every added test is linked to its target mutant.
- Effective mutation score equals 100%.

If any criterion remains unmet, label the work incomplete and report the remaining tasks.

## Final Principle

Distrust passing tests, 100% coverage, and AI-generated tests. Intentionally break product code and prove that the tests detect the error. Treat every survived mutant as a question from the test suite; continue investigating until it is killed or proven equivalent.
