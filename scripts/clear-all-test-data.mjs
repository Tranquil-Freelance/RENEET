/**
 * Wipes app user rows (cascades to responses, analyses, plans, checkins, payments)
 * and deletes all Supabase Auth users. Requires SUPABASE_SERVICE_KEY + NEXT_PUBLIC_SUPABASE_URL.
 *
 * Usage: node scripts/clear-all-test-data.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const p = resolve(process.cwd(), ".env.local");
    const raw = readFileSync(p, "utf8");
    for (const line of raw.split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const eq = s.indexOf("=");
      if (eq === -1) continue;
      const k = s.slice(0, eq).trim();
      let v = s.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* no .env.local */
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (from env or .env.local).");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ZERO = "00000000-0000-0000-0000-000000000000";

async function main() {
  const { error: delUsersErr, count } = await supabase
    .from("users")
    .delete({ count: "exact" })
    .neq("id", ZERO);

  if (delUsersErr) {
    console.error("Failed to delete public.users:", delUsersErr.message);
    process.exit(1);
  }
  console.log("Deleted public.users (cascaded children). Rows affected:", count ?? "?");

  let page = 1;
  let deletedAuth = 0;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) {
      console.error("listUsers:", error.message);
      process.exit(1);
    }
    const users = data?.users ?? [];
    if (users.length === 0) break;
    for (const u of users) {
      const { error: du } = await supabase.auth.admin.deleteUser(u.id);
      if (du) {
        console.error("deleteUser", u.id, du.message);
        process.exit(1);
      }
      deletedAuth += 1;
    }
    if (users.length < 1000) break;
    page += 1;
  }

  console.log("Deleted auth users:", deletedAuth);
  console.log("Done. You can sign up again from a clean state.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
