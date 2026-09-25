import { NextResponse } from "next/server";

import { readMembers } from "@/lib/store";

export async function GET() {
  try {
    const members = await readMembers();
    const sorted = [...members].sort((a, b) => Number(b.vote_count) - Number(a.vote_count));

    return NextResponse.json({ success: true, data: sorted });
  } catch (error) {
    console.error("List members error:", error);

    return NextResponse.json(
      { success: false, data: [], error: "Unable to load members." },
      { status: 500 },
    );
  }
}
