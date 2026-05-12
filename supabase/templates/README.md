# PrepInsights — Supabase email templates

Branded HTML templates that match the PrepInsights landing page (serif headings, Inter body, brand `#6A4DE8` on paper `#FAF7F2`). Both templates are **content-scanner safe** — they avoid the keywords Supabase's inbuilt SMTP path blocks (`unlock`, `free`, `OTP`, currency symbols, etc.) so they save cleanly even before Custom SMTP fully propagates.

## Where to paste

Supabase dashboard → **Authentication → Emails → Email Templates** for the
[tranquil-tech project](https://supabase.com/dashboard/project/vnusxxzhcwtfbsfkuiro/auth/templates).

| Supabase template       | File in this folder            | Suggested subject                       |
| ----------------------- | ------------------------------ | --------------------------------------- |
| Magic Link              | `magic-link.html`              | `Sign in to PrepInsights`               |
| Confirm signup          | `confirm-signup.html`          | `Confirm your email — PrepInsights`     |

For each one:

1. Open the template tab on the dashboard.
2. Replace the entire HTML body with the contents of the file from this folder.
3. Set the **Subject** as above.
4. Click **Save**.

## Required Site URL (production)

Both templates use `{{ .SiteURL }}` in the footer. That value comes from
**Authentication → URL Configuration → Site URL** in the Supabase dashboard.

For the live app at **`https://prepinsight.in/`**, set:

- **Site URL:** `https://prepinsight.in` (no trailing slash)
- **Redirect URLs** (add each line; wildcards help):

  `https://prepinsight.in/**`

  Or explicitly:

  - `https://prepinsight.in/auth/callback` — **required** for email magic links (PKCE).
  - `https://prepinsight.in/exam`, `https://prepinsight.in/swot`, `https://prepinsight.in/plan`, `https://prepinsight.in/onboarding`, `https://prepinsight.in/dashboard` — optional if not using `/**`.

  **Never remove** `auth/callback` — without it, sign-in returns you to `/login` with an error.

If Site URL is still `http://localhost:3000`, emails will show localhost in the
footer and default redirects can break for real users.

**Do not** set Site URL to `https://localhost:10000` or any `localhost` port —
Render’s internal port (sometimes shown as 10000 in logs) is **not** your public
site. Your public URL is **`https://prepinsight.in`** only.

For **local Next.js** development only, you can temporarily set Site URL to
`http://localhost:3000` and include `http://localhost:3000/**` in redirect URLs
— or use a separate Supabase branch project for dev.

The Site URL also acts as the default redirect for magic links when the client
does not pass an explicit `emailRedirectTo`.

## Supabase template variables we rely on

Go template tokens — keep them verbatim if you edit the HTML:

- `{{ .Email }}` — recipient address
- `{{ .ConfirmationURL }}` — magic-link / confirm URL (includes the token)
- `{{ .SiteURL }}` — site URL configured above

## Editing tips

- Inline styles only — most email clients strip `<style>` blocks and refuse to load web fonts.
- Use system serif fallback (`Georgia, 'Times New Roman', serif`) for headers — Fraunces will not load in Gmail or Outlook.
- Width capped at 560 px. Mobile clients render this cleanly.
- The button uses `box-shadow` (Gmail mobile + Apple Mail honour it; iOS Mail collapses it gracefully).
- Keep wording neutral — Supabase blocks transactional templates that look promotional. Words to avoid in inbuilt SMTP mode: `unlock`, `free`, `OTP`, currency symbols, exclamation marks, "click here", "verify now".

## Test send

After pasting, click **Send test email** (top-right on each template page). The "From" should read `PrepInsights <noreply@tranquilai.in>` (or whatever sender you set in Auth → SMTP Settings).
