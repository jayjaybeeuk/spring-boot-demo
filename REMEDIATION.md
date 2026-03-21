# Remediation Tracker

This document tracks review findings from the codebase audit and records whether each item is still open.

Status rules:

- `Unfixed`: identified, agreed, and not yet remediated in code or docs.
- `Fixed`: remediated and verified enough to commit the tracker update alongside the change.

Suggested workflow:

1. Pick one `Unfixed` item.
2. Implement the remediation.
3. Run the relevant checks.
4. Update the item status to `Fixed`.
5. Commit the code change and this document together.

## Summary

| ID | Status | Item | Estimated remediation time |
| --- | --- | --- | --- |
| R-001 | Fixed | Standardise backend error responses for malformed requests | 45-60 min |
| R-002 | Fixed | Align frontend form validation with backend constraints | 20-30 min |
| R-003 | Unfixed | Show generic create-customer failure feedback in the UI | 20-30 min |
| R-004 | Unfixed | Restore a clean frontend lint pass | 10-15 min |
| R-005 | Unfixed | Reconcile Docker and local-development documentation | 10-15 min |
| R-006 | Unfixed | Define and enforce customer list ordering | 15-30 min |
| R-007 | Unfixed | Remove template residue, dead code, and likely-unused dependencies | 20-30 min |
| R-008 | Unfixed | Expand backend tests for request/response edge cases | 30-45 min |
| R-009 | Unfixed | Expand frontend tests for validation and failure handling | 20-30 min |

Estimated implementation total for current backlog: 3 hr 10 min to 4 hr 45 min

## Detailed Items

### R-001: Standardise backend error responses for malformed requests

