"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { buildShareLinks, buildShareText } from "@/lib/share";

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "Your child";
  const link = searchParams.get("link") ?? "";
  const imageUrl =
    searchParams.get("image") ??
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80";
  const description = searchParams.get("description") ?? buildShareText(name);

  const shareText = useMemo(() => description, [description]);
  const shareLinks = useMemo(
    () => buildShareLinks(link, shareText, imageUrl, description),
    [description, imageUrl, link, shareText],
  );

  return (
    <main className="min-h-screen bg-[#070b09] px-4 py-10 text-[#f2efe6]">
      <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-[#0b0f0d]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="mb-5 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#d7bd74]/40 bg-[#0d1211] text-4xl text-[#f0d8a4]">
            ✓
          </div>
        </div>

        <div className="text-center">
          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#f0d8a4]">Exclusive gift unlocked</p>
          <h1 className="mt-3 text-[1.7rem] font-semibold uppercase tracking-[0.12em] text-[#f7efe0]">
            Your star link is ready
          </h1>
        </div>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-[#d7bd74]/30 bg-[#111613]">
          <img src={imageUrl} alt={name} className="h-60 w-full object-cover" />
        </div>

        <div className="mt-5 rounded-[18px] border border-white/10 bg-[#111613] p-4">
          <div className="mb-2 text-[0.58rem] uppercase tracking-[0.18em] text-[#d7d0c3]/70">
            Share message
          </div>
          <p className="text-[0.82rem] leading-7 text-[#f4efe4]">{shareText}</p>
        </div>

        <div className="mt-5 rounded-[18px] border border-white/10 bg-[#111613] p-3">
          <div className="mb-2 text-[0.58rem] uppercase tracking-[0.18em] text-[#d7d0c3]/70">
            Join link
          </div>
          <div className="rounded-full border border-[#d7bd74]/30 bg-[#0d1211] px-3 py-3 text-center text-[0.7rem] text-[#f0d8a4] break-all">
            {link || "No link available"}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on WhatsApp"
            className="rounded-full bg-[#25D366] px-3 py-4 text-center text-[0.9rem] font-bold uppercase tracking-[0.08em] text-[#062d1b]"
          >
            WhatsApp
          </a>
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on Facebook"
            className="rounded-full bg-[#1877F2] px-3 py-4 text-center text-[0.9rem] font-bold uppercase tracking-[0.08em] text-white"
          >
            Facebook
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#070b09] px-4 py-10 text-[#f2efe6]" />}>
      <SuccessContent />
    </Suspense>
  );
}
