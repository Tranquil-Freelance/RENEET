# PrepInsights

AI-powered Re-NEET 2026 gap analysis. Built for 22.79 lakh aspirants with a second chance.

## What this does

1. Student fills a 3-step onboarding (`/onboarding`)
2. Student picks ABCD for each of 180 questions on an OMR sheet (`/exam`), with an optional "I guessed this" toggle per question
3. The backend derives Correct / Wrong / Blank / Guessed-Right objectively from the answer key
4. Claude generates a personalized SWOT (`/swot`) — the **free** value drop
5. Student pays ₹149 via Razorpay → Claude generates a 30-day study plan (`/plan`)
6. Daily check-ins with AI-generated 5-question quizzes (`/dashboard`)

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (Postgres + service role for server writes)
- Anthropic Claude (Sonnet 4.5 by default)
- Razorpay (UPI + cards)
- Resend (transactional email — placeholder)
- Vercel hosting

## Setup (< 30 minutes from clone to deploy)

### 1. Install
```bash
npm install
```

### 2. Environment
Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` — from Supabase Dashboard → Project Settings → API
- `OPENROUTER_API_KEY` — from [openrouter.ai/keys](https://openrouter.ai/keys)
- `OPENROUTER_MODEL` — defaults to `openai/gpt-4o-mini` (JSON-mode capable; swap for any OpenRouter model)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` — from Razorpay Dashboard → Settings → API Keys (use test keys first)
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally; production app: **`https://app.prepinsight.in`** (Vercel). Use that same URL in Vercel env and Supabase auth when **www** / apex point at GitHub Pages (see [GitHub Pages and DNS](#github-pages-and-dns-for-prepinsightin)).

The app boots and routes work even with empty env vars — API calls degrade gracefully with stub data and warnings. Useful for UI iteration without keys.

### 3. Supabase migrations
In the Supabase SQL editor, run [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).

This creates 5 tables (`users`, `responses`, `analyses`, `plans`, `checkins`) with RLS enabled. The anon role has zero access — all writes go through the service role from API routes.

### 4. Question images
Drop cropped question images into `public/questions/q1.jpg` through `q180.jpg`. The exam page falls back to a placeholder showing the expected path if an image is missing.

### 5. Answer key
The seeded `correct_option` values are placeholders (rotating A/B/C/D). After NTA releases the official key, create an `answer-key.csv` with columns `q_no,correct_option`:

```csv
q_no,correct_option
1,B
2,D
3,A
...
```

Run:
```bash
npx tsx scripts/load-answer-key.ts answer-key.csv
```

This writes `lib/answer-key.json` which is read by `lib/questions.ts` at boot. No source-code change needed.

### 6. Run locally
```bash
npm run dev
```

### 7. Deploy (Vercel only)

This app is standard **Next.js** and is meant to run on **Vercel**. There is no Render-specific config in this repo.

**If you were on Render:** in the [Render Dashboard](https://dashboard.render.com/), delete the web service (and any related workers/cron) so you are not paying for or routing traffic to an old host. Copy any secrets from Render’s environment tab into Vercel before you tear the service down.

**On Vercel**

1. **Import the repo** (Vercel dashboard → Add New → Project) or from the CLI: `npx vercel link` then `npx vercel --prod`.
2. **Environment variables** — Project → Settings → Environment Variables: mirror everything in [`.env.example`](./.env.example) for Production (and Preview if you use previews). Use the same values you had on Render where they overlap.
3. **`NEXT_PUBLIC_APP_URL`** — use **`https://app.prepinsight.in`** for the live Next.js app when **www** / apex are served by GitHub Pages (see DNS section below). That value drives OpenRouter referrers, metadata, and redirects.
4. **Supabase** — Authentication → URL configuration: set **Site URL** and **Redirect URLs** to **`https://app.prepinsight.in`** (and `http://localhost:3000` for local dev). Remove stale hosts.

```bash
npx vercel --prod
```

`vercel.json` already sets longer function durations for the AI-heavy API routes (`/api/analyze`, `/api/plan`, `/api/checkin`).

### GitHub Pages and DNS for prepinsight.in

**Hosting split:** **`www.prepinsight.in`** and apex **`prepinsight.in`** can point at **GitHub Pages** (static `index.html` in this repo). The **Next.js app** must use another hostname, e.g. **`app.prepinsight.in`** on **Vercel**, with `NEXT_PUBLIC_APP_URL` / Supabase set to `https://app.prepinsight.in`.

#### GoDaddy → GitHub Pages

In [GoDaddy DNS](https://dcc.godaddy.com/manage/) for `prepinsight.in`:

| Type  | Name (Host) | Points to                 | TTL     |
|-------|-------------|---------------------------|---------|
| CNAME | `www`       | `tranquil-freelance.github.io` | Default |
| A     | `@`         | `185.199.108.153`         | Default |
| A     | `@`         | `185.199.109.153`         | Default |
| A     | `@`         | `185.199.110.153`         | Default |
| A     | `@`         | `185.199.111.153`         | Default |

Use **four separate A records** for `@` (one IP each). These match [GitHub Pages apex IPs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain).

#### Repo files for Pages

- **`CNAME`** — contains `www.prepinsight.in` so GitHub Pages accepts the custom domain (keep in sync with **Repository → Settings → Pages → Custom domain**).
- **`.nojekyll`**, **`index.html`** — static site at `/` for the Pages deployment.

After DNS propagates: **Settings → Pages** — add custom domain **`www.prepinsight.in`** (and **`prepinsight.in`** if you use apex), wait for the DNS check, then enable **Enforce HTTPS**.

#### GoDaddy → Vercel (web app)

In Vercel: **Project → Settings → Domains** → add **`app.prepinsight.in`**. Then in GoDaddy create the record Vercel shows (commonly **CNAME** host **`app`** → target **`cname.vercel-dns.com`** or the exact value from the Vercel UI).

The static **`index.html`** “Open web app” button points to **`https://app.prepinsight.in`**.

The interactive product still needs **Vercel** per [§7](#7-deploy-vercel-only).

## Routes

| Path | Purpose |
|---|---|
| `/` | Landing page (hero, comparison, sample SWOT, FAQ) |
| `/onboarding` | 3-step user signup |
| `/exam` | 180-question OMR sheet with ABCD + guessed toggle |
| `/swot` | Free SWOT analysis results + Razorpay CTA |
| `/plan` | Paid 30-day plan (week tabs, day cards, PDF export) |
| `/dashboard` | Daily focus + 5-question check-in quiz + streak heatmap |

| API | Purpose |
|---|---|
| `POST /api/users` | Create/update user |
| `POST /api/analyze` | Save answers → derive statuses → Claude SWOT |
| `POST /api/payment` | Create Razorpay order |
| `POST /api/payment/verify` | Verify signature, mark `paid` |
| `POST /api/plan` | Claude 30-day plan from SWOT |
| `GET  /api/plan/get` | Fetch saved plan |
| `POST /api/checkin` | Fetch/submit daily quiz, toggle day-done |
| `GET  /api/motivation` | Daily Claude-generated quote |

## Key architectural decisions

- **Objective scoring**: The student input is `{ chosen: 'A'|'B'|'C'|'D'|null, guessed: boolean }`. The backend derives status using the answer key — students can't fudge their own SWOT.
- **Answer key never leaves the server**: `getClientQuestions()` strips `correct_option` before shipping to the browser.
- **Phone-based soft identity Day 1**: `userId` lives in localStorage; the service role key bypasses RLS. Replace with Supabase Auth + OTP for v1.1.
- **Graceful degradation**: Every API route works without Supabase/Claude/Razorpay configured (returns stubs with `warning` fields). Lets you iterate UI before keys arrive.

## Day 2 roadmap
- Swap localStorage `userId` for Supabase Auth OTP
- WhatsApp reminders via Twilio/WATI
- AI Tutor chat (5 free queries/day)
- Cohort comparison ("top 22% of PrepInsights users")
- Referral codes
- B2B white-label for coaching institutes

## License
Proprietary — built for Re-NEET 2026.
