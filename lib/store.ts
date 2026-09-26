import { getSupabaseServerClient, supabase } from "@/lib/supabase";

export type MemberRecord = {
  id: string;
  name: string;
  image_url: string;
  share_code: string;
  vote_count: number;
  voted_devices?: string[];
  created_at: string;
};

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
    share_code: String(record?.share_code ?? ""),
    vote_count: Number(record?.vote_count ?? 0),
    voted_devices: votedDevices,
    created_at: String(record?.created_at ?? new Date().toISOString()),
  };
}

const getClient = () => (supabase ?? getSupabaseServerClient());

export async function readMembers(): Promise<MemberRecord[]> {
  try {
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
    return [];
  }
}

export async function createMember({
  name,
  image_url,
}: {
  name: string;
  image_url: string;
}): Promise<MemberRecord> {
  const client = getClient();
  const memberId = `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const shareCode = `kid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const record = {
    id: memberId,
    name,
    image_url: image_url || "",
    share_code: shareCode,
    vote_count: 0,
    voted_devices: [],
    created_at: new Date().toISOString(),
  };

  const { data, error } = await client.from("members").insert(record).select().single();

  if (error || !data) {
    console.error("[store] createMember error:", error);
    throw new Error(error?.message ?? "Unable to create member.");
  }

  return normalizeMember(data);
}

export async function getMemberByShareCode(share_code: string): Promise<MemberRecord | null> {
  try {
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
    return null;
  }
}

export async function voteForMember(
  share_code: string,
  device_id: string,
): Promise<{ member: MemberRecord | null; alreadyVoted: boolean }> {
  try {
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
  updates: Partial<Pick<MemberRecord, "name" | "image_url" | "share_code" | "vote_count" | "voted_devices">>,
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
