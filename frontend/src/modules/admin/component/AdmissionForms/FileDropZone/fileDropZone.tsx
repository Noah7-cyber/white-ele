"use client";

import Image from "next/image";
import React, { useCallback, useMemo, useRef, useState } from "react";

const FileDropZone = ({
  accept,
  label,
  value,
  onChange,
  error,
}: {
  accept: string;
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onChange(file);
    },
    [onChange],
  );

  const handleClick = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
  };

  const preview = useMemo(() => {
    if (!value) return null;
    if (value.type.startsWith("image/")) {
      return URL.createObjectURL(value);
    }
    return null;
  }, [value]);

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? "border-blue-500 bg-blue-50" : error ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {value ? (
          <div className="flex flex-col items-center gap-2">
            {preview ? (
              <div className="relative w-32 h-32 rounded-md overflow-hidden">
                <Image src={preview} alt="Preview" fill className="object-cover" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="truncate max-w-50">{value.name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="cursor-pointer text-xs text-badge-red hover:text-badge-red/80 mt-1"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-xs text-gray-400">Click or drag and drop</p>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default FileDropZone;
