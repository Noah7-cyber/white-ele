"use client";

import { LayoutGrid, List, Plus } from "lucide-react";

interface ActionButtonsProps {
  onGridClick?: () => void;
  onListClick?: () => void;
  onAddClick?: () => void;
}

export default function ActionButtons({
  onGridClick,
  onListClick,
  onAddClick,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-3">
      <button
        className="p-2 rounded-full border border-gray-300 bg-yellow-500 hover:bg-blue-600"
        title="Grid View"
        onClick={onGridClick}
      >
        <LayoutGrid className="w-5 h-5 text-gray-600" />
      </button>
      <button
        className="p-2 rounded-full border border-gray-300 bg-yellow-500 hover:bg-blue-600"
        title="List View"
        onClick={onListClick}
      >
        <List className="w-5 h-5 text-gray-600" />
      </button>
      <button
        className="p-2 rounded-full bg-yellow-500 text-white hover:bg-blue-600"
        title="Add Classroom"
        onClick={onAddClick}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