- Status: `Fixed`
- Problem: The documented error envelope is only enforced for bean validation and not-found cases. Malformed JSON, invalid `LocalDate` values, missing bodies, and similar request failures are likely to return Spring's default error format instead.
- Evidence:
  - [GlobalExceptionHandler.kt](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/backend/src/main/kotlin/com/example/customers/exception/GlobalExceptionHandler.kt#L11)
  - [README.md](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/README.md#L129)
- Remediation:
  - Add explicit handlers for request parsing/binding failures.
  - Keep all client-visible API errors inside the existing `ErrorResponse` envelope.
  - Add tests for invalid JSON, invalid dates, and missing request bodies.
- Remediation completed:
  - Added handlers for request deserialization failures and path-variable type mismatches.
  - Added controller tests for malformed JSON, invalid date input, missing body, and invalid path variable input.
- Estimated remediation time: 45-60 min

### R-002: Align frontend form validation with backend constraints

- Status: `Fixed`
- Problem: The frontend accepts values the backend rejects. Names use `.min(1)` rather than trimming blank input, and date validation is based on `new Date(...) < new Date()` rather than a clear date-only rule.
- Evidence:
  - [CustomerForm.tsx](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/src/components/CustomerForm.tsx#L12)
  - [CreateCustomerRequest.kt](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/backend/src/main/kotlin/com/example/customers/dto/CreateCustomerRequest.kt#L8)
- Remediation:
  - Trim or reject whitespace-only names on the client.
  - Validate date-of-birth with the same date semantics as the backend.
  - Add frontend tests for whitespace-only names and same-day DOB.
- Remediation completed:
  - Updated the form schema to trim names before validation and submission.
  - Replaced `Date` timestamp comparison with date-only validation that rejects same-day DOB values.
  - Added frontend tests for whitespace-only names, same-day DOB, and trimmed submit payloads.
- Estimated remediation time: 20-30 min

### R-003: Show generic create-customer failure feedback in the UI

- Status: `Unfixed`
- Problem: Non-400 failures during customer creation do not surface a useful message to the user. The current behavior leaves the form interactive again without explaining what failed.
- Evidence:
  - [CustomerForm.tsx](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/src/components/CustomerForm.tsx#L41)
  - [CustomerForm.test.tsx](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/src/test/CustomerForm.test.tsx#L86)
- Remediation:
  - Add a form-level error state for 5xx and network failures.
  - Preserve field-level mapping for validation errors.
  - Add tests for generic failure messaging.
- Estimated remediation time: 20-30 min

### R-004: Restore a clean frontend lint pass

- Status: `Unfixed`
- Problem: `npm run lint` currently fails because `button.tsx` exports a component and non-component symbol from the same file.
- Evidence:
  - [button.tsx](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/src/components/ui/button.tsx#L53)
- Remediation:
  - Split `buttonVariants` into a separate module or adjust the file structure so the current ESLint rules pass cleanly.
  - Re-run frontend lint after the change.
- Estimated remediation time: 10-15 min

### R-005: Reconcile Docker and local-development documentation

- Status: `Unfixed`
- Problem: The documented runtime path does not match the current project configuration. Docker exposes the frontend on port 3001, while the README says 3000. The README also says Node 20+ while the frontend is pinned to Node 24.
- Evidence:
  - [docker-compose.yml](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/docker-compose.yml#L21)
  - [README.md](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/README.md#L24)
  - [package.json](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/package.json#L6)
  - [frontend/.nvmrc](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/.nvmrc#L1)
- Remediation:
  - Update README port and version guidance to match the actual build/runtime config.
  - Check any other root or frontend docs for stale setup instructions.
- Estimated remediation time: 10-15 min

### R-006: Define and enforce customer list ordering

- Status: `Unfixed`
- Problem: `findAll()` returns customers with no explicit sort order, so the UI may render records in a database-dependent order.
- Evidence:
  - [CustomerService.kt](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/backend/src/main/kotlin/com/example/customers/service/CustomerService.kt#L21)
  - [CustomerList.tsx](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/src/components/CustomerList.tsx#L23)
- Remediation:
  - Choose a product rule such as newest-first or oldest-first.
  - Apply explicit ordering at the repository/service layer.
  - Add tests that lock the ordering behavior down.
- Estimated remediation time: 15-30 min

### R-007: Remove template residue, dead code, and likely-unused dependencies

- Status: `Unfixed`
- Problem: The repo still contains stock or unused material, which increases maintenance noise and weakens the presentation quality of the test submission.
- Evidence:
  - [frontend/README.md](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/README.md#L1)
  - [App.css](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/src/App.css#L1)
  - [customerApi.ts](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/src/api/customerApi.ts#L6)
- Remediation:
  - Remove or replace template documentation.
  - Delete unused files and exported code that are not part of the application.
  - Review dependencies such as unused Radix, icon, or devtools packages and remove anything no longer required.
- Estimated remediation time: 20-30 min

### R-008: Expand backend tests for request and response edge cases

- Status: `Unfixed`
- Problem: Backend tests cover the main happy path and a few validation cases, but they do not lock down parsing failures or a successful `GET /api/customers/{id}`.
- Evidence:
  - [CustomerControllerTest.kt](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/backend/src/test/kotlin/com/example/customers/CustomerControllerTest.kt#L18)
- Remediation:
  - Add tests for invalid date parsing, malformed JSON, missing bodies, and successful single-customer retrieval.
  - Add assertions for the exact error envelope where relevant.
- Estimated remediation time: 30-45 min

### R-009: Expand frontend tests for validation and failure handling

- Status: `Unfixed`
- Problem: Frontend tests do not currently cover whitespace-only names, same-day DOB edge cases, or a user-visible generic submit failure state.
- Evidence:
  - [CustomerForm.test.tsx](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/src/test/CustomerForm.test.tsx#L16)
  - [CustomerList.test.tsx](/Users/jamesbolton/Documents/GIT/Personal/Allica-tech/frontend/src/test/CustomerList.test.tsx#L15)
- Remediation:
  - Add validation edge-case tests for the form.
  - Add tests that prove generic create errors are surfaced clearly.
  - Keep tests aligned with any new UX introduced in R-003.
- Estimated remediation time: 20-30 min

## Notes

- This tracker is intentionally small and commit-friendly.
- Update only the relevant item when you remediate it; avoid rewriting the whole document unless the backlog changes.
