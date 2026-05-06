# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrandPuzzle is a gamified marketing platform where brands create engaging puzzle campaigns and users play these puzzles to earn money. The platform features:
- **Two user types**: Users (puzzle players) and Brands (campaign creators)
- **Puzzle-based gaming**: Various puzzle types including trivia, word puzzles, image puzzles, memory games, and quizzes
- **Earning system**: Users earn money by completing puzzles from brand campaigns
- **Campaign management**: Brands can create, manage, and analyze their puzzle campaigns

## Tech Stack & Architecture

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **State Management**:
  - Jotai (atom-based) for global user state in `src/atom/user.ts`
  - TanStack Query (React Query) for server state and data fetching
- **API Client**: Axios with interceptors configured in `src/lib/api.ts`
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Supabase Auth with token-based approach

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint the codebase
npm run lint

# Docker commands
npm run docker:build    # Build Docker image
npm run docker:run      # Run Docker container
npm run docker:compose  # Run with docker-compose

# Deployment scripts
npm run deploy:vercel   # Deploy to Vercel
npm run deploy:docker   # Deploy via Docker
npm run deploy:railway  # Deploy to Railway
```

## Project Structure

```
src/
├── app/
│   ├── (routes)/
│   │   ├── (private-pages)/    # Protected routes requiring authentication
│   │   │   ├── user/           # User-specific pages (dashboard, puzzles, earnings)
│   │   │   └── brand/          # Brand-specific pages (dashboard, campaigns, analytics)
│   │   └── (public-pages)/     # Public routes (login, register, verify-otp, about)
│   ├── _utils/
│   │   ├── endpoints.ts        # API endpoint definitions
│   │   ├── routes.ts           # Frontend route definitions
│   │   ├── constants.ts        # Application constants
│   │   └── helper.ts           # Helper functions
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Landing page
├── atom/
│   └── user.ts                 # Jotai user state atom with localStorage persistence
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── auth/                   # Authentication components (protected-route.tsx)
│   ├── layout/                 # Layout components (header, footer, main-layout)
│   └── providers/              # React Query provider
├── providers/
│   ├── tanstack-provider.tsx   # TanStack Query setup
│   └── theme-provider.tsx      # Theme provider
├── lib/
│   ├── api.ts                  # Axios instance with auth interceptors
│   ├── supabase.ts             # Supabase client initialization
│   ├── query-client.ts         # TanStack Query configuration
│   └── utils.ts                # Utility functions (cn, etc.)
└── types/
    └── index.ts                # TypeScript type definitions
```

## Architecture Patterns

### Authentication Flow
1. User logs in via `/login` or registers via `/register`
2. Backend returns JWT token stored in `localStorage` as `auth-token`
3. Axios interceptor in `src/lib/api.ts:11-22` automatically adds token to requests
4. On 401 responses, interceptor clears token and redirects to `/auth/login` (line 27-30)
5. User data stored in Jotai atom (`src/atom/user.ts`) with localStorage persistence

### API Communication
- **Backend API**: All backend calls go through the Axios instance in `src/lib/api.ts`
- **Endpoints**: Centralized in `src/app/_utils/endpoints.ts` - use these constants instead of hardcoded URLs
- **Data Fetching**: Use TanStack Query hooks for server state management
- **Base URL**: Configured via `NEXT_PUBLIC_API_URL` environment variable (defaults to `/api`)

### Route Organization
- Routes use Next.js App Router with route groups
- **Route groups** (wrapped in parentheses) don't affect URL structure:
  - `(private-pages)`: Protected routes requiring authentication
  - `(public-pages)`: Public routes accessible without login
- **Frontend routes**: Defined in `src/app/_utils/routes.ts` - import and use these constants
- **User-type routing**:
  - Users: `/user/*` routes
  - Brands: `/brand/*` routes

### Component Patterns
- UI components from shadcn/ui in `src/components/ui/`
- Custom components organized by feature domain
- Use `@/` alias for imports (configured in tsconfig.json path mapping)

## Database Schema

Key Supabase tables (see `supabase-schema.sql`):
- **users**: Base table for all users (users and brands)
- **campaigns**: Brand campaign information including budget, dates, and targeting
- **puzzles**: Individual puzzles linked to campaigns with questions and rewards
- **user_progress**: Tracks user progress through puzzles and campaigns
- **earnings**: User earnings from completed puzzles with payment status
- **puzzle_questions**: Individual questions/challenges within puzzles
- **campaign_analytics**: Performance metrics for brand campaigns

Row Level Security (RLS) is enabled on all tables - users can only access their own data unless explicitly allowed by policies.

## Puzzle System

The platform supports various puzzle types:
1. **Trivia**: Question-answer format with multiple choice
2. **Word Puzzles**: Word-based challenges and games
3. **Image Puzzles**: Visual recognition and matching challenges  
4. **Memory Games**: Pattern and sequence memory challenges
5. **Quiz**: General knowledge and branded content quizzes

Difficulty levels: Easy, Medium, Hard
Earning potential varies based on puzzle difficulty and brand campaign budgets.

## Environment Variables

Required environment variables (create `.env.local` from `.env.local.example` if it exists):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Important Conventions

### TypeScript Types
- All types defined in `src/types/index.ts`
- Import types using `@/types` alias
- Key interfaces: `UserData`, `Campaign`, `Puzzle`, `UserProgress`, `Earning`

### State Management
- **Global user state**: Use Jotai `userAtom` from `src/atom/user.ts`
- **Server state**: Use TanStack Query for all API data fetching
- **Local component state**: Use React `useState` for UI-only state

### API Error Handling
- Axios interceptor automatically handles 401 errors (redirects to login)
- Use try-catch blocks for other API errors
- Toast notifications via `sonner` library

### Build Configuration
- TypeScript and ESLint errors ignored during builds (see `next.config.ts:9-14`)
- Standalone output mode configured for Docker deployments
- Image optimization enabled for GitHub avatars

## Database Access
- Never query Supabase directly from frontend components
- All database operations should go through backend API endpoints
- Supabase client in `src/lib/supabase.ts` is for reference but backend handles DB queries

## Testing Locally
1. Install dependencies: `npm install`
2. Set up environment variables in `.env.local`
3. Run Supabase schema: Execute `supabase-schema.sql` in Supabase SQL editor
4. Start development server: `npm run dev`
5. Access at `http://localhost:3000`

## Deployment
- Primary deployment target: Vercel (see `vercel.json`)
- Docker support included (see `Dockerfile` and `docker-compose.yml`)
- Deployment scripts available in `scripts/deploy.sh`
- Full deployment guide in `DEPLOYMENT.md`
