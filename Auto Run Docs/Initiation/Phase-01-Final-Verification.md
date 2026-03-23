# Phase 01: Final Verification

This phase runs all quality gates to confirm the application is submission-ready. It executes backend lint and tests, frontend lint and tests, and a Docker Compose smoke test — covering every item in the CLAUDE.md submission checklist that can be verified programmatically. By the end of this phase you will have definitive pass/fail evidence for every automated check.

## Tasks

- [x] Run backend lint and test suite from the `backend/` directory:
  - `cd backend && ./gradlew ktlintCheck` — must produce zero violations
  - `cd backend && ./gradlew test` — all tests must pass
  - Report the number of passing tests and any failures with their output
  <!-- RESULT: ktlintCheck initially found violations (tab chars, indentation, import ordering, parameter newlines) across CustomersApplication.kt, CustomersApplicationTests.kt, CustomerController.kt, ErrorResponse.kt, GlobalExceptionHandler.kt, CustomerService.kt — auto-fixed with `ktlintFormat`, then verified clean.
  Tests: 12 tests completed, 0 failed (12 passing). Two tests were failing before fixes:
  1. `POST customers returns 400 with standard envelope for invalid date format` — `ex.mostSpecificCause` was returning the innermost `DateTimeParseException` instead of `InvalidFormatException`; fixed by using `ex.cause`.
  2. `GET customers by id returns 400 with standard envelope for invalid path variable` — `ex.requiredType?.simpleName` returned primitive `"long"` instead of `"Long"`; fixed by capitalizing the first char.
  Both ktlintCheck and all 12 tests now pass. -->

- [x] Run frontend lint and test suite from the `frontend/` directory:
  - `cd frontend && npm run lint` — must produce zero errors
  - `cd frontend && npm run test -- --run` — all tests must pass (expect 23 tests)
  - Report pass/fail counts and any failures with their output
  <!-- RESULT: `npm run lint` — zero violations (clean exit). `npm run test -- --run` — 4 test files, 23 tests, 0 failed (23 passing). Duration ~3.6s. -->

- [x] Build and start the full Docker Compose stack, then verify both services are healthy:
  - Run `docker compose up --build -d` from the project root
  - Poll `docker compose ps` until both `frontend` and `backend` containers show `healthy` (backend health check has a 30 s start period and 15 s interval — allow up to 90 s)
  - Confirm frontend is reachable: `curl -sf http://localhost:3001 | head -5`
  - Confirm backend API is reachable: `curl -sf http://localhost:8080/api/customers`
  - Run `docker compose down` to clean up
  - Report the health status and curl output for both services
  <!-- RESULT: Both images built successfully. `docker compose ps` showed `customer-api` (healthy) and `customer-ui` (Up). Frontend: `curl -sf http://localhost:3001 | head -5` returned `<!doctype html><html lang="en">...` — clean HTML response. Backend: `curl -sf http://localhost:8080/api/customers` returned `[]` — empty array, 200 OK. `docker compose down` completed cleanly. -->

- [ ] Verify the submission checklist items that require manual confirmation and report their status:
  - Read `README.md` and confirm the checklist section lists the correct port (3001) and test commands
  - Read `AI_USAGE.md` and confirm it is non-empty and describes actual AI tool usage
  - Report any discrepancies found between the documented state and the actual project
