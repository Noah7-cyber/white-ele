"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search by ID, Name, or Subject",
}: SearchBarProps) {
  return (
    <div className="relative w-64">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-full border border-gray-300 pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
    </div>
  );
}
