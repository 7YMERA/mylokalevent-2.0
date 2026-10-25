// Creates or resets one demo account per role in the Supabase project named
// in .env.local, and prints the new passwords once. Nothing is saved to disk
// or committed, and every run makes new passwords.
//
//   npm run demo:users              create or reset the demo accounts
//   npm run demo:users -- --remove  delete them (do this before launch)
//
// Needs SUPABASE_SECRET_KEY in .env.local. That key bypasses every access
// rule, so it stays on your machine: never in the repo, never NEXT_PUBLIC_.

import { randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error(
    "Add SUPABASE_SECRET_KEY to .env.local first (Supabase dashboard > Project Settings > API Keys > Secret keys).",
  );
  process.exit(1);
}

const accounts = [
  { role: "member", email: "demo.member@example.com", name: "Demo Ahli" },
  {
    role: "organiser",
    email: "demo.organiser@example.com",
    name: "Demo Penganjur",
  },
  { role: "admin", email: "demo.admin@example.com", name: "Demo Admin" },
];

// Random each run; the fixed parts satisfy the password policy
// (10+ characters with upper and lowercase letters and a number).
function makeSecret() {
  return ["Demo", randomBytes(9).toString("base64url"), "7a"].join("-");
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: list, error: listError } = await supabase.auth.admin.listUsers({
  perPage: 1000,
});
if (listError) throw listError;
const existing = new Map(list.users.map((user) => [user.email, user.id]));

if (process.argv.includes("--remove")) {
  for (const { email } of accounts) {
    const id = existing.get(email);
    if (!id) continue;
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;
    console.log(`Removed ${email}`);
  }
  process.exit(0);
}

const rows = [];
for (const { role, email, name } of accounts) {
  const secret = makeSecret();
  let id = existing.get(email);

  if (id) {
    const { error } = await supabase.auth.admin.updateUserById(id, {
      password: secret,
      email_confirm: true,
    });
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: secret,
      email_confirm: true,
      // Read by the handle_new_user trigger, like a normal sign-up.
      user_metadata: {
        display_name: name,
        locale: "ms",
        privacy_consent: "true",
      },
    });
    if (error) throw error;
    id = data.user.id;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role, status: "active" })
    .eq("id", id);
  if (error) throw error;

  rows.push({ role, email, password: secret });
}

console.table(rows);
console.log(
  "These passwords are shown only now. Run with --remove to delete the demo accounts before launch.",
);
