# CLAUDE.md — Customer Management Application

Architecture and coding standards for the Allica Bank Senior+ Full Stack Technical Test.
All decisions here supersede generic defaults. Read this before touching any file.

---

## Project Overview

A full-stack Customer Management Application. Backend exposes a REST API to create and retrieve
customer records. Frontend provides a form and list view. Everything runs via Docker Compose.

---

## Tech Stack (locked)

| Layer | Technology | Version |
|---|---|---|
| Backend language | Kotlin | 2.x (JVM 21) |
| Backend framework | Spring Boot | 3.x |
| Database | H2 in-memory | 2.x (embedded, no separate container) |
| ORM | Spring Data JPA | Bundled with Boot |
| Build tool | Gradle Kotlin DSL | 8.x |
| Backend linting | ktlint | Via Gradle plugin |
| Frontend | React + TypeScript | 19 / 5.x |
| Frontend build | Vite | 5.x |
| Component library | shadcn/ui | Latest (Tailwind + Radix UI) |
| Styling | Tailwind CSS | v4 (bundled with shadcn/ui) |
| HTTP client | Axios | 1.x |
| Server state | TanStack Query (React Query) | v5 |
| Frontend testing | Vitest + React Testing Library | Latest |
| API mocking | msw (Mock Service Worker) | v2 |
| Containerisation | Docker + Compose | Latest stable |

---

## Repository Structure

```
customer-management/
├── docker-compose.yml
├── README.md
├── AI_USAGE.md
├── CLAUDE.md                          ← this file
│
├── backend/
│   ├── Dockerfile
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── src/
│       ├── main/kotlin/com/example/customers/
│       │   ├── CustomerApplication.kt
│       │   ├── config/
│       │   │   └── CorsConfig.kt      ← dev-profile CORS only
│       │   ├── domain/
│       │   │   └── Customer.kt        ← JPA entity
│       │   ├── dto/
│       │   │   ├── CreateCustomerRequest.kt
│       │   │   └── CustomerResponse.kt
│       │   ├── exception/
│       │   │   ├── GlobalExceptionHandler.kt
│       │   │   └── ErrorResponse.kt
│       │   ├── repository/
│       │   │   └── CustomerRepository.kt
│       │   ├── service/
│       │   │   └── CustomerService.kt
│       │   └── controller/
│       │       └── CustomerController.kt
│       └── test/kotlin/com/example/customers/
│           ├── CustomerControllerTest.kt
│           └── CustomerServiceTest.kt
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── components.json                ← shadcn/ui config
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        │   ├── axios.ts               ← configured Axios instance
        │   └── customerApi.ts         ← typed API functions
        ├── components/
        │   ├── ui/                    ← shadcn/ui generated components (do not edit manually)
        │   ├── CustomerForm.tsx
        │   ├── CustomerList.tsx
        │   └── CustomerRow.tsx
        ├── hooks/
        │   └── useCustomers.ts        ← React Query hooks
        ├── types/
        │   └── customer.ts
        └── lib/
            └── utils.ts               ← shadcn/ui cn() utility (auto-generated)
```

---

## Backend Conventions (Kotlin + Spring Boot)

### Entity

Use a Kotlin `data class` with JPA annotations. Keep the entity in `domain/`. Never expose
the entity directly from controllers — always map to a DTO.

```kotlin
@Entity
data class Customer(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @field:NotBlank
    val firstName: String,

    @field:NotBlank
    val lastName: String,

    @field:NotNull @field:Past
    val dateOfBirth: LocalDate,

    val createdAt: Instant = Instant.now()
)
```

### DTOs

Separate request and response objects. Never leak JPA entities to the API layer.

```kotlin
// Request — validated at controller boundary
data class CreateCustomerRequest(
    @field:NotBlank val firstName: String,
    @field:NotBlank val lastName: String,
    @field:NotNull @field:Past val dateOfBirth: LocalDate
)

// Response — safe projection, no internal fields
data class CustomerResponse(
    val id: Long,
    val firstName: String,
    val lastName: String,
    val dateOfBirth: LocalDate,
    val createdAt: Instant
)
```

