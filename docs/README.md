# InsightCode documentation

Index of project documentation for developers and operators.

---

## Overview and requirements

| Document | Description |
|----------|-------------|
| [PRD_INSIGHTCODE.md](PRD_INSIGHTCODE.md) | Product requirements: product overview, personas, Frontend/Backend/Admin requirements, main features |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture: Frontend ↔ Backend ↔ Worker diagram, layers (routes, controllers, middleware), data and external services |
| [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) | Code structure and flows: main files, route groups, controllers, DB schema, high-level flows for diagrams |

---

## Subsystems

| Document | Description |
|----------|-------------|
| [FRONTEND.md](FRONTEND.md) | Frontend: stack, how to run, folder structure, build |
| [WORKER_SYSTEM.md](WORKER_SYSTEM.md) | Worker (BullMQ): queue setup, job lifecycle, running the worker, internal judge endpoint |
| [REDIS_DESIGN.md](REDIS_DESIGN.md) | Redis usage: role (queue backend), configuration, monitoring, future use (cache, rate limit, etc.) |
| [FRONTEND_STATE_MANAGEMENT.md](FRONTEND_STATE_MANAGEMENT.md) | Frontend state: Zustand (auth), LoadingContext, per-page local state |

---

## Configuration and data

| Document | Description |
|----------|-------------|
| [OPENROUTER_MODELS.md](OPENROUTER_MODELS.md) | OpenRouter model recommendations by use case (code analysis, Ask AI), env setup |
| [TESTCASES_AND_LANGUAGES.md](TESTCASES_AND_LANGUAGES.md) | Test case structure and supported languages (currently run/judge: JS/TS only) |
| [SQL_INSERT_PROBLEMS_AND_TESTCASES.md](SQL_INSERT_PROBLEMS_AND_TESTCASES.md) | Example SQL for adding problems and test cases (seeding / manual insert) |

---

## Suggested reading order

1. **Start** – [PRD_INSIGHTCODE.md](PRD_INSIGHTCODE.md) → [ARCHITECTURE.md](ARCHITECTURE.md)
2. **Backend development** – [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md), [WORKER_SYSTEM.md](WORKER_SYSTEM.md), [REDIS_DESIGN.md](REDIS_DESIGN.md)
3. **Frontend development** – [FRONTEND.md](FRONTEND.md), [FRONTEND_STATE_MANAGEMENT.md](FRONTEND_STATE_MANAGEMENT.md)
4. **AI / DB setup** – [OPENROUTER_MODELS.md](OPENROUTER_MODELS.md), [SQL_INSERT_PROBLEMS_AND_TESTCASES.md](SQL_INSERT_PROBLEMS_AND_TESTCASES.md)
