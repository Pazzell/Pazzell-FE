"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/** The topics whose name or description contains every word typed, in any case. */
export function filterTopics<T extends { name: string; description?: string | null }>(
  topics: T[],
  search: string
): T[] {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return topics;
  return topics.filter((topic) => {
    const text = `${topic.name} ${topic.description ?? ""}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

interface TopicSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function TopicSearch({ value, onChange }: TopicSearchProps) {
  return (
    <div className="relative max-w-md">
      <Search className="h-4 w-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <Input
        type="search"
        aria-label="Search topics"
        placeholder="Search topics"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-white/5 border-white/10 text-white pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
