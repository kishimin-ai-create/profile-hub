---
name: mutation-testing
description: Execute the complete mutation-testing workflow. Use when planning or running mutation testing and establishing its purpose, prerequisites, scope, execution loop, and handling rules.
---
# Mutation Testing Execution Instructions

## Purpose

Do not treat passing tests or high code coverage as proof of quality.

Perform mutation testing to confirm that test code can actually detect errors in production code.

Do not pursue a higher Mutation Score as the purpose of this work. Build a test suite that can detect every killable mutant.

Apply this absolute principle:

> Do not prove that tests pass.
> Prove that tests fail when the code is broken.

---

# Basic Policy

Do not allow any of these mutation-test result states:

* SURVIVED
* LIVED
* NO COVERAGE
* NOT COVERED
* TIMEOUT
* TEST ERROR
* Unknown execution result
* Cause not investigated
* Abandonment based on a guess that it seems harmless

Check every mutant individually.

Allow only these final mutant states:

1. KILLED
2. Logically demonstrated to be an equivalent mutant
3. Demonstrated, with reproducible evidence, to be an invalid mutant caused by the tool

Do not accept any of the following as a reason to exclude or stop:

* The code is unimportant.
* Writing a test is difficult.
* The Mutation Score is high enough.

---

# Most Important Quality Standard

Require all of the following for completion:

```text
Actionable Survived Mutants = 0
Unclassified Mutants = 0
Not Covered Mutants = 0
Uninvestigated Timeouts = 0
```

Do not require a Raw Mutation Score of 100%.

When the Mutation Score is below 100%, require an individual classification and rationale for every surviving mutant.

Therefore, treat this result alone as failure:

```text
Mutation Score 95%
```

Require a state such as:

```text
Killed: 95
Equivalent: 5
Actionable Survived: 0
Unclassified: 0
```

Require an Effective Mutation Score of 100% after excluding equivalent mutants:

```text
Effective Mutation Score =
Killed / (Killed + Actionable Survived)

Required: 100%
```

---

# Before Starting Work

Before starting mutation testing:

1. Confirm the project structure.
2. Identify the test framework.
3. Identify the mutation-testing tool.
4. Identify the code targeted for mutation.
5. Run the current tests.
6. Obtain code coverage.
7. Confirm that no test failures exist.

Do not start mutation testing while existing tests are failing.

If existing tests may be flaky, run the same test suite multiple times and confirm its stability.

---

# About Coverage

Do not use code coverage as a quality metric. Use coverage only to confirm prerequisites before mutation testing.

Do not conclude that tests are sufficient even when coverage is 100%.

Prohibit tests that only do any of the following:

```text
Only execute a function
Do not verify the return value
assert true
Only check existence
Update snapshots unconditionally
Only check that no exception occurs
Only check that a mock was called
```

Make tests verify the target behavior.

---

# Mutation Targets

Target production code in principle. Prioritize:

1. Domain Logic
2. Business Logic
3. Validation
4. Conditional branches
5. Boundary decisions
6. Data conversion
7. Authorization control
8. State transitions
9. Monetary and numeric calculations
10. Date and time processing
11. i18n locale decisions
12. Publication eligibility decisions
13. Advertisement display conditions
14. CRUD input validation

The following may be candidates for exclusion:

* generated code
* framework-generated code
* declaration-only code
* type-definition-only code
* static configuration
* generated migration code

Do not exclude them automatically. Record the reason for every exclusion.

---

# Required Mutation Categories

Enable the following when the tool supports them.

## Conditional Boundary Mutation

Examples:

```text
>  -> >=
>= -> >
<  -> <=
<= -> <
```

Always check boundary-value tests. For a condition value N, test in principle:

```text
N - 1
N
N + 1
```

When those values are inappropriate for the value's nature, choose semantically equivalent boundary cases.

---

## Conditional Negation Mutation

Examples:

```text
== -> !=
true -> false
Condition-expression inversion
```

Check behavior on both the true and false sides.

---

## Arithmetic Mutation

Examples:

```text
+ -> -
- -> +
* -> /
/ -> *
Change to %
```

Do not use only inputs such as 0 or 1 that produce identical results under different operations. Use values that make the operational difference observable.

Bad example:

```text
100 + 0
100 - 0
```

Both equal 100, so they cannot detect the mutation.

---

## Value Mutation

Detect these changes:

```text
0 -> 1
1 -> 0
true -> false
false -> true
Constant-value change
Argument-value change
Threshold change
```

When a magic number has a specification-level meaning, make that meaning understandable from the test name or case name.

---

## Statement Mutation

Detect these changes as far as possible:

```text
statement removal
return removal
function call removal
assignment removal
processing-order change
```

If tests still pass after a specific operation is removed, investigate why that operation exists. Consider unnecessary production code as well as missing tests.

---

## Return Value Mutation

Detect these changes:

```text
value -> null
value -> undefined
value -> empty
true -> false
false -> true
object -> empty object
array -> empty array
```

Do not check only that a return value exists. Verify its contents.

---

# Mutation Test Execution Loop

Execute this loop:

```text
1. Run Mutation Test
2. Obtain report
3. Extract surviving mutants
4. Analyze mutants one by one
5. Classify cause
6. Add missing tests
7. Run normal tests
8. Rerun Mutation Test
9. Check new surviving mutants
10. Repeat until Actionable Survived = 0
```

Do not finish after one run. Do not finish because the Mutation Score exceeded a threshold.
