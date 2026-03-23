# Phase 02: Submission Packaging

This phase produces the final submission artefact — a Git bundle containing the complete repository history — and confirms every item on the CLAUDE.md submission checklist is ticked. By the end of this phase the project is ready to send to the hiring team.

## Tasks

- [x] Audit the submission checklist in `CLAUDE.md` against the actual project state and fix any gaps:
  - Read the checklist block in `CLAUDE.md` (under "Submission Checklist")
  - For each unchecked item, determine whether it is actually complete and mark it `[x]` if so
  - If any item is genuinely incomplete, fix it before continuing (e.g. a missing section in `AI_USAGE.md`, an outdated port reference in `README.md`)
  - Commit any checklist or documentation fixes with message: `docs: finalise submission checklist`

- [x] Create the Git bundle for submission:
  - Run from the project root: `git bundle create james-bolton-tech-test.bundle --all`
  - Verify the bundle is valid: `git bundle verify james-bolton-tech-test.bundle`
  - Report the bundle file size and the list of refs it contains
  - The bundle file should appear in the project root alongside `README.md`
