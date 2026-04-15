# Repository Guidelines

## Project Overview

Meldin is a web-based translation file manager. Upload JSON locale files (`en.json`, `fr.json`, `de.json`), compare translations against a source language in a table, fill missing keys manually or via AI, and download updated files.

## Project Structure & Module Organization

- `app/` — Next.js 15 App Router. `page.tsx` is the main upload/comparison UI; `login/page.tsx` handles authentication.
- `app/api/` — Three API routes: `auth/` (NextAuth handler), `translate/` (single-key AI translation), `translate-batch/` (batch AI translation). AI provider is OpenAI via `@ai-sdk/openai`; to swap providers, edit both route files.
- `components/` — Business components: `translation-table.tsx` (core comparison UI), `file-upload.tsx`, `ai-translation-dialog.tsx`.
- `components/ui/` — shadcn/ui components. Regenerate with `npx shadcn@latest add <component>`; do not edit manually.
- `hooks/` — Custom React hooks: `use-auto-translate.ts`, `use-toast.ts`.
- `lib/` — `ai-translation.ts` (AI call logic), `auth.ts` (NextAuth config), `utils.ts` (`cn()` helper).
- `middleware.ts` — Redirects unauthenticated requests to `/login`.

## Build & Development Commands

```
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run lint     # ESLint (next/core-web-vitals)
```

Setup: copy `.env.example` to `.env.local`, then `npm install && npm run dev`. Requires an OpenAI API key for AI translation features.

## Coding Style & Naming Conventions

- TypeScript strict mode (`strict: true` in `tsconfig.json`).
- ESLint: `next/core-web-vitals` — no additional rules.
- Tailwind CSS for all styling; use `cn()` from `lib/utils.ts` for conditional class merging.
- Dark theme with neon accents — keep new UI consistent with the existing palette.
- Component files: kebab-case filenames, PascalCase exports.

## Commit Guidelines

Conventional Commits style from git history:

- `feat:` — new features
- `fix:` — bug fixes
- `chore:` — dependency updates, config changes
- `style:` — visual/CSS-only changes
- `docs:` — documentation only
