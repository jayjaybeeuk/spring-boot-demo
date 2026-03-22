# AI Usage Documentation

This document records all AI tool usage during development of the Customer Management Application, as required by the technical test brief.

---

## Tools Used

| Tool                      | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| GitHub Copilot            | In-editor code completion and suggestions             |
| Claude (Anthropic Cowork) | Planning, architecture design, and documentation      |
| Codex (GPT-5)             | Codebase audit, review findings, remediation tracking |

---

## Usage Log

### Docker / Nginx Proxy Fix

**Tool:** Claude Code (Claude Sonnet 4.6)
**Task delegated:** Diagnosing 403 errors on API calls in the Dockerised stack
**What was generated:** Identified that `VITE_API_BASE_URL=http://localhost:8080` baked into the frontend build caused the browser to call the backend directly (port 8080), bypassing nginx and triggering CORS rejection. Generated updated `nginx.conf` (with Docker DNS resolver), `docker-compose.yml` (removed build arg), and `Dockerfile` (removed `ARG/ENV`).
**What I wrote myself / manually fixed:** Identified the proxy pattern to use as the preferred solution; validated the nginx `resolver 127.0.0.11` approach and confirmed it resolved the host-not-found startup error. Directed the fix toward using relative URLs + nginx proxy rather than configuring CORS on the backend.
**How I validated it:** Ran `docker compose up --build` end-to-end and confirmed API calls from the browser routed correctly through nginx to the backend with no 403 errors. Verified that removing `VITE_API_BASE_URL` from the build args did not break local Vite dev (the Vite proxy handles that path independently).
**AI mistakes corrected:** Initial nginx config used a hard-coded `proxy_pass http://backend:8080` without a `resolver` directive, causing nginx to fail at startup with "host not found in upstream". I caught this and directed the correction.
**Time estimate:** ~5 min with AI assistance vs ~20–30 min without (diagnosing Docker networking + nginx config).

---

### Node Version Pin

**Tool:** Claude Code (Claude Sonnet 4.6)
**Task delegated:** Adding Node 24 version constraint and `.nvmrc`
**What was generated:** `frontend/.nvmrc` pinned to `24.11.0`, `engines` field added to `package.json`.
**What I wrote myself / manually fixed:** Directed the change — AI scaffolded the project using `node:20-alpine` in the Dockerfile and made no attempt to align with the Node version I was actually running locally (24.11.0). I identified this inconsistency and requested the correction.
**How I validated it:** Confirmed `node --version` matched the pinned version after `nvm use`. Verified `docker compose build` completed successfully with the `node:24-alpine` base image and that `npm run build` inside the container produced a clean output.
**AI mistakes corrected:** AI initially scaffolded the Dockerfile with `node:20-alpine` and left it there even after adding the `.nvmrc`. I updated it to `node:24-alpine` to keep the Docker build consistent with the pinned local version — Node 24 is LTS.
**Time estimate:** <1 min.

---

### Planning & Architecture

**Tool:** Claude via Anthropic Cowork
**Task delegated:** Initial project planning and architecture design
**What was generated:** Full planning document (`tech-test-plan.docx`) covering technology stack selection, system architecture, Docker Compose configuration, project structure, phased implementation plan, testing strategy, and key design decisions.
**What I wrote myself:** Final review and validation of all recommendations against the brief requirements; adjustments to any decisions that didn't align with my own approach.
**How I validated it:** Cross-referenced the generated architecture against the brief requirements (Spring Boot, H2, React, Docker Compose). Verified the Docker Compose structure is appropriate for the scope. Confirmed technology choices match brief preferences.
**AI mistakes corrected:** N/A at planning stage — reviewed for accuracy before adopting.
**Time estimate:** ~15 min with AI assistance vs ~45–60 min without (research, decisions, document writing).

---

### Codebase Audit & Remediation Tracking

**Tool:** Codex (GPT-5)
**Task delegated:** Performing a full repository audit, identifying review items, and converting those findings into a remediation tracker that can be updated commit-by-commit.
**What was generated:** A prioritised audit covering backend API contract consistency, frontend validation gaps, UX failure handling, lint issues, documentation drift, ordering behavior, and test coverage blind spots. Generated root-level remediation tracker document (`REMEDIATION.md`) with `Fixed` / `Unfixed` status fields, remediation notes, and estimated implementation times.
**What I wrote myself / manually fixed:** Directed the audit toward practical, commit-sized remediation items rather than a generic architecture review. Chose to capture the work as a living tracker so each fix can be committed alongside a status change.
**How I validated it:** Cross-checked findings against repository files, lint/test commands where available, and project documentation. Confirmed the frontend test suite and build pass, and confirmed the frontend lint issue is reproducible.
**AI mistakes corrected:** None in the documenting phase, but the generated findings were filtered down to code-backed items rather than broad stylistic suggestions.
**Time estimate:** ~15–20 min with AI assistance vs ~60–90 min without (manual codebase scan, note-taking, writing, and structuring a remediation backlog).

---

## Time Breakdown

| Phase                           | Estimated time (with AI) | Estimated time (without AI) |
| ------------------------------- | ------------------------ | --------------------------- |
| Planning & architecture         | 15 min                   | 45–60 min                   |
| Backend scaffolding             | 15 min                   | 60 min                      |
| Backend logic & tests           | 10 min                   | 60 min                      |
| Frontend scaffolding            | 10 min                   | 45 min                      |
| Frontend components & tests     | 5 min                    | 60 min                      |
| README & documentation          | 20 min                   | 90 min                      |
| Codebase scan / audit           | 15–20 min                | 60–90 min                   |
| Remediation planning / tracking | 10–15 min                | 30–45 min                   |
| **Total**                       | 100–110 min              | 450–510 min                 |

_This log will be updated as development progresses._

---

## Reflections on AI Impact

- Where AI accelerated development most

Planning and implementation were equally beneficial. I could write a detailed specification and help shape a plan for what needed to be done and when it needed to be done.

- Where AI suggestions needed correction or were not used

It took a few attempts to get the guidelines correct for the build. However, once I gave it enough context it was usually correct. Enforcing test coverage helped it to correct itself.

- How AI affected code quality vs writing everything manually

Code quality was generally very good, with only a few "hallucinations" — but these were rare. I used different models to review each other's output.

- Whether AI usage changed the approach taken

I had certain standards in mind — AI simply ensured that these were enforced.
