import { NextRequest, NextResponse } from "next/server";

import { deleteMember, updateMember } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action ?? "").trim();

    if (action === "update") {
      const memberId = String(body?.id ?? "").trim();
      const name = String(body?.name ?? "").trim();
      const imageUrl = String(body?.image_url ?? "").trim();

      if (!memberId) {
        return NextResponse.json({ success: false, error: "Member id is required." }, { status: 400 });
      }

      const updated = await updateMember(memberId, {
        name: name || undefined,
        image_url: imageUrl || undefined,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "delete") {
      const memberId = String(body?.id ?? "").trim();

      if (!memberId) {
        return NextResponse.json({ success: false, error: "Member id is required." }, { status: 400 });
      }

      await deleteMember(memberId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Admin member update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to update member.",
      },
      { status: 500 },
    );
  }
}