### Controller

- Annotate with `@RestController` and `@RequestMapping("/api/customers")`
- Use `@Valid` on request bodies — never validate manually in controller or service
- Return `ResponseEntity` with explicit status codes
- No business logic in the controller

```kotlin
@RestController
@RequestMapping("/api/customers")
class CustomerController(private val customerService: CustomerService) {

    @PostMapping
    fun create(@Valid @RequestBody request: CreateCustomerRequest): ResponseEntity<CustomerResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(customerService.create(request))

    @GetMapping
    fun getAll(): ResponseEntity<List<CustomerResponse>> =
        ResponseEntity.ok(customerService.getAll())

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<CustomerResponse> =
        ResponseEntity.ok(customerService.getById(id))
}
```

### Service

- Annotate with `@Service`
- All persistence calls go through the repository, never direct EntityManager
- Map entity → DTO in the service layer, not the controller

### Error Response Format

All validation and application errors use this exact envelope — no exceptions:

```json
{
  "errors": [
    { "field": "firstName", "message": "must not be blank" },
    { "field": "dateOfBirth", "message": "must be a past date" }
  ]
}
```

Implement via `@RestControllerAdvice`:

```kotlin
data class FieldError(val field: String, val message: String)
data class ErrorResponse(val errors: List<FieldError>)

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleValidation(ex: MethodArgumentNotValidException): ErrorResponse =
        ErrorResponse(
            errors = ex.bindingResult.fieldErrors.map {
                FieldError(it.field, it.defaultMessage ?: "invalid")
            }
        )

    @ExceptionHandler(NoSuchElementException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handleNotFound(ex: NoSuchElementException): ErrorResponse =
        ErrorResponse(errors = listOf(FieldError("id", ex.message ?: "not found")))
}
```

### application.yml

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:customers;DB_CLOSE_DELAY=-1
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: false
  h2:
    console:
      enabled: false   # enabled only in dev profile

---
spring:
  config:
    activate:
      on-profile: dev
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    show-sql: true
```

### ktlint

Configure in `build.gradle.kts`:

```kotlin
plugins {
    id("org.jlleitschuh.gradle.ktlint") version "12.x"
}

ktlint {
    version.set("1.x")
    android.set(false)
}
```

Run: `./gradlew ktlintCheck` — CI must pass before merge.
Auto-fix: `./gradlew ktlintFormat`

---

## Frontend Conventions (React 19 + TypeScript)

### shadcn/ui Setup

shadcn/ui components are **generated into `src/components/ui/`** — they are your code, not a
node_module. Edit them freely for project-specific tweaks.

Initialise once:
```bash
npx shadcn@latest init
# Choose: TypeScript, Tailwind CSS, src/ directory, @/ alias
```

Add components as needed:
```bash
npx shadcn@latest add button input label form card table
```

Use the `cn()` utility from `src/lib/utils.ts` (auto-generated by shadcn) for conditional classes:
```typescript
import { cn } from '@/lib/utils'
<div className={cn('base-class', isActive && 'active-class')} />
```

### Tailwind

- Tailwind config lives in `tailwind.config.ts` (generated by shadcn/ui init)
- Use shadcn/ui CSS variables (`--background`, `--foreground`, `--primary`, etc.) for theming
- Do not hardcode hex/rgb colours — use the CSS variable tokens so the theme is swappable
- Utility classes inline in JSX; no separate CSS files except for global resets in `index.css`

### TypeScript Types

```typescript
// src/types/customer.ts
export interface Customer {
  id: number
  firstName: string
  lastName: string
  dateOfBirth: string  // ISO date string "YYYY-MM-DD"
  createdAt: string    // ISO timestamp
}

export interface CreateCustomerRequest {
  firstName: string
  lastName: string
  dateOfBirth: string
}

export interface FieldError {
  field: string
  message: string
}

