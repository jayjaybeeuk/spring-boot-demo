# CLAUDE.md — Customer Management Application

Architecture and coding standards for the Allica Bank Senior+ Full Stack Technical Test.
All decisions here supersede generic defaults. Read this before touching any file.

> Agent orchestration: see [agents.md](agents.md)

---

## Project Overview

A full-stack Customer Management Application. Backend exposes a REST API to create and retrieve
customer records. Frontend provides a form and list view. Everything runs via Docker Compose.

---

## Tech Stack (locked)

| Layer | Technology | Version |
|---|---|---|
| Backend language | Kotlin | 1.9.x (JVM 21) |
| Backend framework | Spring Boot | 3.5.x |
| Database | H2 in-memory | 2.x (embedded, no separate container) |
| ORM | Spring Data JPA | Bundled with Boot |
| Build tool | Gradle Kotlin DSL | 8.x |
| Backend linting | ktlint | 12.x plugin / 1.5.x engine |
| Frontend | React + TypeScript | 19 / 5.x |
| Frontend build | Vite | 8.x |
| Component library | shadcn/ui (manual) | Radix UI + Tailwind v4 |
| Styling | Tailwind CSS | v4 (`@tailwindcss/vite` plugin) |
| HTTP client | Axios | 1.x |
| Server state | TanStack Query (React Query) | v5 |
| Form validation | react-hook-form + zod | 7.x / 4.x |
| Frontend testing | Vitest + React Testing Library | 4.x / 16.x |
| API mocking | msw (Mock Service Worker) | v2 |
| Containerisation | Docker + Compose | Latest stable |

---

## Repository Structure

```
Allica-tech/
├── docker-compose.yml
├── README.md
├── AI_USAGE.md
├── CLAUDE.md                          ← this file
├── agents.md                          ← agent orchestration notes
│
├── backend/
│   ├── Dockerfile
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── src/
│       ├── main/kotlin/com/example/customers/
│       │   ├── CustomersApplication.kt
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
│           └── CustomerControllerTest.kt
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts                 ← also holds Vitest config (use vitest/config)
    ├── tsconfig.app.json              ← includes @/ path alias
    ├── components.json                ← shadcn/ui config
    └── src/
        ├── main.tsx                   ← QueryClientProvider wrapper
        ├── App.tsx
        ├── api/
        │   ├── axios.ts               ← configured Axios instance (relative baseURL)
        │   └── customerApi.ts         ← typed API functions
        ├── components/
        │   ├── ui/                    ← shadcn/ui components (owned code, edit freely)
        │   ├── CustomerForm.tsx
        │   ├── CustomerList.tsx
        │   └── CustomerRow.tsx
        ├── hooks/
        │   └── useCustomers.ts        ← React Query hooks
        ├── types/
        │   └── customer.ts
        ├── lib/
        │   └── utils.ts               ← cn() utility
        ├── mocks/
        │   ├── handlers.ts            ← msw request handlers
        │   └── server.ts              ← msw node server
        └── test/
            ├── setup.ts               ← msw lifecycle + jest-dom
            ├── CustomerForm.test.tsx
            ├── CustomerList.test.tsx
            ├── customerApi.test.ts
            └── ui.test.tsx
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

    val createdAt: Instant = Instant.now(),
)
```

### DTOs

Separate request and response objects. Never leak JPA entities to the API layer.

