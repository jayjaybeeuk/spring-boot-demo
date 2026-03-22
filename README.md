# Customer Management Application

A full-stack customer management application built for the Allica Bank Senior+ Full Stack Technical Test.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (latest stable)
- Git

That's it — no local JVM, Node, or database setup required. Everything runs inside containers.

---

## Running the Application

### Start everything with Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8080/api/customers |

To stop:

```bash
docker compose down
```

---

## Local Development (without Docker)

### Backend only

Requires: JDK 21+

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=dev'
```

- API: http://localhost:8080/api/customers
- H2 Console: http://localhost:8080/h2-console (dev profile only)

### Frontend only

Requires: Node 24+. Expects the backend running on port 8080.

```bash
cd frontend
npm install
npm run dev
```

- UI: http://localhost:5173 (Vite proxies `/api` to `http://localhost:8080`)

---

## Running Tests

### Backend integration tests

```bash
cd backend
./gradlew test
```

### Backend lint check

```bash
cd backend
./gradlew ktlintCheck
```

Auto-fix lint issues:

```bash
./gradlew ktlintFormat
```

### Frontend unit tests

```bash
cd frontend
npm run test
```

### Frontend lint check

```bash
cd frontend
npm run lint
```

---

## API Reference

### POST /api/customers

Create a new customer.

**Request body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1990-05-15"
}
```

**201 Created:**
```json
{
  "id": 1,
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1990-05-15",
  "createdAt": "2026-03-20T10:00:00Z"
}
```

**400 Bad Request** (validation failure):
```json
{
  "errors": [
    { "field": "firstName", "message": "must not be blank" },
    { "field": "dateOfBirth", "message": "must be a past date" }
  ]
}
```

### GET /api/customers

Retrieve all customers. Returns an empty array `[]` when no records exist.

**200 OK:** Array of customer objects (same shape as above).

### GET /api/customers/{id}

Retrieve a single customer by ID.

**200 OK:** Single customer object.

**404 Not Found:**
```json
{
  "errors": [{ "field": "id", "message": "not found" }]
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Docker Compose                        │
│                                                             │
│   ┌──────────────────┐         ┌──────────────────────┐    │
│   │   frontend        │  HTTP   │   backend             │   │
│   │   React 19 / TS   │────────▶│   Spring Boot 3.x     │   │
│   │   Vite / Nginx    │  :8080  │   Kotlin              │   │
│   │   port: 3001      │         │   port: 8080          │   │
│   └──────────────────┘         └──────────┬───────────┘    │
│                                            │                │
│                                    ┌───────▼───────┐        │
│                                    │  H2 In-Memory  │        │
│                                    │  (embedded)    │        │
│                                    └───────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

Three-tier architecture — presentation, business logic, and data — containerised with Docker Compose.

- **Frontend**: React 19 + TypeScript, built with Vite, served by Nginx in production. Nginx also reverse-proxies `/api` calls to the backend, avoiding CORS issues.
- **Backend**: Spring Boot 3.x (Kotlin), exposing a REST API with Bean Validation and a global exception handler.
- **Database**: H2 in-memory, embedded in the Spring Boot process — no separate database container required.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Kotlin over Java | Brief preference; concise data classes and null-safety reduce boilerplate |
| Gradle Kotlin DSL | Consistent language across build and application code |
| H2 in-memory (no file-based) | Brief requirement; keeps state ephemeral, zero setup |
| No separate DB container | H2 is embedded in the JVM process — a Postgres container would exceed scope |
| Nginx reverse proxy for `/api/` | Avoids browser CORS issues in the containerised setup |
| shadcn/ui + Tailwind | Accessible, unstyled-by-default components with utility-first styling |
| TanStack Query (React Query) | Handles server state, caching, and cache invalidation cleanly |
| State in hooks, not components | Components are pure presentational; all server state lives in `src/hooks/` |
| Date of birth validated as `@Past` | A customer must have been born in the past — sensible assumption where the brief is silent |

---

## Project Structure

```
customer-management/
├── docker-compose.yml
├── README.md
├── AI_USAGE.md
│
├── backend/
│   ├── Dockerfile
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── src/
│       ├── main/kotlin/com/example/customers/
│       │   ├── CustomersApplication.kt
│       │   ├── config/CorsConfig.kt
│       │   ├── domain/Customer.kt
│       │   ├── dto/
│       │   │   ├── CreateCustomerRequest.kt
│       │   │   └── CustomerResponse.kt
│       │   ├── exception/
│       │   │   ├── GlobalExceptionHandler.kt
│       │   │   └── ErrorResponse.kt
│       │   ├── repository/CustomerRepository.kt
│       │   ├── service/CustomerService.kt
│       │   └── controller/CustomerController.kt
│       └── test/kotlin/com/example/customers/
│           └── CustomerControllerTest.kt
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.app.json
    ├── components.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        │   ├── axios.ts
        │   └── customerApi.ts
        ├── components/
        │   ├── ui/               ← shadcn/ui components (button, card, input, label)
        │   ├── CustomerForm.tsx
        │   ├── CustomerList.tsx
        │   └── CustomerRow.tsx
        ├── hooks/
        │   └── useCustomers.ts
        ├── mocks/
        │   ├── handlers.ts
        │   └── server.ts
        ├── test/
        │   ├── setup.ts
        │   ├── CustomerForm.test.tsx
        │   ├── CustomerList.test.tsx
        │   ├── customerApi.test.ts
        │   └── ui.test.tsx
        ├── lib/
        │   └── utils.ts
        └── types/
            └── customer.ts
```

---

## Future Considerations

### Persistent Database

The application uses H2 in-memory storage to keep the scope self-contained. Swapping to a real database requires only config and dependency changes — no application code changes are needed because Spring Data JPA abstracts the database entirely.

**To switch to PostgreSQL:**

1. Replace the H2 dependency in `backend/build.gradle.kts`:
```kotlin
// Remove:
runtimeOnly("com.h2database:h2")

// Add:
runtimeOnly("org.postgresql:postgresql")
```

2. Update `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/customers
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
```

3. Add a `db` service to `docker-compose.yml`:
```yaml
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: customers
    POSTGRES_USER: ${DB_USERNAME}
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

For production, replace `ddl-auto: validate` with a migration tool such as **Flyway** or **Liquibase** to manage schema changes safely across deployments.

### Other Potential Enhancements

| Area | Consideration |
|------|--------------|
| Authentication | Spring Security + JWT or OAuth2 for protected endpoints |
| Pagination | `Pageable` on `GET /api/customers` for large datasets |
| Search / filter | Query params (`?lastName=Smith`) backed by Spring Data JPA `Specification` |
| Soft delete | `deletedAt` timestamp on the entity instead of hard deletes |
| Audit trail | Spring Data Envers or a separate audit log table |
| E2E tests | Playwright against the running Docker Compose stack |
| CI pipeline | GitHub Actions: build → test → lint → Docker build on every PR |

---

## Submission Checklist

- [ ] `docker compose up --build` starts both containers cleanly
- [ ] POST /api/customers creates a record (verified in browser)
- [ ] GET /api/customers returns the list
- [ ] Validation errors surface in the UI (try submitting empty form)
- [ ] `./gradlew ktlintCheck` passes
- [ ] `npm run lint` passes
- [ ] Backend integration tests pass: `./gradlew test`
- [ ] Frontend unit tests pass: `npm run test`
- [ ] `AI_USAGE.md` is accurate and complete

---

## AI Usage

See [AI_USAGE.md](AI_USAGE.md) for a full log of AI tool usage during development, as required by the brief.