export interface ApiError {
  errors: FieldError[]
}
```

### Axios Instance

Configure a single Axios instance — never import Axios directly in components:

```typescript
// src/api/axios.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})
```

### API Functions

Keep API calls in `src/api/customerApi.ts` — pure async functions, no hooks:

```typescript
import { apiClient } from './axios'
import type { Customer, CreateCustomerRequest } from '@/types/customer'

export const getCustomers = () =>
  apiClient.get<Customer[]>('/api/customers').then(r => r.data)

export const createCustomer = (data: CreateCustomerRequest) =>
  apiClient.post<Customer>('/api/customers', data).then(r => r.data)
```

### React Query Hooks

All server state lives in hooks under `src/hooks/`. Components never call API functions directly.

```typescript
// src/hooks/useCustomers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCustomers, createCustomer } from '@/api/customerApi'
import type { CreateCustomerRequest } from '@/types/customer'

export const CUSTOMERS_KEY = ['customers'] as const

export function useCustomers() {
  return useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: getCustomers,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => createCustomer(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  })
}
```

### QueryClient Setup

```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
```

### Component Rules

- **No business logic in components** — use hooks
- **No direct API calls in components** — use hooks
- **Props over prop-drilling** for this scope — no Zustand/Context needed
- **shadcn/ui `<Form>`** (built on react-hook-form) for the customer form — it handles
  validation state, error display, and accessibility automatically
- Handle React Query error states in the component that owns the mutation/query:

```typescript
const { mutate, isPending, error } = useCreateCustomer()

// Map API validation errors back to form fields
if (axios.isAxiosError(error) && error.response?.status === 400) {
  const apiError = error.response.data as ApiError
  apiError.errors.forEach(e => form.setError(e.field as keyof CreateCustomerRequest, {
    message: e.message
  }))
}
```

### ESLint + Prettier

`eslint.config.js` should extend:
- `eslint:recommended`
- `@typescript-eslint/recommended`
- `plugin:react-hooks/recommended`
- `plugin:jsx-a11y/recommended`

`.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

Run: `npm run lint` / `npm run format`
Scripts in `package.json`:
```json
"lint": "eslint src --ext .ts,.tsx",
"format": "prettier --write src"
```

---

## API Contracts

### POST /api/customers

**Request:**
```json
{ "firstName": "Jane", "lastName": "Smith", "dateOfBirth": "1990-05-15" }
```

**201 Created:**
```json
{ "id": 1, "firstName": "Jane", "lastName": "Smith", "dateOfBirth": "1990-05-15", "createdAt": "2026-03-20T10:00:00Z" }
```

**400 Bad Request:**
```json
{ "errors": [{ "field": "firstName", "message": "must not be blank" }] }
```

### GET /api/customers

**200 OK:** Array of the above customer shape (empty array `[]` when no records).

### GET /api/customers/{id}

**200 OK:** Single customer. **404 Not Found:** `{ "errors": [{ "field": "id", "message": "not found" }] }`

---

## Testing Standards

### Backend

- `@SpringBootTest(webEnvironment = RANDOM_PORT)` + `MockMvc` for controller integration tests
- Test against the real H2 in-memory database — no mocking of the repository layer
- Cover: POST 201, POST 400 (blank fields, future date of birth), GET 200, GET 404

### Frontend

- **Vitest** as test runner (Vite-native, no Jest config needed)
- **React Testing Library** — test behaviour, not implementation
- **msw v2** for API mocking in tests — handlers in `src/mocks/handlers.ts`
- Cover: form renders and submits, validation errors display, list renders rows, loading/error states

### What to skip (given time-box)

- Full Playwright E2E — `docker compose up` smoke test covers integration
- Backend service unit tests are optional if controller integration tests cover the same path

---

## Docker / Running Locally

**Primary workflow (Mac + Docker Desktop):**
```bash
docker compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:8080/api/customers
```

**Backend only (local dev):**
```bash
cd backend && ./gradlew bootRun --args='--spring.profiles.active=dev'
# H2 console → http://localhost:8080/h2-console
```

**Frontend only (local dev, expects backend on :8080):**
```bash
cd frontend && npm run dev
# Vite proxy in vite.config.ts forwards /api → http://localhost:8080
```

