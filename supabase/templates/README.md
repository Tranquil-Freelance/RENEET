# PrepInsights — Supabase email templates

Branded HTML templates that match the PrepInsights landing page (serif headings, Inter body, brand `#6A4DE8` on paper `#FAF7F2`). Copy avoids wording that Supabase’s **built-in SMTP** scanner often rejects (`unlock`, `free`, currency symbols, etc.). Use neutral phrases like **“sign-in code”** instead of blocked terms.

## Sign-in is **email OTP only** (no magic links)

The app uses **`signInWithOtp`** and **`verifyOtp`** in the browser. It does **not** set `emailRedirectTo`, so users should **never** rely on tapping a link in email to sign in — only the numeric code from **`{{ .Token }}`**.

In the Supabase dashboard, the template slot is still labeled **“Magic Link”**; paste **`magic-link.html`** there anyway so the email shows the **code**, not `{{ .ConfirmationURL }}` as the main CTA.

For **Confirm signup** (if your project still sends that template when “Confirm email” is on), paste **`confirm-signup.html`**. That file intentionally **does not** include a confirmation link — only the code — so it matches OTP-only sign-in.

**Recommended (simplest for new users):** Authentication → Providers → **Email** → turn **off** “Confirm email” if you want a single OTP email and no separate confirmation step. If you leave it on, keep both templates code-first as above.

## Where to paste

Supabase dashboard → **Authentication → Emails → Email Templates** for your project.

| Supabase template (dashboard label) | File in this folder           | Suggested subject              |
| ----------------------------------- | ----------------------------- | ------------------------------ |
| Magic Link                          | `magic-link.html`             | `Your PrepInsights sign-in code` |
| Confirm signup                      | `confirm-signup.html`         | `Confirm your email — PrepInsights` |

For each one:

1. Open the template tab on the dashboard.
2. Replace the entire HTML body with the contents of the file from this folder.
3. Set the **Subject** as above (or close).
4. Click **Save**.

## Site URL (production)

Templates use `{{ .SiteURL }}` in the footer. Set **Authentication → URL Configuration**:

- **Site URL:** `https://prepinsight.in` (no trailing slash)
- **Redirect URLs:** include at least `https://prepinsight.in/**` for OAuth or any legacy callback URLs.

On **Render**, set **`NEXT_PUBLIC_APP_URL=https://prepinsight.in`** so server-side URLs match production.

If Site URL is still `http://localhost:3000`, production emails will show localhost in the footer.

For **local Next.js** development, you can temporarily use `http://localhost:3000` and `http://localhost:3000/**`, or use a separate Supabase project for dev.

## Template variables

Go template tokens — keep them verbatim unless you know what you are changing:

| Variable               | Used in              | Meaning                                      |
| ---------------------- | -------------------- | -------------------------------------------- |
| `{{ .Email }}`         | Both                 | Recipient address                          |
| `{{ .Token }}`         | **`magic-link.html`**, **`confirm-signup.html`** | **Numeric code** (6–8 digits; required for OTP in the app) |
| `{{ .SiteURL }}`       | Both                 | Site URL from dashboard                    |

Do **not** use `{{ .ConfirmationURL }}` as the primary sign-in path in these templates if you want OTP-only behaviour.

## Editing tips

- Inline styles only — most email clients strip `<style>` blocks and refuse web fonts.
- Use system serif fallback (`Georgia, 'Times New Roman', serif`) for headers.
- Width capped at 560 px for mobile clients.

## Test send

After pasting, use **Send test email** on the template page. Check that the message shows the **numeric code** from `{{ .Token }}`, not a “click to sign in” link as the only option.
