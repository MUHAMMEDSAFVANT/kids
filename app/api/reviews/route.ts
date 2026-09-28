import { NextResponse } from "next/server";

import { createReview, readReviews } from "@/lib/store";

export async function GET() {
  try {
    const reviews = await readReviews();
    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error("List reviews error:", error);
    return NextResponse.json(
      { success: false, data: [], error: "Unable to load reviews." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const rating = Number(body?.rating ?? 5);
    const text = String(body?.text ?? "").trim();
    const image = String(body?.image ?? "").trim();

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Comment is required." },
        { status: 400 },
      );
    }

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5." },
        { status: 400 },
      );
    }

    const review = await createReview({ name, rating, text, image });
    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save review." },
      { status: 500 },
    );
  }
}
