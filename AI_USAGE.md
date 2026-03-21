# AI Usage Documentation

This document records all AI tool usage during development of the Customer Management Application, as required by the technical test brief.

---

## Tools Used

| Tool                      | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| GitHub Copilot            | In-editor code completion and suggestions        |
| Claude (Anthropic Cowork) | Planning, architecture design, and documentation |

---

## Usage Log

### Docker / Nginx Proxy Fix

**Tool:** Claude Code (Claude Sonnet 4.6)
**Task delegated:** Diagnosing 403 errors on API calls in the Dockerised stack
**What was generated:** Identified that `VITE_API_BASE_URL=http://localhost:8080` baked into the frontend build caused the browser to call the backend directly (port 8080), bypassing nginx and triggering CORS rejection. Generated updated `nginx.conf` (with Docker DNS resolver), `docker-compose.yml` (removed build arg), and `Dockerfile` (removed `ARG/ENV`).
**What I wrote myself / manually fixed:** Identified the proxy pattern to use as the preferred solution; validated the nginx `resolver 127.0.0.11` approach and confirmed it resolved the host-not-found startup error. Directed the fix toward using relative URLs + nginx proxy rather than configuring CORS on the backend.
**AI mistakes corrected:** Initial nginx config used a hard-coded `proxy_pass http://backend:8080` without a `resolver` directive, causing nginx to fail at startup with "host not found in upstream". I caught this and directed the correction.
**Time estimate:** ~5 min with AI assistance vs ~20–30 min without (diagnosing Docker networking + nginx config).

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

## Time Breakdown

| Phase                       | Estimated time (with AI) | Estimated time (without AI) |
| --------------------------- | ------------------------ | --------------------------- |
| Planning & architecture     | 15 min                   | 45–60 min                   |
| Backend scaffolding         | 15 min                   | 60 min                      |
| Backend logic & tests       | 10 min                   | 60 min                      |
| Frontend scaffolding        | 10 min                   | 45 min                      |
| Frontend components & tests | 5 min                    | 60 min                      |
| README & documentation      | 20 min                   | 90 min                      |
| **Total**                   | TBD                      | TBD                         |

_This log will be updated as development progresses._

---

## Reflections on AI Impact

> _To be completed on submission._

Areas to cover:

- Where AI accelerated development most
- Where AI suggestions needed correction or were not used
- How AI affected code quality vs writing everything manually
- Whether AI usage changed the approach taken
