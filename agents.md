# agents.md — Agent Orchestration

Project conventions and architecture are in [CLAUDE.md](CLAUDE.md).

This project uses the global agent configuration at `~/.claude/rules/agents.md`.
No project-specific agent overrides are needed — the stack is small and well-defined.

## When to invoke agents for this project

| Situation | Agent |
|-----------|-------|
| Kotlin/Spring Boot changes | `code-reviewer` after writing |
| Frontend TypeScript changes | `code-reviewer` after writing |
| New feature or bug fix | `tdd-guide` before writing |
| Build errors in Docker | `build-error-resolver` |
| Security-sensitive changes (auth, input) | `security-reviewer` |

## What NOT to over-engineer here

This is a time-boxed tech test. Avoid spinning up planning or architect agents for
straightforward CRUD changes — just read CLAUDE.md and write the code.
