import { promises as fs } from "node:fs";
import path from "node:path";

import { getSupabaseServerClient, supabase } from "@/lib/supabase";

export type MemberRecord = {
  id: string;
  name: string;
  image_url: string;
  description: string;
  share_code: string;
  vote_count: number;
  voted_devices?: string[];
  created_at: string;
};

const LOCAL_MEMBERS_PATH = path.join(process.cwd(), "data", "members.json");

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isSupabaseSchemaMismatchError(error: unknown) {
  const message = String((error as { message?: string } | undefined)?.message ?? error ?? "");
  return /description.*column|column.*description|does not exist|no such column/i.test(message);
}

async function readLocalMembersFile(): Promise<MemberRecord[]> {
  try {
    const raw = await fs.readFile(LOCAL_MEMBERS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeMember) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return [];
    }

    console.error("[store] readLocalMembersFile error:", error);
    return [];
  }
}

async function writeLocalMembersFile(members: MemberRecord[]) {
  await fs.mkdir(path.dirname(LOCAL_MEMBERS_PATH), { recursive: true });
  await fs.writeFile(LOCAL_MEMBERS_PATH, JSON.stringify(members, null, 2), "utf8");
}

function normalizeMember(record: any): MemberRecord {
  const rawVotedDevices = record?.voted_devices;
  let votedDevices: string[] = [];

  if (Array.isArray(rawVotedDevices)) {
    votedDevices = rawVotedDevices.map((item) => String(item));
  } else if (typeof rawVotedDevices === "string") {
    try {
      const parsed = JSON.parse(rawVotedDevices);
      if (Array.isArray(parsed)) {
        votedDevices = parsed.map((item) => String(item));
      }
    } catch {
      votedDevices = [];
    }
  }

  return {
    id: String(record?.id ?? `member-${Date.now()}`),
    name: String(record?.name ?? ""),
    image_url: String(record?.image_url ?? ""),
    description: String(record?.description ?? ""),
    share_code: String(record?.share_code ?? ""),
    vote_count: Number(record?.vote_count ?? 0),
    voted_devices: votedDevices,
    created_at: String(record?.created_at ?? new Date().toISOString()),
  };
}

const getClient = () => (supabase ?? getSupabaseServerClient());

export async function readMembers(): Promise<MemberRecord[]> {
  try {
    if (!hasSupabaseConfig()) {
      return await readLocalMembersFile();
    }

    const client = getClient();
    const { data, error } = await client
      .from("members")
      .select("*")
      .order("vote_count", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeMember);
  } catch (error) {
    console.error("[store] readMembers error:", error);
    const fallback = await readLocalMembersFile();
    if (fallback.length) {
      return fallback;
    }

    return [];
  }
}

export async function createMember({
  name,
  image_url,
  description = "",
}: {
  name: string;
  image_url: string;
  description?: string;
}): Promise<MemberRecord> {
  const memberId = `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const shareCode = `kid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const nextMember = {
    id: memberId,
    name,
    image_url: image_url || "",
    description: String(description ?? "").trim(),
    share_code: shareCode,
    vote_count: 0,
    voted_devices: [],
    created_at: new Date().toISOString(),
  };

  if (!hasSupabaseConfig()) {
    const members = await readLocalMembersFile();
    const nextMembers = [...members, normalizeMember(nextMember)];
    await writeLocalMembersFile(nextMembers);
    return normalizeMember(nextMember);
  }

  const client = getClient();
  const { description: _description, ...dbInsertPayload } = nextMember;

  try {
    const { data, error } = await client.from("members").insert(dbInsertPayload).select().single();

    if (error || !data) {
      throw error ?? new Error("Unable to create member.");
    }

    return normalizeMember({ ...data, description: nextMember.description });
  } catch (error) {
    if (isSupabaseSchemaMismatchError(error)) {
      const members = await readLocalMembersFile();
      const nextMembers = [...members, normalizeMember(nextMember)];
      await writeLocalMembersFile(nextMembers);
      return normalizeMember(nextMember);
    }

    console.error("[store] createMember error:", error);
    throw new Error((error as { message?: string } | undefined)?.message ?? "Unable to create member.");
  }
}

export async function getMemberByShareCode(share_code: string): Promise<MemberRecord | null> {
  try {
    if (!hasSupabaseConfig()) {
      const members = await readLocalMembersFile();
      return members.find((member) => member.share_code === share_code) ?? null;
    }

    const client = getClient();
    const { data, error } = await client
      .from("members")
      .select("*")
      .eq("share_code", share_code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? normalizeMember(data) : null;
  } catch (error) {
    console.error("[store] getMemberByShareCode error:", error);
    const members = await readLocalMembersFile();
    return members.find((member) => member.share_code === share_code) ?? null;
  }
}

export async function voteForMember(
  share_code: string,
  device_id: string,
): Promise<{ member: MemberRecord | null; alreadyVoted: boolean }> {
  try {
    if (!hasSupabaseConfig()) {
      const members = await readLocalMembersFile();
      const memberIndex = members.findIndex((member) => member.share_code === share_code);

      if (memberIndex === -1) {
        return { member: null, alreadyVoted: false };
      }

      const member = members[memberIndex];
      const currentDevices = member.voted_devices ?? [];

      if (device_id && currentDevices.includes(device_id)) {
        return { member, alreadyVoted: true };
      }

      const nextDevices = device_id ? [...new Set([...currentDevices, device_id])] : currentDevices;
      const nextVoteCount = Number(member.vote_count ?? 0) + 1;
      const nextMember = { ...member, vote_count: nextVoteCount, voted_devices: nextDevices };
      members[memberIndex] = nextMember;
      await writeLocalMembersFile(members);

      return { member: nextMember, alreadyVoted: false };
    }

    const client = getClient();
    const { data: memberData, error: memberError } = await client
      .from("members")
      .select("*")
      .eq("share_code", share_code)
      .maybeSingle();

    if (memberError || !memberData) {
      throw memberError ?? new Error("Member not found.");
    }

    const member = normalizeMember(memberData);
    const currentDevices = member.voted_devices ?? [];

    if (device_id && currentDevices.includes(device_id)) {
      return { member, alreadyVoted: true };
    }

    const nextDevices = device_id ? [...new Set([...currentDevices, device_id])] : currentDevices;
    const nextVoteCount = Number(member.vote_count ?? 0) + 1;

    const { data: updated, error: updateError } = await client
      .from("members")
      .update({
        vote_count: nextVoteCount,
        voted_devices: nextDevices,
      })
      .eq("id", member.id)
      .select()
      .single();

    if (updateError || !updated) {
      throw updateError ?? new Error("Vote update failed.");
    }

    return { member: normalizeMember(updated), alreadyVoted: false };
  } catch (error) {
    console.error("[store] voteForMember error:", error);
    return { member: null, alreadyVoted: false };
  }
}

export async function updateMember(
  memberId: string,
  updates: Partial<Pick<MemberRecord, "name" | "image_url" | "description" | "share_code" | "vote_count" | "voted_devices">>,
): Promise<MemberRecord> {
  const client = getClient();
  const { data, error } = await client
    .from("members")
    .update(updates)
    .eq("id", memberId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to update member.");
  }

  return normalizeMember(data);
}

export async function deleteMember(memberId: string): Promise<boolean> {
  const client = getClient();
  const { error } = await client.from("members").delete().eq("id", memberId);

  if (error) {
    throw new Error(error.message ?? "Unable to delete member.");
  }

  return true;
}
