# AGENT Guide

## 1. Mission & Domain

- Sample project for learning Domain-Driven Design (DDD) and CQRS around an article publishing domain.
- Provides an HTTP API (Hono.js) for article commands/queries, persists domain events in PostgreSQL (Prisma), and maintains a Redis read-model projected from Kafka domain events.
- Documents in `doc/` explain DDD concepts, domain classification, and bounded contexts—skim them for vocabulary and invariants.

## 2. Tech Stack & Key Dependencies

- Language/runtime: TypeScript targeting Node.js (ESNext modules).
- Frameworks/libraries: Hono.js, hono-simple-di, KafkaJS, Redis client, Prisma ORM, Zod for validation, tsx for TS execution.
- Tooling: pnpm package manager, Prettier, oxlint, concurrently, dotenv for environment loading.
- External services: Apache Kafka, Redis, PostgreSQL (via Prisma). Docker Compose file is provided to spin them up locally.

## 3. Environment Setup & Commands

### 3.1 Prerequisites

- Node.js compatible with pnpm 10.x; install dependencies with `pnpm install`.
- Ensure Docker (or equivalent) available to run Kafka, Redis, and PostgreSQL (`docker-compose.yml`).
- Provide `.env` with `DATABASE_URL`, `KAFKA_BROKERS`, `REDIS_HOST`, etc., or rely on defaults (localhost, standard ports).

### 3.2 Running Services

1. `docker-compose up -d` to start Kafka, Redis, PostgreSQL.
2. `pnpm migration` to apply Prisma migrations (assumes `DATABASE_URL`).
3. `pnpm dev` runs subscriber and API concurrently (watch mode via tsx).
   - `pnpm dev:api` launches `server.ts`, which verifies Redis/Kafka availability before serving on port 3000.
   - `pnpm subscribe` runs `scripts/subscribeDomainEvent.ts`, bootstrapping the Kafka subscriber that projects to Redis.

### 3.3 Utility Commands

- `pnpm doc`: generate OpenAPI schema (`scripts/generateOpenAPI.ts`).
- `pnpm build`: compile TypeScript.
- `pnpm lint` / `pnpm lint:fix`: run oxlint.
- `pnpm format` / `pnpm format:check`: Prettier formatting.

## 4. Architecture & Code Map

### 4.1 Layering

- **Domain (`modules/article/domain/`)**: Pure business logic—entities, value objects, domain events, factory.
- **Application (`modules/article/application/`)**: Use cases orchestrating repositories, publishers, projectors. DTOs and interfaces define boundaries.
- **Infrastructure (`modules/article/infrastructure/`)**: Concrete adapters for persistence (Prisma), messaging (Kafka), read model (Redis), HTTP controllers/openapi.
- **Shared (`modules/shared/`)**: Cross-cutting infra helpers (Kafka brokers resolver, Redis singleton) and shared value objects.

### 4.2 Domain Highlights

- `Article` aggregate orchestrates event-sourced mutations (`Article.ts`).
- Events built via `ArticleEventFactory` with type-safe serialization.
- Value objects enforce invariants (e.g., `Title`, `Content`).

### 4.3 Application Layer

- `CreateArticleUseCase`: validates duplicates via repository, saves event stream, publishes latest domain event.
- `SearchArticleUseCase`: queries Redis read model.
- Interfaces in `application/interface/` decouple use cases from infrastructure.

### 4.4 Infrastructure Components

- **HTTP**: `modules/index.ts` wires Hono app, DI container (`article/dependencies.ts`), routes, error handling.
- **Repositories**: `ArticleEventRepository` persists domain events using Prisma (`@prisma/client`). Requires `DATABASE_URL`.
- **Events**: `KafkaDomainEventPublisher` emits serialized events; `KafkaArticleDomainEventSubscriber` consumes them with retry + dead-letter support; `ArticleEventKafkaMapper` handles serialization boundaries.
- **Read model**: `ArticleReadModelProjector` mutates Redis structures (hashes, sets) based on incoming events; `ArticleReadModelQuery` reads read models for search.

### 4.5 Supporting Scripts & Docs

- `scripts/subscribeDomainEvent.ts` boots the subscriber process.
- `rest-client/` holds HTTP request samples for IDE REST clients.
- Docs in `doc/` detail DDD rationale and bounded contexts—reference when extending domain concepts.

## 5. Data Flow & Runtime Behaviour

### 5.1 Write Path (Command)

