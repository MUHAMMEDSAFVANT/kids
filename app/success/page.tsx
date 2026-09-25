"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const buildShareLinks = (pageUrl: string, shareText: string) => {
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedText = encodeURIComponent(shareText);

  return {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    instagram: `https://www.instagram.com/?url=${encodedUrl}`,
  };
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "Your child";
  const link = searchParams.get("link") ?? "";

  const shareText = useMemo(
    () => `Hi! I am joining Starly and my child ${name} is ready to shine. Join us!`,
    [name],
  );

  const shareLinks = useMemo(() => buildShareLinks(link, shareText), [link, shareText]);

  return (
    <main className="min-h-screen bg-[#070b09] px-4 py-10 text-[#f2efe6]">
      <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-[#0b0f0d]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="mb-5 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#d7bd74]/40 bg-[#0d1211] text-4xl text-[#f0d8a4]">
            ✓
          </div>
        </div>

        <h1 className="text-center text-[1.4rem] font-semibold uppercase tracking-[0.18em] text-[#f0d8a4]">
          Success
        </h1>

        <p className="mt-4 text-center text-[0.8rem] uppercase tracking-[0.14em] text-[#d7d0c3]/80">
          Thanks, {name}! Your join request was saved successfully.
        </p>

        <div className="mt-6 rounded-[18px] border border-white/10 bg-[#111613] p-3">
          <div className="mb-2 text-[0.58rem] uppercase tracking-[0.18em] text-[#d7d0c3]/70">
            Share link
          </div>
          <div className="rounded-full border border-[#d7bd74]/30 bg-[#0d1211] px-3 py-3 text-center text-[0.7rem] text-[#f0d8a4] break-all">
            {link || "No link available"}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
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
          <a
            href={shareLinks.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on Instagram"
            className="rounded-full bg-[linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)] px-3 py-4 text-center text-[0.9rem] font-bold uppercase tracking-[0.08em] text-white"
          >
            Instagram
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#070b09] px-4 py-10 text-[#f2efe6]" /> }>
      <SuccessContent />
    </Suspense>
  );
}