```kotlin
data class CreateCustomerRequest(
    @field:NotBlank val firstName: String,
    @field:NotBlank val lastName: String,
    @field:NotNull @field:Past val dateOfBirth: LocalDate,
)

data class CustomerResponse(
    val id: Long,
    val firstName: String,
    val lastName: String,
    val dateOfBirth: LocalDate,
    val createdAt: Instant,
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
- Map entity → DTO in the service layer using a private extension function

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

Implement via `@RestControllerAdvice` in `exception/GlobalExceptionHandler.kt`.

### ktlint

```kotlin
// build.gradle.kts
plugins {
    id("org.jlleitschuh.gradle.ktlint") version "12.1.2"
}
ktlint {
    version.set("1.5.0")
    android.set(false)
}
```

Run: `./gradlew ktlintCheck` / auto-fix: `./gradlew ktlintFormat`

---

## Frontend Conventions (React 19 + TypeScript)

### shadcn/ui Setup

shadcn/ui components live in `src/components/ui/` — they are owned code, edit freely.

**Note:** `npx shadcn@latest init` is interactive and cannot be scripted. Set up manually:
1. Install deps: `tailwindcss @tailwindcss/vite class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-slot tw-animate-css`
2. Create `components.json` with `"style": "default"`, `"tsx": true`, `"aliases.utils": "@/lib/utils"`
3. Add `@import "tailwindcss"; @import "tw-animate-css";` to `index.css` with CSS variable theme tokens
4. Use `@tailwindcss/vite` Vite plugin — there is no `tailwind.config.ts` with Tailwind v4

### Tailwind v4

- No `tailwind.config.ts` — configuration is done in `index.css` via `@theme inline {}`
- Use CSS variables for theming: `--background`, `--foreground`, `--primary`, etc.
- Map tokens via `@theme inline` block so Tailwind utilities reference CSS variables
- Do not hardcode hex/rgb colours

### Vite + Vitest Config

Import from `vitest/config` (not `vite`) so the `test` block is typed correctly:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
```

### TypeScript Path Alias

Set in `tsconfig.app.json` — required for `@/` imports:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

### Axios Instance

Use a **relative `baseURL`** — this lets nginx proxy `/api/*` in Docker and Vite proxy it locally. Never hardcode a host here.

```typescript
// src/api/axios.ts
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})
```

`VITE_API_BASE_URL` is intentionally left unset in production builds. Set it only for
local dev if you need to point at a non-proxied host.

### API Functions

Keep in `src/api/customerApi.ts` — pure async functions, no hooks:

```typescript
export const getCustomers = () =>
  apiClient.get<Customer[]>('/api/customers').then((r) => r.data)

export const getCustomerById = (id: number) =>
  apiClient.get<Customer>(`/api/customers/${id}`).then((r) => r.data)

export const createCustomer = (data: CreateCustomerRequest) =>
  apiClient.post<Customer>('/api/customers', data).then((r) => r.data)
```

### React Query Hooks

All server state lives in `src/hooks/`. Components never call API functions directly.

```typescript
export const CUSTOMERS_KEY = ['customers'] as const

export function useCustomers() {
  return useQuery({ queryKey: CUSTOMERS_KEY, queryFn: getCustomers })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  })
}
```

### Form Validation

Use `react-hook-form` + `zod` directly (not the shadcn/ui `<Form>` wrapper — unnecessary complexity for this scope):

```typescript
const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  dateOfBirth: z.string().refine((v) => new Date(v) < new Date(), {
    message: 'Date of birth must be in the past',
  }),
})

const { register, handleSubmit, setError, reset, formState: { errors } } =
  useForm<FormValues>({ resolver: zodResolver(schema) })
```

Map API 400 errors back to form fields on mutation error:

```typescript
onError: (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 400) {
    const apiError = error.response.data as ApiError
    apiError.errors.forEach((e) =>
      setError(e.field as keyof FormValues, { message: e.message })
    )
  }
},
```

### Component Rules

- No business logic in components — use hooks
- No direct API calls in components — use hooks
- Handle all loading/error/empty states in the component that owns the query

---

## API Contracts

### POST /api/customers

**Request:** `{ "firstName": "Jane", "lastName": "Smith", "dateOfBirth": "1990-05-15" }`

**201 Created:** `{ "id": 1, "firstName": "Jane", "lastName": "Smith", "dateOfBirth": "1990-05-15", "createdAt": "2026-03-20T10:00:00Z" }`

**400 Bad Request:** `{ "errors": [{ "field": "firstName", "message": "must not be blank" }] }`

### GET /api/customers

**200 OK:** Array of customer shape. Empty array `[]` when no records.

### GET /api/customers/{id}

**200 OK:** Single customer. **404:** `{ "errors": [{ "field": "id", "message": "..." }] }`

---

## Testing Standards

### Backend

