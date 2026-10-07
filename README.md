# Pazzell

Brain-training games for IQ development. This repository is the web frontend (Next.js).

- **Match** — a reasoning game for ages 2 to 5. One target artifact, a row of options, tap the
  one that matches. Level based: level N+1 unlocks when every question in level N is answered
  correctly in one attempt.
- **Trivia** — study a set of cards with the answers shown, then get quizzed on the same cards.
  Topic based, no levels.
- **Custom trivia** — any player can build their own trivia and share it by link.
- **Brand campaigns** — brands pay a flat price to run a sponsored trivia, which freemium
  players are shown between their own games.
- **Pro** — a paid tier with no sponsored interruptions and unlimited custom trivias.

There are no points, leaderboards, rankings, ads or prize draws.

## Roles

| Role | Home | What they do |
| --- | --- | --- |
| Player (`gamer`) | `/user/dashboard` | Play Match and Trivia, build custom trivias, upgrade to Pro, withdraw from the wallet |
| Brand | `/brand/dashboard` | Set up a brand profile, build and pay for campaigns, read campaign results |
| Admin | `/admin` | Manage topics, cards, Match levels and global settings; moderate campaigns; view revenue |

## Tech stack

- Next.js 15 (App Router) and TypeScript
- Tailwind CSS with shadcn/ui components
- TanStack Query for server state, Jotai for the logged-in user
- Axios (`src/lib/api.ts`) with bearer auth and cookie-based token refresh
- Vitest and React Testing Library

The frontend never talks to a database. Everything goes through the backend API, whose contract
is documented in [`docs/frontend-integration.md`](docs/frontend-integration.md). That file is the
source of truth for endpoints, payloads, error codes and state machines.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill it in
npm run dev                        # http://localhost:3000
```

The backend must be running and reachable at `NEXT_PUBLIC_API_URL`.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Origin of the backend, without a path (for example `http://localhost:4000`). The app calls `{origin}/api/v1/...` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Enables the Google sign-in button. Left out, the button is hidden |

Three routes are linked to from outside the app, so the backend's `FRONTEND_URL` must point at
wherever this frontend is served:

- `/q/:slug` — shared custom trivia links
- `/payment/verify?reference=` — the return page after a Paystack checkout
- `/reset-password?token=` — password reset emails

Token refresh uses a `refresh_token` cookie, so the frontend and the API need to be able to
share cookies (same site, or a cross-site cookie setup on the backend).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |
| `npm run test` / `npm run test:watch` | Vitest |

Docker and deployment scripts are described in [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Project structure

```
src/
├── app/
│   ├── (routes)/
│   │   ├── (private-pages)/        # Login required
│   │   │   ├── match/              # Level map and the level play page
│   │   │   ├── trivia/             # Topic picker and setup
│   │   │   ├── play/[sessionId]/   # Study → quiz → result, for every kind of trivia
│   │   │   ├── my-quizzes/         # Custom trivia list, builder and preview
│   │   │   ├── pro/                # Plan and Pro checkout
│   │   │   ├── user/               # Player home, profile, settings, wallet
│   │   │   ├── brand/              # Brand home, campaigns, profile
│   │   │   └── admin/              # Admin pages
│   │   └── (public-pages)/         # Login, register, /q/[slug], /payment/verify, ...
│   └── _utils/                     # endpoints.ts, routes.ts, constants.ts
├── atom/user.ts                    # Logged-in user (persisted to localStorage)
├── components/
│   ├── ui/                         # shadcn/ui primitives and shared widgets
│   ├── match/  trivia/  cards/     # Game screens and the shared card editor
│   ├── quizzes/  campaigns/  pro/  admin/
│   └── layout/  auth/
├── hooks/                          # Game settings, plan, session start, back-navigation block
├── lib/                            # API client, uploads, sound, small helpers
└── types/index.ts                  # All API types
```

## How the games work

A few rules shape most of the code:

- **The server owns the clock and the answers.** Every question carries `deadlineAt` and
  `serverTime`; the countdown is driven from those, not the device clock. The correct answer is
  only returned after a question is settled.
- **Forward only.** The server serves only the current question. There is no back button in a
  game, and the browser back button is blocked while one is running.
- **Refresh safe.** `/play/[sessionId]` renders from the server's session status, so a refresh
  lands on the same phase and the same question with the time that is left.
- **One timer range.** 1 to 7 whole seconds per question for every game, chosen by the player
  before starting. Limits and prices come from `GET /settings/game`; nothing is hard-coded.
- **One trivia engine.** Topics, custom trivias and campaigns all run through the same session
  endpoints and the same play page.
- **The campaign gate.** When a freemium player owes a sponsored trivia, starting any other
  trivia returns `CAMPAIGN_REQUIRED` and the app offers the campaign instead.

## Testing

`npm run test` covers Match answer and timer handling, the Trivia quiz (timeout, forward only,
resume), the campaign gate, the upgrade prompts, the wallet, and the small validation helpers.
Tests mock `@/lib/api` and render pages with a fresh query client (see `src/test-utils.tsx`).

Before a release, walk through [`docs/qa-checklist.md`](docs/qa-checklist.md) against a real
backend. It covers what the tests cannot: payments, uploads, sound, and layout on a phone.
