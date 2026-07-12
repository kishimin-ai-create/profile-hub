---
description: "Use when: invoking DocumentationUpdateAgent through the DocumentUpdateAgent compatibility name."
tools: [agent, read]
user-invocable: true
---

# DocumentUpdateAgent (Compatibility Alias)

This agent has no independent documentation-maintenance role. Delegate the
complete request and orchestration run envelope to `DocumentationUpdateAgent`,
wait for its result, and return its artifacts and Markdown work record unchanged.
If the canonical agent cannot be invoked, follow the Codex Agent Bridge and
execute `.github/agents/DocumentationUpdateAgent.agent.md` directly.

Do not create competing documentation, alter the canonical contract, commit,
push, or invoke delivery agents.

## Definition of Done

- [ ] Exactly one canonical DocumentationUpdateAgent execution completed
- [ ] Its changed paths or no-op evidence and work record were returned

## Governing Rules

| Instruction File | Applies to |
|---|---|
| [`.github/copilot-instructions.md`](../copilot-instructions.md) | Core repository rules |
| [`.github/instructions/no-local-paths.instructions.md`](../instructions/no-local-paths.instructions.md) | Portable paths |
| [`.github/instructions/agent-work-record.instructions.md`](../instructions/agent-work-record.instructions.md) | Required Markdown work record and orchestration handoff |