- `@SpringBootTest(webEnvironment = RANDOM_PORT)` + `@AutoConfigureMockMvc` + `MockMvc`
- Tests hit the real H2 in-memory database — do not mock the repository layer
- Cover: POST 201, POST 400 (blank fields, future date of birth), GET 200 list, GET 404

### Frontend

- **Vitest** (configured in `vite.config.ts` via `vitest/config`)
- **React Testing Library** — test behaviour, not implementation
- **msw v2** for API mocking — handlers in `src/mocks/handlers.ts`, server in `src/mocks/server.ts`
- Test setup in `src/test/setup.ts`: starts/resets/closes msw server around each test
- Target: 90%+ coverage across all metrics (`npm run test:coverage`)
- Current: 96.1% statements, 93.75% branches, 100% functions, 95.83% lines (23 tests)

### msw Handler Pattern

Handlers should cover all API routes used by the app. Override per-test with `server.use(...)` for error cases. Use `delay('infinite')` to test pending/loading states.

---

## Docker / Running Locally

**Primary workflow:**
```bash
docker compose up --build
# Frontend → http://localhost:3001
# Backend  → http://localhost:8080/api/customers
```

**Backend only (local dev, dev profile enables H2 console):**
```bash
cd backend && ./gradlew bootRun --args='--spring.profiles.active=dev'
# H2 console → http://localhost:8080/h2-console
```

**Frontend only (local dev — Vite proxy handles /api → :8080):**
```bash
cd frontend && npm run dev
```

**Tests:**
```bash
cd frontend && npm run test          # Vitest unit tests
cd frontend && npm run test:coverage # with coverage report
cd backend  && ./gradlew test        # Spring Boot integration tests
```

---

## Docker Configuration

### Networking pattern

The frontend container runs nginx. All `/api/` requests from the browser hit nginx on port 80,
which proxies to the `backend` container on the Docker internal network. The browser never
calls the backend directly — this avoids CORS entirely.

**Do not** pass `VITE_API_BASE_URL` as a build arg to the frontend Docker image. The axios
`baseURL` must stay relative (`''`) so nginx handles routing.

### docker-compose.yml (key points)

```yaml
services:
  backend:
    healthcheck:
      # Use wget — curl is not in eclipse-temurin:21-jre-alpine
      test: ['CMD', 'wget', '--quiet', '--spider', 'http://localhost:8080/actuator/health']
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s

  frontend:
    # No build args — baseURL must be relative for nginx proxy to work
    depends_on:
      backend:
        condition: service_healthy
```

### nginx.conf

```nginx
server {
    listen 80;

    # Docker's internal DNS — defer upstream resolution to request time (not startup)
    resolver 127.0.0.11 valid=30s ipv6=off;

    location / {
        root   /usr/share/nginx/html;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        # Must use a variable — otherwise nginx fails at startup if backend isn't up yet
        set $backend http://backend:8080;
        proxy_pass         $backend;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }
}
```

### Backend Dockerfile

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts .
COPY src src
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build          # no VITE_API_BASE_URL — stays relative

FROM nginx:stable-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Environment Variables

| Variable | Where set | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Docker Compose environment | `docker` in containers, `dev` for local |
| `SERVER_PORT` | Docker Compose environment | `8080` |
| `VITE_API_BASE_URL` | Local `.env` only (optional) | Override API host for local dev without proxy |

`VITE_API_BASE_URL` is **not** set in Docker builds. The default `''` (relative URL) is correct for production — nginx proxies `/api/`.

---

## Submission Checklist

- [x] `docker compose up --build` starts both containers cleanly on port 3001 (frontend) and 8080 (backend)
- [x] POST /api/customers creates a record (verified in browser)
- [x] GET /api/customers returns the list
- [x] Validation errors surface in the UI (submit empty form)
- [x] `./gradlew ktlintCheck` passes
- [x] `npm run lint` passes
- [x] Backend integration tests pass: `./gradlew test`
- [x] Frontend unit tests pass: `npm run test` (23 tests, 96%+ coverage)
- [x] `README.md` covers prerequisites + how to run
- [x] `AI_USAGE.md` is accurate and honest
- [x] Git bundle: `git bundle create james-bolton-tech-test.bundle --all`
