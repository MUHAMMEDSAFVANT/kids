"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

type MemberRecord = {
  id: string;
  name: string;
  image_url: string;
  share_code: string;
  vote_count: number;
  created_at: string;
};

const avatarImages = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
];

const formatVoteCount = (value: number) => new Intl.NumberFormat("en-US").format(value ?? 0);

const getDeviceId = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const storageKey = "starly-device-id";
  const existing = window.localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const newId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(storageKey, newId);
  return newId;
};

const getVotedMembers = () => {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    return JSON.parse(window.localStorage.getItem("starly-voted-members") ?? "[]") as string[];
  } catch {
    return [] as string[];
  }
};

const CLOUDINARY_CLOUD_NAME = "dmjmtv7kj";
const CLOUDINARY_UPLOAD_PRESET = "profile_upload";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function Home() {
  const router = useRouter();
  const [memberName, setMemberName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [members, setMembers] = useState<MemberRecord[]>([]);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => Number(b.vote_count) - Number(a.vote_count)),
    [members],
  );

  const topMember = sortedMembers[0] ?? null;
  const leaderboardData = sortedMembers.slice(0, 5).map((member, index) => ({
    rank: String(index + 1).padStart(2, "0"),
    share_code: member.share_code,
    name: member.name,
    age: `${formatVoteCount(member.vote_count)} votes`,
    votes: formatVoteCount(member.vote_count),
    change: "+live",
    image: member.image_url || avatarImages[index % avatarImages.length],
  }));

  const risingData = sortedMembers.slice(0, 4).map((member, index) => ({
    name: member.name,
    position: `${formatVoteCount(member.vote_count)} votes`,
    subtitle: "live now",
    trend: `+${Math.min(999, index + 5)} votes`,
    accent: ["bg-[#c8b899]", "bg-[#d8a77b]", "bg-[#9bc7d8]", "bg-[#a9d5ab]"][index % 4],
    image: member.image_url || avatarImages[index % avatarImages.length],
  }));

  const discoverData = sortedMembers.slice(0, 5).map((member, index) => ({
    name: member.name,
    age: `Member • ${member.share_code.slice(0, 6)}`,
    votes: formatVoteCount(member.vote_count),
    bg: [
      "from-[#f1d4b4] via-[#d8b28d] to-[#7b4f30]",
      "from-[#d9d2d0] via-[#a08a86] to-[#5d4d46]",
      "from-[#d7d3c7] via-[#9d9079] to-[#524936]",
      "from-[#d8d1b7] via-[#b0aa8a] to-[#534c3c]",
      "from-[#ddd3c3] via-[#a58a6a] to-[#504239]",
    ][index % 5],
    rank: `#${String(index + 1).padStart(2, "0")}`,
    image: member.image_url || avatarImages[index % avatarImages.length],
  }));

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/members");
      const result = await response.json();
      if (response.ok && Array.isArray(result?.data)) {
        setMembers(result.data);
        console.log("[page] live backend members", result.data.map((member: MemberRecord) => ({
          name: member.name,
          vote_count: member.vote_count,
          created_at: member.created_at,
          share_code: member.share_code,
        })));
      }
    } catch {
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only URL hydration avoids SSR mismatch
    setShareUrl(window.location.href);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mount state for share links
    setIsMounted(true);
    void fetchMembers();
    const timer = window.setInterval(() => {
      void fetchMembers();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [fetchMembers]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    setStatusMessage("Uploading image ...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || "Image upload failed.");
      }

      setImageUrl(result.secure_url);
      setStatusMessage("Image uploaded successfully.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Something went wrong while uploading the image.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleVoteForTopMember = async () => {
    if (!topMember) {
      return;
    }

    const deviceId = getDeviceId();
    const votedMembers = getVotedMembers();

    if (votedMembers.includes(topMember.share_code)) {
      alert("This device has already voted for this star.");
      return;
    }

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId,
        },
        body: JSON.stringify({
          share_code: topMember.share_code,
          device_id: deviceId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result?.alreadyVoted) {
          const nextVotedMembers = [...new Set([...votedMembers, topMember.share_code])];
          window.localStorage.setItem("starly-voted-members", JSON.stringify(nextVotedMembers));
        }
        throw new Error(result?.error || "Unable to count the vote.");
      }

      const nextVotedMembers = [...new Set([...votedMembers, topMember.share_code])];
      window.localStorage.setItem("starly-voted-members", JSON.stringify(nextVotedMembers));
      await fetchMembers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to count the vote.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const safeName = memberName.trim();
    if (!safeName) {
      setStatusMessage("Please enter a name before joining.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: safeName,
          image_url: imageUrl.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save your join request.");
      }

      if (result?.data?.share_url) {
        setShareUrl(result.data.share_url);
        setIsJoinOpen(false);
        const shareText = `Hi! I’m joining Starly and my child ${safeName} is ready to shine. Join my star link and unlock an exclusive gift!`;
        const successUrl = `/success?name=${encodeURIComponent(safeName)}&link=${encodeURIComponent(result.data.share_url)}&image=${encodeURIComponent(imageUrl.trim())}&description=${encodeURIComponent(shareText)}`;
        router.push(successUrl);
        return;
      }

      setStatusMessage(`Thanks, ${safeName}! Your join request was saved successfully.`);
      await fetchMembers();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Something went wrong while joining.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareText = useMemo(() => {
    const name = memberName.trim() || "My child";
    return `Hi! I’m joining Starly and my child ${name} is ready to shine. Join my star link and unlock an exclusive gift!`;
  }, [memberName]);

  const shareLinks = useMemo(() => {
    if (!isMounted || !shareUrl) {
      return {
        whatsapp: "",
        facebook: "",
        instagram: "",
      };
    }

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    return {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      instagram: `https://www.instagram.com/?url=${encodedUrl}`,
    };
  }, [imageUrl, isMounted, shareText, shareUrl]);

  const winnerSlides = [
    {
      title: "Monthly winner",
      badge: "Fredy",
      prize: "Monthly winner",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Weekend winner",
      badge: "Ava",
      prize: "Weekend winner",
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Day winner",
      badge: "Nia",
      prize: "Day winner",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const [winnerSlideIndex, setWinnerSlideIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWinnerSlideIndex((current) => (current + 1) % winnerSlides.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [winnerSlides.length]);

  return (
    <div className="min-h-screen bg-[#070b09] text-[#f2efe6]">
      <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 lg:px-8">
        {isJoinOpen ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050807]/80 p-3 backdrop-blur-sm sm:p-4">
            <div className="mx-auto flex min-h-full w-full max-w-xl items-center justify-center py-3">
              <div className="w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[26px] border border-[#d7bd74]/30 bg-[#0d1211] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overscroll-contain sm:max-h-[calc(100dvh-2rem)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[0.72rem] uppercase tracking-[0.18em] text-[#f0d8a4]">Create your star link</div>
                  <button
                    type="button"
                    onClick={() => setIsJoinOpen(false)}
                    className="text-lg text-[#f5efe6]"
                  >
                    ×
                  </button>
                </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-[0.62rem] uppercase tracking-[0.16em] text-[#d7d0c3]/75">
                  Child name
                  <input
                    value={memberName}
                    onChange={(event) => setMemberName(event.target.value)}
                    placeholder="Enter your child name"
                    className="mt-2 w-full rounded-full border border-white/10 bg-[#121914] px-4 py-3 text-[0.8rem] text-[#f5efe6] outline-none placeholder:text-[#d7d0c3]/50 focus:border-[#f0d8a4]"
                  />
                </label>

                <label className="block text-[0.62rem] uppercase tracking-[0.16em] text-[#d7d0c3]/75">
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mt-2 block w-full rounded-full border border-dashed border-white/10 bg-[#121914] px-4 py-3 text-[0.65rem] text-[#f5efe6] file:mr-3 file:rounded-full file:border-0 file:bg-[#f0d8a4] file:px-3 file:py-2 file:text-[0.58rem] file:font-semibold file:uppercase file:tracking-[0.12em] file:text-[#0d120f]"
                  />
                </label>

                <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#111613] p-3">
                  {imageUrl ? (
                    <img src={imageUrl} alt={memberName || "Child"} className="h-40 w-full rounded-[14px] object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-[14px] border border-dashed border-white/10 bg-[#121914] text-[0.62rem] uppercase tracking-[0.18em] text-[#d7d0c3]/70">
                      No image selected
                    </div>
                  )}
                  <div className="mt-3 text-center text-[1.2rem] font-semibold text-[#f0d8a4]">
                    {memberName || "Your child name"}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="w-full rounded-full border border-[#d7bd74] bg-[#f0d8a4] px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#0d120f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Creating link..." : isUploadingImage ? "Uploading..." : "Create link"}
                </button>

                {statusMessage ? (
                  <div className="rounded-full border border-[#d7bd74]/30 bg-[#121914] px-3 py-2 text-center text-[0.58rem] uppercase tracking-[0.12em] text-[#f5efe6]">
                    {statusMessage}
                  </div>
                ) : null}

              </form>
            </div>
          </div>
        </div>
        ) : null}

        <header className="rounded-[22px] border border-white/10 bg-[#0b0f0d]/85 px-3 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-[#f5dca2]">
              <span className="shrink-0 text-lg sm:text-xl">★</span>
              <span className="truncate font-serif text-[1.1rem] font-semibold tracking-[0.18em] text-[#f7efe0] sm:text-[1.8rem] sm:tracking-[0.25em]">
                STARLY
              </span>
            </div>

            <nav className="hidden items-center gap-8 text-[0.72rem] uppercase tracking-[0.16em] text-[#d9d5cf]/80 md:flex">
              <a href="#today-star" className="transition hover:text-[#f5dca2]">Today&apos;s Star</a>
              <a href="#stars" className="transition hover:text-[#f5dca2]">Stars</a>
              <a href="#rising" className="transition hover:text-[#f5dca2]">Rising</a>
              <a href="#hall-of-stars" className="transition hover:text-[#f5dca2]">Hall of Stars</a>
              <a href="#about" className="transition hover:text-[#f5dca2]">About</a>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              {/* <Link
                href="/admin"
                className="inline-flex h-10 min-w-[78px] items-center justify-center rounded-full border border-white/15 bg-[#0d1211] px-3 text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#f5dca2] transition hover:border-[#d8ba7a] sm:h-11 sm:min-w-[92px] sm:px-4 sm:text-[0.65rem]"
              >
                Admin
              </Link> */}
              <button
                type="button"
                onClick={() => setIsJoinOpen((current) => !current)}
                className="inline-flex h-10 min-w-[78px] items-center justify-center rounded-full border border-[#d8ba7a] bg-[#f0d8a4] px-3 text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#0c100f] transition hover:brightness-105 sm:h-11 sm:min-w-[92px] sm:px-5 sm:text-[0.72rem]"
              >
                Join
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#d7bd74]/20 bg-[#0d1211] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
          <div className="relative overflow-hidden">
            {isMounted ? (
              <div className="absolute right-4 top-4 z-10 flex flex-wrap justify-end gap-2">
                {Object.entries(shareLinks).map(([platform, link]) => {
                  if (!link) {
                    return null;
                  }

                  return (
                    <a
                      key={platform}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/20 bg-[#0b100d]/35 px-2.5 py-1 text-[0.48rem] uppercase tracking-[0.14em] text-[#f5efe6] backdrop-blur-sm"
                    >
                      {platform}
                    </a>
                  );
                })}
              </div>
            ) : null}

            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${winnerSlideIndex * 100}%)` }}
            >
              {winnerSlides.map((slide) => (
                <div key={`${slide.badge}-${slide.title}`} className="relative min-w-full">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    width={1400}
                    height={420}
                    className="h-[260px] w-full object-cover sm:h-[320px] lg:h-[390px]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,11,9,0.72),rgba(7,11,9,0.2),rgba(7,11,9,0.72))]" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="text-[0.62rem] uppercase tracking-[0.22em] text-[#f0d8a4]">{slide.title}</div>
                        <div className="mt-2 text-[1.8rem] font-semibold text-[#f7efe0] sm:text-[2.4rem]">{slide.badge}</div>
                      </div>
                      <div className="inline-flex w-fit rounded-full border border-[#f0d8a4]/40 bg-[#0b0f0d]/45 px-3 py-2 text-[0.58rem] uppercase tracking-[0.16em] text-[#f8f2e8] backdrop-blur-sm">
                        {slide.prize}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {winnerSlides.map((slide, index) => (
                <button
                  key={`${slide.badge}-dot`}
                  type="button"
                  aria-label={`Show winner ${index + 1}`}
                  onClick={() => setWinnerSlideIndex(index)}
                  className={`h-2.5 w-2.5 rounded-full transition ${winnerSlideIndex === index ? "bg-[#f0d8a4]" : "bg-white/35"}`}
                />
              ))}
            </div>
          </div>
        </section>

        <main className="mt-6 space-y-6">
          <section id="today-star" className="scroll-mt-28 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(161,220,165,0.18),_rgba(7,11,9,0.94)_35%,_rgba(10,14,12,1)_65%)]">
            <div className="grid items-end gap-8 px-4 pb-4 pt-5 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:pb-8 lg:pt-8">
              <div className="space-y-5 pt-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.27em] text-[#d5c39e]">
                  Star of the day
                </p>
                <h1 className="headline-serif text-[3.8rem] leading-[0.82] tracking-[-0.06em] text-[#f4efe4] sm:text-[5rem] lg:text-[7.4rem]">
                  {topMember ? topMember.name.toUpperCase() : "NO STAR YET"}
                </h1>
                <p className="text-[0.75rem] uppercase tracking-[0.2em] text-[#d1c7b4]/75">
                  {topMember ? `${topMember.share_code.slice(0, 6)} · live star` : "waiting for first vote"}
                </p>

                {topMember ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-[2.3rem] font-black leading-none text-[#f0d8a4]">
                        {formatVoteCount(topMember.vote_count)}
                      </span>
                      <span className="text-[0.76rem] uppercase tracking-[0.15em] text-[#d9d1c2]/70">votes</span>
                      <span className="rounded-full border border-[#d2a74a]/70 bg-[#121d1a] px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#f0d8a4]">
                        +{Math.min(999, topMember.vote_count % 100)} today
                      </span>
                    </div>

                    <div className="h-2 w-full max-w-[260px] overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#f0d8a4]"
                        style={{ width: `${Math.min(100, (topMember.vote_count / Math.max(1, topMember.vote_count + 300)) * 100)}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVoteForTopMember}
                      className="mt-2 flex items-center gap-2 rounded-full border border-[#d5be83] bg-[#f0d8a4] px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#0b100d] transition hover:brightness-105"
                    >
                      <span>★</span>
                      Vote for {topMember.name}
                    </button>
                  </>
                ) : (
                  <div className="rounded-full border border-white/10 bg-[#0d1211] px-4 py-3 text-[0.68rem] uppercase tracking-[0.16em] text-[#d7d0c3]/75">
                    No member data yet. Create the first link.
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0a100d] px-3 py-2 text-[#f0d8a4]">
                    <span className="text-2xl">◔</span>
                    <div>
                      <div className="text-[1.35rem] font-semibold leading-none">Live</div>
                      <div className="text-[0.55rem] uppercase tracking-[0.18em] text-[#d6cfc4]/70">vote feed</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex items-end justify-center">
                <div className="absolute inset-x-10 top-6 h-[70%] rounded-[40%] bg-[radial-gradient(circle,_rgba(186,220,135,0.28),_rgba(5,8,7,0)_60%)] blur-3xl" />
                <div className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1211] shadow-[0_36px_80px_rgba(0,0,0,0.45)] sm:max-w-[520px] lg:max-w-[760px]">
                  {topMember?.image_url ? (
                    <Image
                      src={topMember.image_url}
                      alt={topMember.name}
                      width={1200}
                      height={760}
                      className="h-[320px] w-full object-cover object-center sm:h-[420px] lg:h-[560px]"
                    />
                  ) : (
                    <div className="flex h-[320px] w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(240,216,164,0.22),_rgba(13,18,17,0.96)_55%)] text-[0.84rem] uppercase tracking-[0.22em] text-[#d7d0c3]/75 sm:h-[420px] lg:h-[560px]">
                      No image yet
                    </div>
                  )}
                  <div className="absolute right-3 top-3 rounded-full border border-white/15 bg-[#0a0f0d]/30 px-2.5 py-1.5 text-right backdrop-blur-sm sm:right-4 sm:top-4 sm:px-3 sm:py-2">
                    <div className="text-[2.1rem] font-black leading-none text-[#f4d49a] sm:text-[3rem]">
                      {topMember ? `#${String(1).padStart(2, "0")}` : "--"}
                    </div>
                    <div className="text-[0.46rem] uppercase tracking-[0.18em] text-[#d7d0c3]/70 sm:text-[0.58rem] sm:tracking-[0.2em]">Today&apos;s rank</div>
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full border border-white/10 bg-[#0a100d]/60 px-2.5 py-1.5 text-[#f4efe4] backdrop-blur-sm sm:bottom-4 sm:right-4 sm:px-3 sm:py-2">
                    <button className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg">‹</button>
                    <button className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg">›</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="stars" className="scroll-mt-28 grid gap-6 xl:grid-cols-[1.08fr_1.5fr_0.82fr]">
            <div className="rounded-[24px] border border-white/10 bg-[#090e0d] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between text-[0.62rem] uppercase tracking-[0.16em] text-[#d4c9b8]/70">
                <span>Live leaderboard</span>
                <span>Top {Math.min(5, leaderboardData.length)} today</span>
              </div>

              <div className="space-y-3">
                {leaderboardData.length ? leaderboardData.map((entry, index) => (
                  <div
                    key={entry.share_code || `${entry.name}-${index}`}
                    className="flex items-center gap-3 rounded-[14px] border border-transparent bg-white/[0.02] px-2 py-2 transition-all duration-700 ease-out hover:translate-x-1 hover:border-[#d7bd74]/20"
                  >
                    <div className="flex w-8 items-center justify-center text-[0.75rem] font-semibold text-[#f0d8a4]">
                      {entry.rank}
                    </div>
                    <Image
                      src={entry.image || avatarImages[index % avatarImages.length]}
                      alt={entry.name}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-[#d7bd74]/10 transition-all duration-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[0.9rem] font-semibold text-[#f5efe6]">{entry.name}</div>
                        <div className="text-[0.7rem] text-[#f0d8a4] animate-pulse">{entry.votes}</div>
                      </div>
                      <div className="text-[0.64rem] uppercase tracking-[0.12em] text-[#d7cfc3]/65">{entry.age}</div>
                    </div>
                    <div className="text-right text-[0.62rem] uppercase tracking-[0.12em] text-[#98d7ae]">
                      {entry.change}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[16px] border border-dashed border-white/10 bg-[#0c110f] px-3 py-5 text-center text-[0.62rem] uppercase tracking-[0.16em] text-[#d7d0c3]/70">
                    No live members yet
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => document.getElementById("stars")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="mt-4 w-full rounded-full border border-white/10 bg-[#111613] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f1e8d6]"
              >
                View Full Leaderboard →
              </button>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#090e0d] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[0.62rem] uppercase tracking-[0.18em] text-[#d4c9b8]/70">Voting momentum</div>
                  <div className="mt-2 text-[0.72rem] uppercase tracking-[0.14em] text-[#b9b6ab]/80">
                    {topMember ? `${topMember.name}'s votes today` : "Waiting for first vote"}
                  </div>
                </div>
                <div className="text-[1.2rem] font-semibold text-[#f0d8a4]">
                  {topMember ? formatVoteCount(topMember.vote_count) : "0"}
                </div>
              </div>

              <div className="relative h-44 overflow-hidden rounded-[18px] border border-white/5 bg-[linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] px-4 pt-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,216,128,0.26),_rgba(4,7,6,0)_50%)]" />
                <svg viewBox="0 0 500 190" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-label="Voting momentum chart">
                  <path d="M0 140 C60 125, 90 138, 110 126 S180 90, 210 100 S275 64, 310 72 S390 42, 430 56 S470 36, 500 40" fill="none" stroke="#f0d8a4" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M0 140 C60 125, 90 138, 110 126 S180 90, 210 100 S275 64, 310 72 S390 42, 430 56 S470 36, 500 40 L500 190 L0 190 Z" fill="url(#chartFill)" opacity="0.22" />
                  <defs>
                    <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f0d8a4" />
                      <stop offset="100%" stopColor="#f0d8a4" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-x-0 bottom-0 flex justify-between px-4 pb-2 text-[0.56rem] uppercase tracking-[0.16em] text-[#d5cfc4]/65">
                  <span>9am</span>
                  <span>1pm</span>
                  <span>3pm</span>
                  <span>5pm</span>
                  <span>7pm</span>
                  <span>9pm</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-[#f4efe5]">
                <div className="rounded-[14px] border border-white/10 bg-white/[0.02] px-2 py-3">
                  <div className="text-[0.6rem] uppercase tracking-[0.12em] text-[#d8d2c8]/70">Today&apos;s rank</div>
                  <div className="mt-2 text-[1.2rem] font-semibold text-[#f0d8a4]">{topMember ? "#1" : "--"}</div>
                </div>
                <div className="rounded-[14px] border border-white/10 bg-white/[0.02] px-2 py-3">
                  <div className="text-[0.6rem] uppercase tracking-[0.12em] text-[#d8d2c8]/70">This week</div>
                  <div className="mt-2 text-[1.2rem] font-semibold text-[#f0d8a4]">{topMember ? "#4" : "--"}</div>
                </div>
                <div className="rounded-[14px] border border-white/10 bg-white/[0.02] px-2 py-3">
                  <div className="text-[0.6rem] uppercase tracking-[0.12em] text-[#d8d2c8]/70">This month</div>
                  <div className="mt-2 text-[1.2rem] font-semibold text-[#f0d8a4]">{topMember ? "#12" : "--"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#090e0d] p-4 sm:p-5">
              <div className="mb-3 overflow-hidden rounded-[18px] border border-white/10">
                {topMember?.image_url ? (
                  <Image
                    src={topMember.image_url}
                    alt={topMember.name}
                    width={800}
                    height={500}
                    className="h-[210px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[210px] w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(240,216,164,0.18),_rgba(13,18,17,0.96)_60%)] text-[0.62rem] uppercase tracking-[0.2em] text-[#d7d0c3]/75">
                    No image uploaded
                  </div>
                )}
              </div>
              <div className="text-[1.05rem] font-serif italic text-[#f7efe0]">
                {topMember ? "“Every child has a star within them.”" : "“Your next star is waiting to be created.”"}
              </div>
            </div>
          </section>

          <section id="rising" className="scroll-mt-28 rounded-[24px] border border-white/10 bg-[#090e0d] p-4 sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[#f0d8a4]">
                <span className="text-lg">✦</span>
                <h2 className="text-[1.2rem] font-semibold uppercase tracking-[0.16em] text-[#f0d8a4]">Rising fast</h2>
              </div>
              <div className="text-[0.68rem] uppercase tracking-[0.14em] text-[#d6d0c8]/75">Who&apos;s gaining the most votes right now?</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {risingData.length ? risingData.map((card, index) => (
                <div key={`${card.name}-${index}`} className="rounded-[18px] border border-white/10 bg-[#0d1211] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image
                        src={card.image || avatarImages[index % avatarImages.length]}
                        alt={card.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-[0.85rem] font-semibold text-[#f5efe6]">{card.name}</div>
                        <div className="text-[0.52rem] uppercase tracking-[0.12em] text-[#d6d1c7]/70">{card.subtitle}</div>
                      </div>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${card.accent} text-[0.9rem] text-[#0c120f]`}>↑</div>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[1.25rem] font-semibold text-[#f0d8a4]">{card.position}</div>
                    </div>
                    <div className="text-[0.62rem] uppercase tracking-[0.12em] text-[#9cd7ba]">{card.trend}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[16px] border border-dashed border-white/10 bg-[#0c110f] px-3 py-5 text-center text-[0.62rem] uppercase tracking-[0.16em] text-[#d7d0c3]/70 md:col-span-2 xl:col-span-4">
                  Rising data will appear here once votes are recorded.
                </div>
              )}
            </div>
          </section>

          <section id="hall-of-stars" className="scroll-mt-28 rounded-[24px] border border-white/10 bg-[#090e0d] p-4 sm:p-5">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-[1.05rem] uppercase tracking-[0.18em] text-[#f0d8a4]">Discover stars</div>
              <div className="flex flex-wrap gap-2 text-[0.58rem] uppercase tracking-[0.14em] text-[#d7d0c3]/70">
                {['All', 'Today', 'Rising', 'New', 'Weekly', 'Monthly'].map((item) => (
                  <button
                    key={item}
                    className={`rounded-full px-3 py-2 ${item === 'All' ? 'border border-[#d9bd7b] bg-[#f0d8a4] text-[#0d120f]' : 'border border-white/10 bg-white/[0.02]'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {discoverData.length ? discoverData.map((card, index) => (
                <div key={`${card.name}-${index}`} className="group overflow-hidden rounded-[18px] border border-white/10 bg-[#0d1211]">
                  <div className={`relative h-52 bg-gradient-to-br ${card.bg}`}>
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,14,0.1),rgba(11,15,14,0.75))]" />
                    <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/15 px-2 py-1 text-[0.5rem] uppercase tracking-[0.16em] text-[#f7efe0] backdrop-blur-md">
                      {card.rank}
                    </div>
                    {card.image ? (
                      <Image
                        src={card.image}
                        alt={card.name}
                        width={500}
                        height={520}
                        className="absolute inset-0 h-full w-full object-cover opacity-90"
                      />
                    ) : null}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="text-[0.78rem] font-semibold text-[#f8f5f0]">{card.name}</div>
                      <div className="text-[0.56rem] uppercase tracking-[0.12em] text-[#e7ddd0]/80">{card.age}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-3">
                    <div className="text-[0.95rem] font-semibold text-[#f0d8a4]">{card.votes}</div>
                    <div className="text-[0.56rem] uppercase tracking-[0.12em] text-[#9ad3b0]">+{Math.min(99, index + 4)} today</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[16px] border border-dashed border-white/10 bg-[#0c110f] px-3 py-5 text-center text-[0.62rem] uppercase tracking-[0.16em] text-[#d7d0c3]/70 sm:col-span-2 xl:col-span-5">
                  Discover section will populate from backend members.
                </div>
              )}
            </div>
          </section>

        </main>

        <footer id="about" className="scroll-mt-28 mt-8 border-t border-white/10 px-3 pb-6 pt-5 text-[#f0e9dd]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-[#f5dca2]">
              <span className="text-lg">★</span>
              <span className="font-serif text-[1.4rem] tracking-[0.2em] text-[#f7efe0]">STARLY</span>
            </div>

            <nav className="flex flex-wrap items-center gap-4 text-[0.62rem] uppercase tracking-[0.14em] text-[#d4c7b3]/75">
              <a href="#today-star">Today&apos;s Star</a>
              <a href="#stars">Stars</a>
              <a href="#rising">Rising</a>
              <a href="#hall-of-stars">Hall of Stars</a>
              <a href="#about">About</a>
              <a href="#">Contact</a>
            </nav>

            <div className="flex items-center gap-3 text-[#f7efe0]">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.02]">f</span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.02]">◎</span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.02]">◌</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 text-[0.62rem] uppercase tracking-[0.12em] text-[#d4c9b8]/65 sm:flex-row sm:items-center sm:justify-between">
            <div>© 2026 Starly. All rights reserved.</div>
            <div className="flex gap-5">
              <span>Terms</span>
              <span>Privacy</span>
              <span>Safety</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
