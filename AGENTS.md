# AGENTS.md

## Project

Lifecycle demo app showing per-PR preview environments with production deploy. Demonstrates: PR opened -> detect backend changes -> run Alembic migrations -> deploy Vercel preview; merge to main -> deploy production. UI shows environment badge + schema version to visually differentiate preview vs production.

**Repo**: https://github.com/ferenc-meteorops/lifecycle-demo
**Production**: https://lifecycle-demo.vercel.app

## Architecture

```
lifecycle-demo/
├── src/                    # Next.js 14 frontend (App Router)
│   ├── app/
│   │   ├── page.tsx        # Main page: env badge, schema version, items list
│   │   └── layout.tsx
│   └── lib/
│       └── supabase.ts     # Supabase client (cache: "no-store" required)
├── backend/                # Python/Alembic (no runtime server — migrations only)
│   ├── alembic/
│   │   ├── env.py          # sys.path fix to resolve app.config
│   │   └── versions/       # Migration files (0001, 0002, ...)
│   ├── app/
│   │   ├── config.py       # SQLAlchemy engine + Base from DATABASE_URL
│   │   └── models.py       # Item model (must match latest migration)
│   └── requirements.txt    # alembic, sqlalchemy, psycopg2-binary
├── .github/workflows/
│   ├── preview.yml         # PR preview: detect changes -> alembic -> vercel deploy
│   ├── preview-cleanup.yml # PR close: query meta-pr=N -> vercel rm
│   └── production.yml      # Push to main: alembic -> vercel deploy --prod
└── package.json            # next, react, @supabase/supabase-js
```

## Stack

- **Frontend**: Next.js 14, React 18, TypeScript, App Router
- **Database**: Supabase (PostgreSQL), accessed via `@supabase/supabase-js`
- **Migrations**: Alembic + SQLAlchemy (Python 3.12). No backend runtime — Alembic runs in CI only.
- **Hosting**: Vercel (CLI deploys, not GitHub integration)
- **CI/CD**: GitHub Actions

## Workflows

### preview.yml (PR opened/synchronize/reopened)

Two mutually exclusive paths based on `dorny/paths-filter`:

1. **Backend changes** (`backend/**` modified): Python setup -> `alembic upgrade head` -> Node setup -> `vercel build` -> `vercel deploy --prebuilt --meta pr=N` -> PR comment with preview URL
2. **Frontend-only** (no backend changes): Node setup -> `vercel build` -> `vercel deploy --prebuilt --meta pr=N` -> PR comment (no Alembic)

Build-time env vars baked into the frontend:
- `NEXT_PUBLIC_DEPLOY_ENV=preview-pr-N`
- `NEXT_PUBLIC_SCHEMA_VERSION=<alembic current>` (or `n/a (frontend-only)`)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from repo variables

### preview-cleanup.yml (PR closed)

Queries Vercel API `GET /v6/deployments?meta-pr=N` to find deployments tagged for this PR, then removes them with `vercel rm <url> --yes`. Updates the PR comment with cleanup confirmation.

### production.yml (push to main)

Runs `alembic upgrade head` then `vercel build --prod` + `vercel deploy --prebuilt --prod`. Build-time env: `NEXT_PUBLIC_DEPLOY_ENV=production`.

## Key Design Decisions

### Vercel CLI over GitHub integration

`NEXT_PUBLIC_*` vars are build-time. GitHub integration builds before the workflow can inject dynamic values (like Supabase branch URL or schema version). Vercel CLI with `--prebuilt` gives full control over build-time env vars.

### Shared DB (free tier)

Supabase free plan has no branching. All environments (preview + production) share one database. Branching code is commented out with upgrade instructions.

**Consequence**: Preview migrations can conflict with production. Both workflows handle this with a fallback:
```bash
if ! alembic upgrade head 2>&1; then
  alembic stamp --purge head
fi
```
This purges the version table and stamps to the branch's head when the DB has a version from a different branch.

### PR-scoped cleanup via deploy metadata

Each deploy is tagged with `--meta pr=N`. Cleanup queries `meta-pr=N` to find only that PR's deployments. This supports parallel PRs without cross-contamination.

### Supabase client cache: "no-store"

Next.js patches global `fetch` with aggressive caching. Supabase JS uses `fetch` internally. Without `cache: "no-store"`, API responses return stale data across deploys.

## Adding a New Migration

1. Create `backend/alembic/versions/NNNN_description.py` with `revision`, `down_revision`, `upgrade()`, `downgrade()`
2. Update `backend/app/models.py` to match the new schema
3. Commit both files — the `backend/**` path filter triggers the full preview path

Follow existing migration pattern (see `0001_create_items.py`, `0002_add_description_column.py`).

## Environment Variables

### GitHub Secrets
- `VERCEL_TOKEN` — Vercel API token
- `VERCEL_ORG_ID` — Vercel team ID
- `VERCEL_PROJECT_ID` — Vercel project ID
- `DATABASE_URL` — Supabase PostgreSQL connection string (password `!` must be URL-encoded as `%21`)

### GitHub Repository Variables
- `DEV_SUPABASE_URL` — Supabase project URL
- `DEV_SUPABASE_ANON_KEY` — Supabase anon key

### Build-time (injected by workflows, not stored)
- `NEXT_PUBLIC_DEPLOY_ENV` — `production` or `preview-pr-N`
- `NEXT_PUBLIC_SCHEMA_VERSION` — Alembic revision hash
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Gotchas

- **DATABASE_URL encoding**: Supabase passwords with `!` must use `%21` or Alembic/SQLAlchemy will fail to parse the URL.
- **`alembic/env.py` sys.path**: The env.py adds `backend/` to `sys.path` so `from app.config import ...` resolves correctly when Alembic runs from `backend/` working directory.
- **Supabase cold starts**: Free tier can cold-start/timeout causing transient CI failures. Retry or re-run the workflow.
- **Vercel deployment protection**: Must be disabled in Vercel project settings for preview URLs to be publicly accessible.
- **No `--safe` on `vercel rm`**: The `--safe` flag prevents deletion of aliased deployments. Vercel auto-aliases previews, so `--safe` silently fails. Omit it — the `meta-pr=N` filter already scopes deletion to the correct PR.