**Vite dev proxy** (avoids needing Nginx during local dev):
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true }
  }
}
```

**Teardown:**
```bash
docker compose down
```

---

## Environment Variables

| Variable | Where set | Value |
|---|---|---|
| `VITE_API_BASE_URL` | Docker Compose build arg | `http://localhost:8080` |
| `SPRING_PROFILES_ACTIVE` | Docker Compose environment | `docker` |
| `SERVER_PORT` | Docker Compose environment | `8080` |

Never hardcode these values in application code.

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
- [ ] `README.md` covers prerequisites + how to run
- [ ] `AI_USAGE.md` is accurate and honest
- [ ] Git bundle created: `git bundle create james-bolton-tech-test.bundle --all`

---

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.9'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: customer-api
    ports:
      - '8080:8080'
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SERVER_PORT=8080
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/actuator/health']
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - customer-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE_URL=http://localhost:8080
    container_name: customer-ui
    ports:
      - '3000:80'
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - customer-net

networks:
  customer-net:
    driver: bridge
```

### Backend Dockerfile (multi-stage)

```dockerfile
# Stage 1 — Build
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts .
COPY src src
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

# Stage 2 — Runtime (lean JRE image)
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend Dockerfile (multi-stage)

```dockerfile
# Stage 1 — Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2 — Serve (minimal Nginx)
FROM nginx:stable-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

Handles SPA routing and proxies `/api` to the backend container — avoids browser CORS issues.

```nginx
server {
    listen 80;
    location / {
        root   /usr/share/nginx/html;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass         http://backend:8080;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }
}
```

---

## Phased Implementation Plan

Structured into four phases, each delivering working, testable output.

| Phase | Scope | Time Est. | Deliverable |
|-------|-------|-----------|-------------|
| 1 — Scaffold | Repo structure, Gradle, Vite, Dockerfiles, Compose | 30 min | Running containers (empty app) |
| 2 — Backend | Entity, repository, service, controller, validation, H2, tests | 60 min | Working REST API + tests |
| 3 — Frontend | Types, API client, CustomerForm, CustomerList, styling | 60 min | Working UI end-to-end |
| 4 — Polish | Error handling, loading states, FE tests, README, AI_USAGE.md | 45 min | Submission-ready bundle |

### Phase 1 — Scaffold
- Initialise git repository with `.gitignore` for Gradle and Node
- Bootstrap Spring Boot via start.spring.io (Kotlin, Gradle, Web, Data JPA, H2, Actuator, Validation)
- Bootstrap React/Vite: `npm create vite@latest frontend -- --template react-ts`
- Write skeleton Dockerfiles and docker-compose.yml — verify both containers start

### Phase 2 — Backend
- Define `Customer` entity with `@Entity`, `@Id`, `@GeneratedValue`
- Create `CustomerRepository` extending `JpaRepository<Customer, Long>`
- Implement `CustomerService` with `create()` and `getAll()`
- Expose `CustomerController` with POST and GET endpoints
- Add Bean Validation (`@NotBlank`, `@NotNull`, `@Past`) and `@RestControllerAdvice` for 400 errors
- Configure H2 console (dev profile only) and JPA in `application.yml`
- Write integration tests with `@SpringBootTest` + MockMvc

### Phase 3 — Frontend
- Define `Customer` TypeScript interface in `src/types/customer.ts`
- Implement `customerApi.ts` with typed Axios wrappers
- Build `CustomerForm` with validation feedback via shadcn/ui `<Form>`
- Build `CustomerList` + `CustomerRow` to display all customers
- Wire React Query hooks — invalidate cache on successful POST
- Apply Tailwind + shadcn/ui styling

### Phase 4 — Polish & Submission
- Add loading and error states to all components
- Write Vitest + RTL unit tests for form and list
- Finalise README.md and AI_USAGE.md
- End-to-end smoke test via `docker compose up`
- Create git bundle: `git bundle create james-bolton-tech-test.bundle --all`
