# Deploying backpocket-web (Next.js on Vercel)

> **App Path:** `apps/backpocket-web/`  
> **Stack:** Next.js 16, React 19, tRPC, Supabase, Clerk

This guide covers deploying the Backpocket web app to Vercel in a Turborepo monorepo.

---

## Prerequisites

1. **Vercel Account** — [vercel.com](https://vercel.com)
2. **Supabase Project** — Database and storage configured
3. **Clerk Application** — Auth provider with Next.js integration
4. **Upstash Account** — For Redis caching and QStash background jobs

---

## 1. Connect Repository to Vercel

### Initial Setup

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub/GitLab/Bitbucket repository
3. Vercel auto-detects the monorepo structure

### Configure Root Directory

Since this is a monorepo, set the **Root Directory** to:

```
apps/backpocket-web
```

### Framework Preset

Vercel should auto-detect **Next.js**. If not, select it manually.

---

## 2. Environment Variables

Add the following environment variables in Vercel Dashboard → Project Settings → Environment Variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_live_...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | `AX...` |
| `QSTASH_TOKEN` | QStash token for background jobs | `ey...` |
| `QSTASH_CURRENT_SIGNING_KEY` | QStash signing key | `sig_...` |
| `QSTASH_NEXT_SIGNING_KEY` | QStash next signing key | `sig_...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Production URL | Auto-detected |

### Environment Scoping

- **Production**: Use production API keys
- **Preview**: Use staging/test keys (recommended)
- **Development**: Local `.env.local` file

---

## 3. Build Configuration

### vercel.json

The project includes a minimal `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "bunVersion": "1.x",
  "ignoreCommand": "npx turbo-ignore"
}
```

This configures:
- **Bun** as the package manager
- **turbo-ignore** to skip builds when no relevant files changed

### Build Command

Vercel auto-detects from `package.json`:

```bash
bun run build  # Runs: next build
```

### Output Directory

Default: `.next` (auto-detected by Next.js preset)

---

## 4. Monorepo Optimization

### Turbo Ignore

The `ignoreCommand: "npx turbo-ignore"` setting tells Vercel to skip builds when:
- No files in `apps/backpocket-web/` changed
- No files in dependent `packages/` changed

This saves build minutes on commits that only affect mobile or extension.

### Remote Caching (Optional)

Enable Vercel Remote Cache for faster builds:

1. Go to Project Settings → General
2. Enable **Remote Caching**
3. Turbo will cache build artifacts across deploys

---

## 5. Domain Configuration

### Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `backpocket.my`)
3. Configure DNS as instructed

### Wildcard Subdomain (Public Spaces)

For public spaces at `{slug}.backpocket.my`:

1. Add `*.backpocket.my` as a wildcard domain
2. The app handles routing via middleware

---

## 6. Database Migrations

### Before First Deploy

Ensure Supabase migrations are applied:

```bash
cd apps/backpocket-web
bunx supabase db push
```

### Generate Types

Keep TypeScript types in sync:

```bash
bunx supabase gen types typescript --project-id <project-id> > lib/types/database.ts
```

---

## 7. Deployment Workflow

### Automatic Deploys

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests get preview URLs

### Manual Deploy

```bash
# From project root
bunx vercel

# Or deploy to production
bunx vercel --prod
```

### CLI Setup

First-time setup:

```bash
bunx vercel login
bunx vercel link
```

---

## 8. Monitoring

### Built-in Analytics

The app includes Vercel Analytics and Speed Insights:

```typescript
// Already configured in layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
```

### Logs

View real-time logs in Vercel Dashboard → Deployments → Functions.

---

## 9. Troubleshooting

### Build Fails

1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set
3. Run `bun run build` locally to reproduce

### Environment Variable Issues

- Ensure `NEXT_PUBLIC_*` vars are set for client-side access
- Server-only vars (without prefix) are only available in API routes

### Monorepo Issues

If builds run when they shouldn't:
- Check `turbo.json` pipeline configuration
- Verify `ignoreCommand` is set correctly

---

## Quick Reference

```bash
# Local development
cd apps/backpocket-web
bun dev

# Build locally
bun run build

# Deploy preview
bunx vercel

# Deploy production
bunx vercel --prod

# View logs
bunx vercel logs
```
