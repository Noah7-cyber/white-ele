"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import guidesCategories from "@/data/guidesData.json";
import { Box } from "@mui/material";

const POPULAR_TAGS = ["Log meals", "Daily reports", "Invoicing", "Log Nap"];

interface GuideTopic {
  icon: string;
  label: string;
  slug: string;
}

interface GuideCategory {
  id: string;
  icon: string;
  title: string;
  description: string;
  topics: GuideTopic[];
}

export default function GuidesPage() {
  const [search, setSearch] = useState("");
  const pathname = usePathname();
  const guideRoot = pathname.startsWith("/staff")
    ? "/staff/guides"
    : pathname.startsWith("/admin")
      ? "/admin/guides"
      : "/guides";

  const filtered = useMemo(() => {
    if (!search.trim()) return guidesCategories as GuideCategory[];
    const q = search.toLowerCase();
    return (guidesCategories as GuideCategory[]).filter(
      (cat) =>
        cat.title.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.topics.some((t) => t.label.toLowerCase().includes(q)),
    );
  }, [search]);

  return (
    <Box className="flex flex-col gap-0 !p-6">
      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <Box
        className="px-5 md:px-10 py-10 rounded-4xl"
        style={{
          background: "linear-gradient(135deg, #005C65 0%, #007782 100%)",
        }}
      >
        <h1 className="text-white text-2xl md:text-3xl font-extrabold mb-2">Guides</h1>
        <p className="text-white/90 text-sm md:text-base max-w-[600px] mb-6 !font-semibold leading-relaxed">
          Welcome to your academic command center. Find everything you need to curate the perfect
          learning environment.
        </p>

        {/* Search bar */}
        <Box className="flex items-center bg-white rounded-full overflow-hidden max-w-[560px] shadow-sm">
          <Box className="pl-4 pr-2 text-gray-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z"
              />
            </svg>
          </Box>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="How can we help you today?"
            className="flex-1 py-3 px-2 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          />
          <button
            className="bg-[#0d4f4f] hover:bg-[#0a3e3e] text-white text-sm font-medium px-5 py-2.5 mr-1.5 rounded-full transition-colors"
            onClick={() => {}}
          >
            Search
          </button>
        </Box>

        <Box className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-white/70 text-xs font-medium">Popular searches:</span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearch(tag)}
              className="text-xs !text-brandColor-active/90 bg-white/80 rounded-full border border-white/30 px-3 py-1 hover:bg-white/10 hover:!text-white cursor-pointer transition-colors"
            >
              {tag}
            </button>
          ))}
        </Box>
      </Box>

      {/* ── Cards Grid ──────────────────────────────────────────── */}
      <Box className=" py-6 md:py-8">
        {filtered.length === 0 ? (
          <Box className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium mb-1">No guides found</p>
            <p className="text-sm">Try searching for something else or clear the search bar.</p>
          </Box>
        ) : (
          <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((cat) => (
              <Box
                key={cat.id}
                className="bg-[#f6fbfb] border border-[#E4E7EC] rounded-2xl p-5 md:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200"
              >
                <Link
                  href={`${guideRoot}/${cat.id}`}
                  className="no-underline flex flex-col gap-4 group"
                >
                  <Box className="w-11 h-11 rounded-xl bg-white border border-[#E4E7EC] flex items-center justify-center text-xl shadow-sm">
                    {cat.icon}
                  </Box>

                  <Box>
                    <h3 className="text-[#101828] !text-base font-bold mb-1 group-hover:text-[#00897B] transition-colors">{cat.title}</h3>
                    <p className="text-[#475467] !text-xs leading-relaxed">{cat.description}</p>
                  </Box>
                </Link>

                <Box className="flex flex-col gap-2.5 mt-1">
                  {cat.topics.map((topic) => (
                    <Box
                      key={topic.slug}
                      className="flex items-center gap-2 text-sm text-[#344054] hover:text-[#00897B] transition-colors no-underline group"
                    >
                      <span className="!font-medium !text-xs">{topic.icon}</span>
                      <span className="!font-medium !text-xs">{topic.label}</span>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
