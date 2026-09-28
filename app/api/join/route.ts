import { NextRequest, NextResponse } from "next/server";

import { createMember } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const imageUrl = String(body.image_url ?? "").trim();
    const description = String(body.description ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required." },
        { status: 400 },
      );
    }

    const member = await createMember({
      name,
      image_url: imageUrl,
      description,
    });

    console.log("[api/join] created share link", {
      name,
      share_code: member.share_code,
      created_at: member.created_at,
      share_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/member/${member.share_code}`,
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json(
      {
        success: true,
        data: {
          ...member,
          share_url: `${origin}/member/${member.share_code}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Join request error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save the join request right now.",
      },
      { status: 500 },
    );
  }
}
