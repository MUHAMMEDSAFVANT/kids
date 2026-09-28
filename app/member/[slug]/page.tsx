import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buildShareText } from "@/lib/share";
import { getMemberByShareCode } from "@/lib/store";

import { MemberVoteCard } from "./MemberVoteCard";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const searchValues = await searchParams;
  const member = await getMemberByShareCode(slug);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pageUrl = new URL(`/member/${slug}`, siteUrl).toString();
  const imageUrl =
    (typeof searchValues.image === "string" && searchValues.image.trim()) || member?.image_url || "";
  const description =
    (typeof searchValues.description === "string" && searchValues.description.trim()) ||
    member?.description ||
    (member ? `Vote for ${member.name} on Starly.` : buildShareText("this star"));

  if (!member) {
    return {
      title: "Member not found",
      description: "This Starly member could not be found.",
      openGraph: {
        title: "Member not found",
        description: "This Starly member could not be found.",
        url: pageUrl,
        type: "website",
      },
    };
  }

  return {
    title: `${member.name} | Starly Vote Page`,
    description,
    openGraph: {
      title: `${member.name} | Starly Vote Page`,
      description,
      url: pageUrl,
      type: "website",
      siteName: "Starly",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `${member.name} on Starly`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${member.name} | Starly Vote Page`,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function MemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await getMemberByShareCode(slug);

  if (!member) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#070b09] px-4 py-10 text-[#f2efe6]">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-[#0b0f0d]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="text-[0.7rem] uppercase tracking-[0.18em] text-[#f0d8a4]">
            ← Back to home
          </Link>
          <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[#d4c9b8]/70">Member profile</div>
        </div>

        <MemberVoteCard member={member} />
      </div>
    </main>
  );
}
