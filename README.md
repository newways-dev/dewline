# dewline — find your line

An AI driving coach for sim racing beginners in Assetto Corsa.
dewline records your laps, finds where you lose time (braking, apex, corner exit)
and explains it in plain language — one clear tip at a time.

> **Status:** early development. Telemetry reading from Assetto Corsa works;
> lap recording, backend and web app are next.

## Why

Most telemetry tools are built for people who already know how to read traces.
dewline is built for the first 10–20 hours: plain language, consistency before speed,
comparison with your own best lap, and short lessons linked to every tip.

## Architecture

```
Gaming PC (Windows)                 Server                              Browser
┌───────────────┐   REST    ┌──────────────────────────┐   tRPC   ┌──────────────┐
│ Assetto Corsa │           │ api (NestJS)             │◀────────▶│ web          │
│ shared memory │           │ identity · catalog ·     │          │ Next.js      │
│       │       │           │ ingestion                │          │ shadcn/ui    │
│       ▼       │           │        │                 │          │ ECharts      │
│ telemetry     │──────────▶│    RabbitMQ              │          └──────────────┘
│ Node + Koffi  │           │        │                 │
│ outbox        │           │ worker (NestJS)          │─────────▶ LLM provider
└───────────────┘           │ analysis · coaching      │           (findings only)
                            │        │                 │
                            │ PostgreSQL + Prisma      │
                            └──────────────────────────┘
```

- **Rules find problems, AI explains them.** The model never sees raw telemetry:
  it receives computed findings and its answer is validated against them.
- **Every tip links to evidence** — a specific corner on a specific lap.
- **Laps are never lost:** the agent saves each lap to a local outbox before upload.

## Tech stack

| Part            | Technology                                       |
| --------------- | ------------------------------------------------ |
| Telemetry agent | Node.js, TypeScript, Koffi (Win32 shared memory) |
| Backend         | NestJS (modular monolith: api + worker)          |
| Messaging       | RabbitMQ                                         |
| Database        | PostgreSQL, Prisma                               |
| Web             | Next.js, Tailwind CSS, shadcn/ui, ECharts, tRPC  |
| Validation      | Zod                                              |

## Repository layout

```
apps/
  telemetry/   # Windows agent: reads Assetto Corsa shared memory
packages/      # shared types and lap codec (coming soon)
```

## Getting started

Requirements: Windows, Assetto Corsa, Node.js 24.12+ (26 LTS recommended), pnpm.

```bash
pnpm install
pnpm typecheck
pnpm probe     # prints live speed, inputs, gear and lap data from the game
```

## Roadmap

1. **Foundation** — telemetry agent, lap recording, corner metrics
2. **MVP** — consistency score, lap comparison, AI coach with evidence, demo account
3. **Beginner layer** — glossary, "why it matters" explanations, mini lessons, voice summary
4. **Extensions** — wheel setup check, session goals, achievements
5. **Advanced** — live voice coach, second-screen dashboard, error heatmap
