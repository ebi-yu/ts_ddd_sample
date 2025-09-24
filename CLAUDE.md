# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Domain-Driven Design (DDD) sample implementation in TypeScript, demonstrating DDD concepts including Value Objects, Entities, Aggregates, and Domain Events. The project follows clean architecture principles with clear separation of concerns.

## Development Commands

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript to dist/
- `pnpm start` - Run compiled application
- `pnpm migration` - Run Prisma migrations
- `pnpm format` - Format code using Biome

## Architecture

The project follows a modular DDD architecture with bounded contexts:

### Directory Structure

```
modules/
├── shared/           # Shared domain concepts (Email, PlainDate)
├── article/          # Article bounded context
│   ├── domain/       # Domain layer (entities, VOs, events)
│   ├── application/  # Use cases and application services
│   └── infrastructure/ # External adapters
└── user/             # User bounded context
    └── vo/           # User value objects
```

### Domain Layer Design

- **Value Objects**: Immutable objects without identity (ArticleId, Title, Content, Email)
- **Entities**: Objects with identity and lifecycle (Article, User)
- **Domain Events**: Event sourcing pattern with ArticleEvent and EventType
- **Aggregates**: Article serves as aggregate root

### Key Patterns

- **Event Sourcing**: State changes captured as immutable events
- **CQRS**: Command/Query separation (see modules/article/domain/index.ts for examples)
- **Clean Architecture**: Dependencies point inward toward domain
- **Dependency Injection**: Uses Inversify.js for DI container

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Hono.js (lightweight web framework)
- **Database**: SQLite (write model) + Redis (read model)
- **ORM**: Prisma
- **Validation**: Zod
- **Code Quality**: Biome (formatting + linting)
- **DI Container**: Inversify.js

## Code Conventions

- Use single quotes for strings
- 2-space indentation
- 100 character line width
- Semicolons required
- ES5 trailing commas
- File extensions required in imports (.ts)
- Barrel exports in domain/index.ts files

## Database

- Prisma schema in `prisma/schema.prisma`
- Migrations run with `pnpm migration`
- Uses SQLite for development

## Path Aliases

- `@shared/*` maps to `modules/shared/*`

## Testing

No specific test framework configured yet - check with user for preferred testing approach.
