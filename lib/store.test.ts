import test from "node:test";
import assert from "node:assert/strict";

import { createMember, readMembers } from "./store.ts";

test("readMembers falls back to the local JSON store when Supabase config is missing", async () => {
  const members = await readMembers();
  assert.ok(Array.isArray(members));
});

test("createMember stores new members without Supabase environment variables", async () => {
  const newMember = await createMember({
    name: "Test Star",
    image_url: "https://example.com/test-star.jpg",
    description: "Always shining",
  });

  assert.equal(newMember.name, "Test Star");
  assert.ok(newMember.share_code.startsWith("kid-"));
  assert.equal(newMember.description, "Always shining");

  const members = await readMembers();
  assert.ok(members.some((member) => member.share_code === newMember.share_code));
});