1. API receives request via Hono route/controller.
2. Controller invokes use case; `CreateArticleUseCase` builds aggregate using value objects.
3. Repository persists latest domain event in PostgreSQL.
4. Domain event published to Kafka via `KafkaDomainEventPublisher`.

### 5.2 Event Projection & Read Path

1. Subscriber (`pnpm subscribe`) consumes Kafka topic `article-events`.
2. Message parsed by `ArticleEventKafkaMapper.deserialize`.
3. `ArticleReadModelProjector` mutates Redis read-model structures (per article key + status indexes).
4. Queries use `ArticleReadModelQuery` to retrieve data for API responses.

### 5.3 Failure Handling

- Subscriber retries failed handlers up to `ARTICLE_EVENT_MAX_RETRIES` (default 3) with exponential backoff starting at `ARTICLE_EVENT_RETRY_DELAY_MS` (default 500ms).
- Exhausted messages are sent to dead-letter topic `article-events-dead-letter` (configurable via `ARTICLE_EVENT_DEAD_LETTER_TOPIC`, set empty string to disable); payload includes original topic, group id, serialized error, timestamp.
- If dead-letter publishing fails, error logged; manual intervention required.
- API startup (`server.ts`) verifies Redis and Kafka availability (up to 5 attempts with delays) before serving requests.

## 6. Configuration & Environment Variables

- `DATABASE_URL`: Prisma connection string (required for repository operations/migrations).
- `KAFKA_BROKERS`: comma-separated broker list; defaults to `localhost:9092`.
- `ARTICLE_EVENT_TOPIC`: command topic (defaults `article-events`).
- `ARTICLE_READ_MODEL_GROUP_ID`: consumer group id (defaults `article-read-model`).
- `ARTICLE_EVENT_MAX_RETRIES`, `ARTICLE_EVENT_RETRY_DELAY_MS`, `ARTICLE_EVENT_DEAD_LETTER_TOPIC`: subscriber reliability tuning.
- `REDIS_HOST`, `REDIS_PORT`: Redis connection (defaults localhost/6379).
- Any change requires reloading relevant processes; subscriber and API read `.env` through `dotenv/config`.

## 7. Conventions & Practices

- Use TypeScript modules with explicit `.ts` extensions; compiler opts into `allowImportingTsExtensions`.
- Follow DDD boundaries—domain layer must remain persistence-agnostic; new infrastructure adapters should implement existing interfaces in `application/interface`.
- Value objects enforce invariants in constructors; use them instead of raw primitives across domain.
- When adding events, update `ArticleEventKafkaMapper`, `ArticleEventFactory`, and projector/query for consistency.
- Prefer `apply_patch` or proper formatting; run `pnpm lint`/`pnpm format` before commits.
- No automated tests yet—add targeted tests when extending behaviour.

## 8. Security, Reliability & Constraints

- Do not block command completion on read-model failures—eventual consistency is intentional.
- Ensure sensitive config (DB URLs, Kafka creds) loaded via environment; `.env` should stay out of VCS.
- Kafka/Redis clients log errors; consider adding structured logging or monitoring hooks if extending in production scenarios.
- Prisma client is a singleton within repository file; avoid re-instantiating per request.
- Be mindful of backpressure/duplication: `ArticleEventRepository.checkDuplicate` filters via event history—maintain logic if event schema changes.

## 9. Recommended Workflow for Agents

1. Read top-level `README.md` for process overview, then skim `doc/` for domain vocabulary.
2. Inspect relevant layer (domain/application/infrastructure) depending on task; interfaces in `application/interface` show required shapes.
3. Before coding, confirm necessary services (Kafka, Redis, Postgres) and env vars; use Docker Compose for local testing.
4. Implement changes respecting layer boundaries; update serialization/projector when introducing new domain events.
5. Run `pnpm lint` and format; if interacting with runtime, use `pnpm dev` and observe subscriber logs for retry/DLQ behaviour.
6. Document new behaviour in appropriate README or OpenAPI if it affects external contract.

## 10. References & Further Reading

- `README.md`: quickstart, command list, operational notes.
- `modules/article/infrastructure/event/README.md`: detailed event pipeline, retry/DLQ configuration.
- `modules/article/infrastructure/readmodel/README.md`: Redis read-model rationale.
- `doc/01.DDD.md`, `doc/02.DOMAIN.ja.md`, `doc/03.BOUNDED_CONTEXT.ja.md`: conceptual background.
- `rest-client/`: sample API invocations for verifying behaviour.
