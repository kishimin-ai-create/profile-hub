---
name: mutation-testing-analysis
description: Analyze surviving and equivalent mutation-test mutants. Use when classifying mutation results, identifying causes, and deciding the required response to each surviving mutant.
---

# Surviving Mutant Analysis

For every SURVIVED mutant, perform all steps below.

## Step 1

Inspect the original code.

## Step 2

Inspect the change made by the mutant.

## Step 3

Explain the semantic difference between the original and mutated code.

## Step 4

Identify the input conditions under which that difference occurs.

## Step 5

Explain why the current tests could not detect the difference.

## Step 6

Classify the mutant as exactly one of:

```text
A. Test Gap
B. Equivalent Mutant
C. Product Code Smell
D. Product Bug
E. Tool Limitation
F. Flaky / Timeout
```

Do not leave any mutant unclassifiable.

---

# In the Case of a Test Gap

Identify the missing behavior. Add the smallest test case that verifies only that behavior.

Do not write an unnatural test solely to kill a mutant. Make the test express the product specification.

Consider ways to add the test in this order:

1. Add a case to an existing table-driven test.
2. Add a case to an existing parameterized test.
3. Add an assertion to an existing test.
4. Improve the input of an existing test.
5. Add a new test case.

Use a new test method only as a last resort.

---

# Equivalent Mutant Decision

Do not casually classify a mutant as equivalent. Accept equivalence only when all of the following can be explained:

```text
Behavior before the change
Behavior after the change
Affected input domain
Why the externally observable result is identical for every valid input
```

Prohibit conclusions that it looks the same or probably has no effect. Concrete examples alone are insufficient.

Explain equivalence logically whenever possible. Use an additional test or small verification program when necessary.

Record every equivalent mutant:

```text
Mutant ID:
File:
Line:
Mutation:
Classification: Equivalent
Reason:
Verification:
```

---

# In the Case of a Product Code Smell

Consider whether a mutant survives because production code is unclear rather than because tests are missing.

Examples:

```text
Unreachable code
Meaningless condition
Unnecessary branch
Duplicate processing
Condition that always produces the same result
Processing whose removal does not change behavior
```

Do not modify production code on your own. Report the problem:

```text
Classification: Product Code Smell

Target:
Problem:
Reason it survived:
Recommended action:
```

---

# In the Case of a Product Bug

If mutation analysis reveals a production-code defect, do not adapt tests to the defect. Do not fix production code on your own.

Stop work and report:

```text
Classification: Product Bug

Target code:
Expected behavior:
Current behavior:
Reproduction conditions:
Related mutant:
Recommended action:
```

Do not change tests to hide the defect.

---

# In the Case of a Timeout

Do not treat TIMEOUT as success. Investigate:

```text
baseline test duration
mutation test timeout
timeout coefficient
worker count
parallelism
target test
target mutant
```

Also check whether the mutant caused an infinite loop or similar behavior.

If configuration values are changed, record why. Do not leave any TIMEOUT uninvestigated.
