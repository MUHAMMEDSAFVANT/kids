"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

export function MemberVoteCard({
  member,
}: {
  member: {
    id: string;
    name: string;
    image_url: string;
    share_code: string;
    vote_count: number;
  };
}) {
  const [voteCount, setVoteCount] = useState(member.vote_count);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    const nextDeviceId = getDeviceId();
    setDeviceId(nextDeviceId);
    setHasVoted(getVotedMembers().includes(member.share_code));
  }, [member.share_code]);

  const handleVote = async () => {
    const nextDeviceId = deviceId || getDeviceId();
    const votedMembers = getVotedMembers();

    if (votedMembers.includes(member.share_code)) {
      setHasVoted(true);
      alert("This device has already voted for this star.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": nextDeviceId,
        },
        body: JSON.stringify({ share_code: member.share_code, device_id: nextDeviceId }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result?.alreadyVoted) {
          const nextVotedMembers = [...new Set([...votedMembers, member.share_code])];
          window.localStorage.setItem("starly-voted-members", JSON.stringify(nextVotedMembers));
          setHasVoted(true);
        }

        throw new Error(result?.error || "Unable to count the vote.");
      }

      const nextVotedMembers = [...new Set([...votedMembers, member.share_code])];
      window.localStorage.setItem("starly-voted-members", JSON.stringify(nextVotedMembers));
      setHasVoted(true);
      setVoteCount(Number(result.data.vote_count ?? 0));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to count the vote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid items-center gap-8 md:grid-cols-[320px_1fr]">
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111614]">
        <Image
          src={member.image_url}
          alt={member.name}
          width={500}
          height={500}
          className="h-[340px] w-full object-cover"
        />
      </div>

      <div className="space-y-5">
        <div className="text-[0.7rem] uppercase tracking-[0.2em] text-[#d4c9b8]/75">Starly star</div>
        <h1 className="headline-serif text-[3.2rem] leading-none tracking-[-0.04em] text-[#f7efe0]">
          {member.name}
        </h1>
        <div className="text-[0.8rem] uppercase tracking-[0.18em] text-[#f0d8a4]">Share code: {member.share_code}</div>

        <div className="rounded-[20px] border border-white/10 bg-[#0d1211] p-4">
          <div className="text-[0.56rem] uppercase tracking-[0.16em] text-[#d7d0c3]/75">Total votes</div>
          <div className="mt-2 text-[3rem] font-black leading-none text-[#f0d8a4]">{voteCount}</div>
        </div>

        <button
          type="button"
          onClick={handleVote}
          disabled={loading || hasVoted}
          className="w-full rounded-full border border-[#d7bd74] bg-[#f0d8a4] px-6 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#0d120f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Voting..." : hasVoted ? "Already voted" : `Vote for ${member.share_code} (${voteCount})`}
        </button>
      </div>
    </div>
  );
}
