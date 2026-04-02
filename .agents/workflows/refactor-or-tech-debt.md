---
description: How to refactor code or pay down technical debt
---

# Refactor or Tech Debt Workflow

Use this workflow for code health work, restructuring, debt paydown, and maintainability improvements.

1. Define the exact scope, target outcome, and non-goals.
2. State which behaviors must remain unchanged.
3. Add or confirm regression coverage before changing structure.
4. Refactor in small, reviewable steps.
5. Avoid coupling the refactor with unrelated features or package upgrades.
6. Run the full relevant verification stack.
7. Update internal docs if the architecture, module ownership, or conventions changed.
8. Add a changelog entry under Internal or Changed as appropriate.
9. If debt remains, document what remains, why it remains, and the next follow-up step.
10. End with a behavior-preservation summary and verification evidence.
