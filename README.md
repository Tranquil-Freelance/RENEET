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
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally, your production URL on Vercel

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

### 7. Deploy
```bash
npx vercel --prod
```

Add the same env vars to Vercel via the dashboard. `vercel.json` already extends function timeouts to 60s for AI routes.

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
