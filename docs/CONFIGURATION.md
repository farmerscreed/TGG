# Configuration & Deployment

How to configure the app's environment, Supabase Auth, and Vercel deployment.

---

## 1. Environment variables

See [`.env.example`](../.env.example) for the template. Set the same values
locally (`.env`) and in Vercel (**Settings → Environment Variables**).

| Variable | Where it's read | Required | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server Supabase clients | **Yes** | Project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server Supabase clients | **Yes** | Public anon key (safe in the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/server.ts` `createAdminClient` (admin API routes) | **Yes** | **Secret** — bypasses RLS |
| `NEXT_PUBLIC_SITE_URL` | `(auth)/register` signup redirect | Recommended | Falls back to `window.location.origin` |
| `NEXT_PUBLIC_APP_URL` | email link base (`lib/email`) | Recommended | Falls back to `https://tgg-eco.vercel.app` |
| `RESEND_API_KEY` | `lib/email/index.ts` | **Yes** | **Secret**; needed at **build** time (see below) |
| `RESEND_FROM_EMAIL` | email "from" address | Optional | Falls back to `noreply@tgg-eco.org` |

### Build-time inlining (important)

Next.js inlines every `NEXT_PUBLIC_*` value into the client bundle **at build
time**. If you add or change one in Vercel, you must **redeploy** (with build
cache off) for it to take effect — saving the variable alone does nothing. A
"Needs Attention" flag in Vercel usually just means "not yet applied to a
deployment — redeploy."

### Resend at build time

`lib/email/index.ts` constructs `new Resend(process.env.RESEND_API_KEY)` at
module load, so a **missing key fails the entire `next build`**, not just email.
Keep `RESEND_API_KEY` set in every environment (any non-empty value works for a
local build). *(Open item: lazy-initialise the client so the build no longer
depends on it — see the audit doc.)*

---

## 2. Supabase Auth — URL configuration

**Dashboard → Authentication → URL Configuration.**

- **Site URL:** `https://www.tggcampuschallenge.com`
  The confirmation-email link redirects here after verifying. If this is left at
  `http://localhost:3000`, every confirmation bounces to localhost.
- **Redirect URLs (allowlist):**
  ```
  https://www.tggcampuschallenge.com/**
  https://tggcampuschallenge.com/**
  http://localhost:3000/**
  ```
  The app requests `…/auth/callback`; it's only honoured if it matches this list,
  otherwise Auth falls back to the Site URL.

No redeploy is needed for these — they take effect immediately.

---

## 3. Deploying on Vercel

1. Set all environment variables (table above) for **Production** (and Preview).
2. Push to the default branch, or **Deployments → ⋯ → Redeploy**
   (uncheck "use existing build cache" when env vars changed).
3. Confirm the build succeeds and the new values are live.

---

## 4. Secret rotation

Rotate these if they've ever been shared/exposed:

- **Supabase `service_role` key** — Dashboard → **Project Settings → API →
  Service Role → Roll**. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel + `.env`,
  then redeploy.
- **Resend API key** — Resend dashboard → revoke + create new. Update
  `RESEND_API_KEY` in Vercel + `.env`, then redeploy.

The `anon` key and project URL are public by design and do not need rotation.

> `.env` is currently tracked in git. It contains only public-safe values
> (project URL + anon keys), but consider `git rm --cached .env` and keeping it
> ignored so host config is the single source of truth.
