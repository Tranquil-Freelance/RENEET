# PrepInsights — Supabase email templates

Branded HTML templates that match the PrepInsights landing page (Fraunces serif headings, Inter body, brand `#6A4DE8` on paper `#FAF7F2`).

Supabase does not auto-load these — its templates live on the dashboard, not in the repo. Paste them in once per project.

## Where to paste

Supabase dashboard → **Authentication → Emails → Email Templates** for the
[tranquil-tech project](https://supabase.com/dashboard/project/vnusxxzhcwtfbsfkuiro/auth/templates).

| Supabase template       | File in this folder            |
| ----------------------- | ------------------------------ |
| Magic Link              | `magic-link.html`              |
| Confirm signup          | `confirm-signup.html`          |

For each template:

1. Open the template tab on the dashboard.
2. Replace the entire HTML body with the contents of the file from this folder.
3. The **Subject** lines we use:
   - Magic Link → `Sign in to PrepInsights`
   - Confirm signup → `Confirm your email — PrepInsights`
4. Click **Save**.

## Supabase template variables we rely on

These are Go template tokens that Supabase substitutes server-side. Keep them
verbatim if you edit the HTML:

- `{{ .Email }}` — recipient address
- `{{ .ConfirmationURL }}` — the magic-link / confirm URL (includes the token)
- `{{ .SiteURL }}` — your configured site URL (we currently hard-code
  `https://tranquilai.in` in the footers; swap if you change domains)

## Editing

- Inline styles only. Most email clients strip `<style>` blocks and don't load web fonts.
- Use system serif fallback (`Georgia, 'Times New Roman', serif`) for headers — Fraunces won't load in Gmail/Outlook.
- Width capped at 560 px. Mobile clients render this cleanly.
- Buttons use a `box-shadow` that Gmail mobile respects; iOS Mail collapses it but the brand color carries the look.

## Test sends

After pasting, hit **Send test email** on each template (top-right on the
Supabase template page). The "From" should read `PrepInsights <noreply@tranquilai.in>`.
