# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 3008
npm run build        # prisma generate + next build
npm run lint         # ESLint via next lint
npm run db:migrate   # Run Prisma migrations (requires DATABASE_URL)
npm run db:studio    # Open Prisma Studio GUI
npm run prisma:generate  # Regenerate Prisma client after schema changes
```

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` — PostgreSQL connection string (Neon or local)
- `JWT_SECRET` — min 32 characters, used to sign/verify JWTs
- `OPENROUTER_API_KEY` — API key for OpenRouter (AI features)
- `NEXT_PUBLIC_API_URL` — leave empty to use internal `/api` routes

## Architecture

**Full-stack Next.js App Router** — backend and frontend live in the same repo.

### Backend (Route Handlers)
- `app/api/` — all REST endpoints as Next.js Route Handlers
- `lib/auth.ts` — JWT sign/verify, `requireAuth()` helper throws 401 `Response` on failure
- `lib/rbac.ts` — workspace role checks (`owner > admin > member`), superusers bypass workspace checks
- `lib/prisma.ts` — singleton Prisma client
- `lib/openrouter.ts` — wrapper for OpenRouter API calls (default model: `google/gemini-2.5-flash`); set `requireJson: true` for JSON-mode responses
- `lib/prompts.ts` — prompt templates for AI features

### Authentication Flow
- Register/Login → JWT stored in `sessionStorage` + cookie (for middleware)
- `AuthProvider` (`components/providers/AuthProvider`) holds auth state via React context
- API routes call `requireAuth(request)` which reads the `Authorization: Bearer <token>` header

### Data Model (Prisma + PostgreSQL)
- `User` → owns `Workspace[]`, belongs to `WorkspaceMember[]`
- `Workspace` → has `WorkspaceMember[]` (roles: owner/admin/member) and `Project[]`
- `Project` → has `Task[]` (statuses: BACKLOG / IN_PROGRESS / REVIEW / DONE)
- `Task` → has `TimeEntry[]`
- `AiRequest` — logs all AI prompts/responses per user

### Frontend
- `app/dashboard/` — all authenticated pages (projects, tasks, ideas, schedule, tracker, analytics, chat, admin)
- `components/features/` — feature-specific UI components
- `components/layout/` — `DashboardSidebar` and shared layout pieces
- `components/providers/` — `AuthProvider`, `QueryProvider` (TanStack Query), `ThemeProvider`
- `components/ui/` — shadcn/ui primitives
- `hooks/` — custom React hooks (e.g., `useGenerateScheduleStream.ts` for SSE streaming)

### AI Features
All AI endpoints live under `app/api/ai/`:
- `generate-content` — content ideas from niche/platform/goal/audience
- `generate-schedule` / `generate-schedule-stream` — weekly content calendar (streaming via SSE)
- `predict-task` — duration prediction with confidence %
- `chat` — free-form AI chat for content strategy

`lib/openrouter.ts` wraps all OpenRouter calls. Pass `requireJson: false` only for streaming/chat endpoints.

### RBAC Pattern
API routes that need workspace-level authorization call `requireWorkspaceRole(userId, workspaceId, minRole)` from `lib/rbac.ts`. Superusers (`isSuperuser: true`) bypass all workspace role checks.
