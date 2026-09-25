import { NextRequest, NextResponse } from "next/server";

import { getMemberByShareCode, voteForMember } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const shareCode = String(body.share_code ?? "").trim();
    const deviceId = String(body.device_id ?? request.headers.get("x-device-id") ?? "").trim();

    if (!shareCode) {
      return NextResponse.json(
        { success: false, error: "Share code is required." },
        { status: 400 },
      );
    }

    const existingMember = await getMemberByShareCode(shareCode);

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: "This share link is invalid." },
        { status: 404 },
      );
    }

    const { member, alreadyVoted } = await voteForMember(shareCode, deviceId);

    if (alreadyVoted) {
      console.log("[api/vote] duplicate vote prevented", {
        share_code: shareCode,
        device_id: deviceId,
        member_name: existingMember.name,
      });
      return NextResponse.json(
        { success: false, error: "This device has already voted for this star.", alreadyVoted: true },
        { status: 409 },
      );
    }

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Unable to count the vote." },
        { status: 500 },
      );
    }

    console.log("[api/vote] live vote update", {
      share_code: shareCode,
      member_name: member.name,
      vote_count: member.vote_count,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error("Vote error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to count the vote." },
      { status: 500 },
    );
  }
}
