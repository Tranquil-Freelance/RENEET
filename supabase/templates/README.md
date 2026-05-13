# PrepInsights — Supabase email templates

Branded HTML templates that match the PrepInsights landing page (serif headings, Inter body, brand `#6A4DE8` on paper `#FAF7F2`). Copy avoids wording that Supabase’s **built-in SMTP** scanner often rejects (`unlock`, `free`, currency symbols, etc.). Use neutral phrases like **“sign-in code”** instead of blocked terms.

## Sign-in is email **code** (not magic links)

The app uses **`signInWithOtp` + `verifyOtp`** in the browser. Supabase still labels the dashboard slot **“Magic Link”**, but the email body **must** show the **`{{ .Token }}`** placeholder so users receive a **numeric sign-in code** (often **6** or **8** digits, depending on your project). If your template still uses **`{{ .ConfirmationURL }}`**, Supabase will keep sending **tap-to-sign-in links** — that matches what you saw after switching the UI to OTP.

**Fix:** paste `magic-link.html` into **Authentication → Emails → Magic Link** and paste **`confirm-signup.html`** into **Authentication → Emails → Confirm signup**. If **Confirm signup** still uses only **`{{ .ConfirmationURL }}`**, new accounts get a **tap-to-confirm** email instead of a numeric code — that is separate from the Magic Link template.

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

## Required Site URL (production)

Templates use `{{ .SiteURL }}` in the footer. Set **Authentication → URL Configuration**:

For **`https://prepinsight.in`**:

- **Site URL:** `https://prepinsight.in` (no trailing slash)
- **Redirect URLs:** include at least  
  `https://prepinsight.in/**`  
  so browser auth and any legacy callback URLs keep working.

If Site URL is still `http://localhost:3000`, production emails will show localhost in the footer.

For **local Next.js** development, you can temporarily use `http://localhost:3000` and `http://localhost:3000/**`, or use a separate Supabase project for dev.

## Template variables

Go template tokens — keep them verbatim unless you know what you are changing:

| Variable               | Used in              | Meaning                                      |
| ---------------------- | -------------------- | -------------------------------------------- |
| `{{ .Email }}`         | Both                 | Recipient address                          |
| `{{ .Token }}`         | **`magic-link.html`**, **`confirm-signup.html`** | **Numeric code** (6–8 digits; required for OTP in the app) |
| `{{ .ConfirmationURL }}` | Optional fallback in confirm-signup | One-tap verify URL (keep below the code, not as the only CTA) |
| `{{ .SiteURL }}`       | Both                 | Site URL from dashboard                    |

Do **not** leave `{{ .ConfirmationURL }}` as the **only** CTA in **Magic Link** or **Confirm signup** if you want users to sign in with the numeric code in the app.

## Editing tips

- Inline styles only — most email clients strip `<style>` blocks and refuse web fonts.
- Use system serif fallback (`Georgia, 'Times New Roman', serif`) for headers.
- Width capped at 560 px for mobile clients.

## Test send

After pasting, use **Send test email** on the template page. Check that the message shows the **numeric code** from `{{ .Token }}`, not only a button/link.
