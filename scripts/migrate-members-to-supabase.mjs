import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const membersFilePath = path.resolve(process.cwd(), "data", "members.json");

let rawMembers;
try {
  rawMembers = JSON.parse(readFileSync(membersFilePath, "utf8"));
} catch (error) {
  console.error("Unable to read data/members.json. Make sure the file exists.");
  process.exit(1);
}

if (!Array.isArray(rawMembers)) {
  console.error("data/members.json does not contain an array of members.");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const normalized = rawMembers.map((member) => ({
  id: String(member.id ?? `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
  name: String(member.name ?? ""),
  image_url: String(member.image_url ?? ""),
  share_code: String(member.share_code ?? ""),
  vote_count: Number(member.vote_count ?? 0),
  voted_devices: Array.isArray(member.voted_devices) ? member.voted_devices.map((item) => String(item)) : [],
  created_at: member.created_at ?? new Date().toISOString(),
}));

const { error } = await client.from("members").upsert(normalized, { onConflict: "id" });

if (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}

console.log(`Imported ${normalized.length} members into Supabase members table.`);
