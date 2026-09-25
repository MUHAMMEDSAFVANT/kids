import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type MemberRecord = {
  id: string;
  name: string;
  image_url: string;
  share_code: string;
  vote_count: number;
  voted_devices?: string[];
  created_at: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "members.json");

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DATA_FILE, "utf-8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readMembers(): Promise<MemberRecord[]> {
  await ensureStore();

  const file = await readFile(DATA_FILE, "utf-8");

  try {
    const parsed = JSON.parse(file) as MemberRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeMembers(members: MemberRecord[]) {
  await ensureStore();
  await writeFile(DATA_FILE, JSON.stringify(members, null, 2), "utf-8");
}

export async function createMember({
  name,
  image_url,
}: {
  name: string;
  image_url: string;
}): Promise<MemberRecord> {
  const members = await readMembers();
  const record: MemberRecord = {
    id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    image_url: image_url || "",
    share_code: `kid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    vote_count: 0,
    voted_devices: [],
    created_at: new Date().toISOString(),
  };

  members.unshift(record);
  await writeMembers(members);

  console.log("[store] member created", {
    id: record.id,
    name: record.name,
    share_code: record.share_code,
    created_at: record.created_at,
    vote_count: record.vote_count,
  });

  return record;
}

export async function getMemberByShareCode(share_code: string): Promise<MemberRecord | null> {
  const members = await readMembers();
  return members.find((member) => member.share_code === share_code) ?? null;
}

export async function voteForMember(
  share_code: string,
  device_id: string,
): Promise<{ member: MemberRecord | null; alreadyVoted: boolean }> {
  const members = await readMembers();
  const index = members.findIndex((member) => member.share_code === share_code);

  if (index === -1) {
    return { member: null, alreadyVoted: false };
  }

  const member = members[index];
  const votedDevices = new Set(member.voted_devices ?? []);

  if (device_id && votedDevices.has(device_id)) {
    console.log("[store] duplicate vote blocked", {
      share_code,
      device_id,
      member_name: member.name,
      vote_count: member.vote_count,
      created_at: member.created_at,
    });
    return { member, alreadyVoted: true };
  }

  votedDevices.add(device_id || `guest-${Date.now()}`);

  members[index] = {
    ...member,
    voted_devices: [...votedDevices],
    vote_count: Number(member.vote_count ?? 0) + 1,
  };

  await writeMembers(members);

  console.log("[store] vote updated live", {
    share_code,
    member_name: members[index].name,
    vote_count: members[index].vote_count,
    created_at: members[index].created_at,
    updated_at: new Date().toISOString(),
    device_id,
  });

  return { member: members[index], alreadyVoted: false };
}
