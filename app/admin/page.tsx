"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type AdminMember = {
  id: string;
  name: string;
  image_url: string;
  share_code: string;
  vote_count: number;
  created_at: string;
};

const ADMIN_PASSWORD = "1234";
const WINNER_PHOTOS_STORAGE_KEY = "starly-home-winner-photos";
const MAX_WINNER_PHOTOS = 3;
const CLOUDINARY_CLOUD_NAME = "dmjmtv7kj";
const CLOUDINARY_UPLOAD_PRESET = "profile_upload";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

type WinnerPhoto = {
  id: string;
  url: string;
  expiresAt: string;
  durationDays: number;
  createdAt: string;
};

const getStoredWinnerPhotos = () => {
  if (typeof window === "undefined") {
    return [] as WinnerPhoto[];
  }

  try {
    const raw = window.localStorage.getItem(WINNER_PHOTOS_STORAGE_KEY);
    if (!raw) {
      return [] as WinnerPhoto[];
    }

    const parsed = JSON.parse(raw) as WinnerPhoto[];
    const active = Array.isArray(parsed) ? parsed.filter((item) => item?.url && new Date(item.expiresAt).getTime() > Date.now()) : [];
    if (active.length !== parsed.length) {
      window.localStorage.setItem(WINNER_PHOTOS_STORAGE_KEY, JSON.stringify(active));
    }
    return active;
  } catch {
    return [] as WinnerPhoto[];
  }
};

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [winnerPhotos, setWinnerPhotos] = useState<WinnerPhoto[]>([]);
  const [winnerPhotoDays, setWinnerPhotoDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("starly-admin-auth");
    if (saved === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted admin auth after client hydration
      setIsLoggedIn(true);
    }

    setWinnerPhotos(getStoredWinnerPhotos());
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const loadMembers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/members");
        const result = await response.json();

        if (!response.ok || !Array.isArray(result?.data)) {
          throw new Error(result?.error || "Unable to load members.");
        }

        setMembers(result.data ?? []);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Unable to load members.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMembers();
  }, [isLoggedIn]);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem("starly-admin-auth", "true");
      setIsLoggedIn(true);
      setStatus("Admin login successful.");
      return;
    }

    setStatus("Invalid admin password.");
  };

  const handleLogout = () => {
    window.localStorage.removeItem("starly-admin-auth");
    setIsLoggedIn(false);
    setPassword("");
    setMembers([]);
    setStatus("Logged out.");
  };

  const handleDelete = async (memberId: string) => {
    const confirmed = window.confirm("Delete this member?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: memberId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Unable to delete member.");
      }

      setMembers((current) => current.filter((member) => member.id !== memberId));
      setStatus("Member deleted.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  const handleSave = async (member: AdminMember) => {
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: member.id,
          name: member.name,
          image_url: member.image_url,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Unable to update member.");
      }

      setMembers((current) => current.map((item) => (item.id === member.id ? result.data : item)));
      setStatus("Member updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Update failed.");
    }
  };

  const uploadBanner = async (memberId: string, file: File | null) => {
    if (!file) {
      return;
    }

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
        throw new Error(result?.error?.message || "Banner upload failed.");
      }

      const updatedMember = { ...members.find((member) => member.id === memberId), image_url: result.secure_url };
      if (!updatedMember.id) {
        return;
      }

      await handleSave(updatedMember as AdminMember);
      setStatus("Banner uploaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Banner upload failed.");
    }
  };

  const uploadWinnerPhoto = async (file: File | null) => {
    if (!file) {
      return;
    }

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
        throw new Error(result?.error?.message || "Winner photo upload failed.");
      }

      const nextPhotos = getStoredWinnerPhotos();
      const nextWinnerPhoto = {
        id: `winner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url: result.secure_url,
        expiresAt: new Date(Date.now() + winnerPhotoDays * 24 * 60 * 60 * 1000).toISOString(),
        durationDays: winnerPhotoDays,
        createdAt: new Date().toISOString(),
      };

      const updatedPhotos = [...nextPhotos, nextWinnerPhoto].slice(-MAX_WINNER_PHOTOS);
      setWinnerPhotos(updatedPhotos);
      window.localStorage.setItem(WINNER_PHOTOS_STORAGE_KEY, JSON.stringify(updatedPhotos));
      setStatus(`Winner photo added for ${winnerPhotoDays} days.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Winner photo upload failed.");
    }
  };

  const deleteWinnerPhoto = (photoId: string) => {
    const nextPhotos = winnerPhotos.filter((photo) => photo.id !== photoId);
    setWinnerPhotos(nextPhotos);
    window.localStorage.setItem(WINNER_PHOTOS_STORAGE_KEY, JSON.stringify(nextPhotos));
    setStatus("Winner photo deleted.");
  };

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b09] p-4 text-[#f3efe6]">
        <div className="w-full max-w-md rounded-[28px] border border-[#d7bd74]/30 bg-[#0d1211] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          <div className="mb-5 text-center text-[0.72rem] uppercase tracking-[0.22em] text-[#f0d8a4]">
            Admin login
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-[0.68rem] uppercase tracking-[0.16em] text-[#d7d0c3]/75">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                className="mt-2 w-full rounded-full border border-white/10 bg-[#121914] px-4 py-3 text-base text-[#f5efe6] outline-none placeholder:text-[#d7d0c3]/50 focus:border-[#f0d8a4]"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-full border border-[#d7bd74] bg-[#f0d8a4] px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#0d120f]"
            >
              Login
            </button>
          </form>

          {status ? (
            <div className="mt-4 rounded-full border border-[#d7bd74]/30 bg-[#121914] px-3 py-2 text-center text-[0.58rem] uppercase tracking-[0.12em] text-[#f5efe6]">
              {status}
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b09] px-4 py-8 text-[#f3efe6]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[#f0d8a4]">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f7efe0]">All created users</h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/10 bg-[#111613] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#f5efe6]"
          >
            Logout
          </button>
        </div>

        {status ? (
          <div className="mb-5 rounded-full border border-[#d7bd74]/30 bg-[#121914] px-4 py-2 text-center text-[0.58rem] uppercase tracking-[0.12em] text-[#f5efe6]">
            {status}
          </div>
        ) : null}

        <div className="mb-6 overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1211] p-4">
          <div className="mb-4 text-[0.62rem] uppercase tracking-[0.18em] text-[#f0d8a4]">Homepage winner photos</div>
          <div className="mb-4 grid gap-4 md:grid-cols-[1fr_220px] md:items-center">
            <div className="space-y-2">
              <label className="block text-[0.58rem] uppercase tracking-[0.16em] text-[#d7d0c3]/75">
                Validity
                <select
                  value={winnerPhotoDays}
                  onChange={(event) => setWinnerPhotoDays(Number(event.target.value))}
                  className="mt-2 w-full rounded-full border border-white/10 bg-[#121914] px-3 py-2 text-[0.8rem] text-[#f5efe6] outline-none focus:border-[#f0d8a4]"
                >
                  <option value={15}>15 days</option>
                  <option value={30}>30 days</option>
                </select>
              </label>
              <label className="block text-[0.58rem] uppercase tracking-[0.16em] text-[#d7d0c3]/75">
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => uploadWinnerPhoto(event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full rounded-full border border-dashed border-white/10 bg-[#121914] px-3 py-2 text-[0.62rem] text-[#f5efe6] file:mr-3 file:rounded-full file:border-0 file:bg-[#f0d8a4] file:px-3 file:py-2 file:text-[0.52rem] file:font-semibold file:uppercase file:tracking-[0.12em] file:text-[#0d120f]"
                />
              </label>
            </div>
            <div className="text-[0.56rem] uppercase tracking-[0.12em] text-[#d7d0c3]/70">
              Max {MAX_WINNER_PHOTOS} active photos
            </div>
          </div>

          {winnerPhotos.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {winnerPhotos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-[18px] border border-white/10 bg-[#111613]">
                  <Image src={photo.url} alt="Winner upload" width={500} height={300} className="h-36 w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 px-3 py-2 text-[0.56rem] uppercase tracking-[0.12em] text-[#d7d0c3]">
                    <span>{photo.durationDays} days</span>
                    <button
                      type="button"
                      onClick={() => deleteWinnerPhoto(photo.id)}
                      className="rounded-full border border-[#d7bd74]/30 bg-[#121914] px-2 py-1 text-[#f5efe6]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-white/10 bg-[#121914] p-6 text-center text-[0.62rem] uppercase tracking-[0.18em] text-[#d7d0c3]/70">
              No winner photos uploaded yet.
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-[24px] border border-white/10 bg-[#0d1211] p-8 text-center text-[#d7d0c3]">
            Loading users...
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0d1211] p-8 text-center text-[#d7d0c3]/80">
            No users found.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <div key={member.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1211] p-4">
                <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[#111613]">
                  {member.image_url ? (
                    <Image
                      src={member.image_url}
                      alt={member.name}
                      width={900}
                      height={260}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-[#121914] text-[0.62rem] uppercase tracking-[0.18em] text-[#d7d0c3]/70">
                      No banner
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block text-[0.58rem] uppercase tracking-[0.16em] text-[#d7d0c3]/75">
                    Name
                    <input
                      value={member.name}
                      onChange={(event) =>
                        setMembers((current) =>
                          current.map((item) =>
                            item.id === member.id ? { ...item, name: event.target.value } : item,
                          ),
                        )
                      }
                      className="mt-2 w-full rounded-full border border-white/10 bg-[#121914] px-3 py-2 text-[0.82rem] text-[#f5efe6] outline-none focus:border-[#f0d8a4]"
                    />
                  </label>

                  <label className="block text-[0.58rem] uppercase tracking-[0.16em] text-[#d7d0c3]/75">
                    Share code
                    <div className="mt-2 rounded-full border border-white/10 bg-[#121914] px-3 py-2 text-[0.72rem] text-[#f0d8a4]">
                      {member.share_code}
                    </div>
                  </label>

                  <label className="block text-[0.58rem] uppercase tracking-[0.16em] text-[#d7d0c3]/75">
                    Banner image upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => uploadBanner(member.id, event.target.files?.[0] ?? null)}
                      className="mt-2 block w-full rounded-full border border-dashed border-white/10 bg-[#121914] px-3 py-2 text-[0.62rem] text-[#f5efe6] file:mr-3 file:rounded-full file:border-0 file:bg-[#f0d8a4] file:px-3 file:py-2 file:text-[0.52rem] file:font-semibold file:uppercase file:tracking-[0.12em] file:text-[#0d120f]"
                    />
                  </label>

                  <div className="flex items-center justify-between text-[0.62rem] uppercase tracking-[0.16em] text-[#d4c9b8]/70">
                    <span>Votes</span>
                    <span>{member.vote_count}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSave(member)}
                      className="rounded-full border border-[#d7bd74] bg-[#f0d8a4] px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#0d120f]"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(member.id)}
                      className="rounded-full border border-[#d7bd74]/30 bg-[#111613] px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#f5efe6]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
