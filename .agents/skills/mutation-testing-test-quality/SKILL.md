---
name: mutation-testing-test-quality
description: Design and evaluate tests for mutation testing. Use when strengthening test data, assertions, boundaries, branches, interactions, and behavioral verification to kill mutants.
---

# Test Data Design

Do not use only easy cases. Consider at least:

```text
Normal value
Minimum value
Maximum value
Immediately before boundary
Boundary value
Immediately after boundary
0
Negative number
Empty string
Empty array
null / undefined
Duplicate
Unknown value
Invalid value
Very long value
Different locale
```

Do not test every item unconditionally. Select cases meaningful to the target specification, and be able to explain the selection.

---

# Assertion Quality

Prohibit weak assertions.

Bad examples:

```text
expect(result).toBeDefined()
expect(result).toBeTruthy()
expect(array.length).toBeGreaterThan(0)
```

When the target specification permits it, verify concrete values.

Examples:

```text
expect(result).toEqual(expected)
expect(result.status).toBe("published")
expect(result.locale).toBe("ja")
```

When using a partial match, be able to explain why a full match is not used.

---

# Snapshot Test

Do not try to kill mutants using only Snapshot Tests. Do not make tests pass by updating snapshots.

When a snapshot changes, inspect the diff. Do not update a snapshot unless the change can be explained as an expected specification change.

---

# Mock

Do not reimplement production-code behavior through excessive mocking.

In principle, prohibit tests that verify only:

```text
mock called
mock called once
mock called with
```

Unless the call itself is the specification, verify an externally observable result.

---

# Rules for Tests Added by AI

Read the Mutation Report first. Do not write test code before doing so.

Follow this order:

```text
Report
down
Mutant
down
Production Code
down
Existing Test
down
Missing Behavior
down
Test Case
```

Do not make generic changes such as adding boundary tests without reading the Mutation Report.

Explain the relationship between every added test case and its mutant:

```text
Test Case:
Target Mutant:
Why it survived:
Why this case kills it:
```

---

# Prohibited Actions for AI

Prohibit all of the following:

* Finishing after looking only at the Mutation Score
* Changing production code to kill a mutant
* Weakening assertions
* Updating snapshots unconditionally
* Raising the score by reducing the mutation target
* Raising the score by disabling a mutator
* Raising the score by adding an exclusion
* Ignoring a timeout
* Declaring surviving mutants harmless as a group
* Declaring an equivalent mutant without rationale
* Deleting tests
* Writing an unnatural mutant-specific test
* Verifying only implementation details
* Adding tests without reading the report
* Reporting completion without running tests
* Reporting completion without rerunning mutation testing

When a configuration change is needed, present the decision material to a human.

---

# Prohibition on Production-Code Changes

In mutation-test improvement tasks, do not change production code in principle.

Only the following may be changed:

```text
test code
test fixture
test helper
mutation test configuration
mutation report tooling
```

Require human approval when a mutation-test configuration change narrows the target scope.
