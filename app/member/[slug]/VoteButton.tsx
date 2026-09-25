"use client";

import { useState } from "react";

export function VoteButton({ shareCode, initialVotes }: { shareCode: string; initialVotes: number }) {
  const [voteCount, setVoteCount] = useState(initialVotes);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ share_code: shareCode }),
      });

      const result = await response.json();

      if (!response.ok || !result?.data) {
        throw new Error(result?.error || "Unable to count the vote.");
      }

      setVoteCount(Number(result.data.vote_count ?? 0));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to count the vote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={loading}
      className="rounded-full border border-[#d7bd74] bg-[#f0d8a4] px-6 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#0d120f] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Voting..." : `Vote for ${shareCode} (${voteCount})`}
    </button>
  );
}
