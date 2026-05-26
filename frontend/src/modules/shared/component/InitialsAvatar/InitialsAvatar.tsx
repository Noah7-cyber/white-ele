"use client";

import React, { useEffect, useMemo, useState } from "react";

type InitialsAvatarProps = {
  src?: string | null;
  name?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  initialsClassName?: string;
};

const getInitials = (name?: string | null) => {
  const normalized = String(name ?? "").trim();
  if (!normalized) return "?";
  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function InitialsAvatar({
  src,
  name,
  alt,
  className = "",
  imageClassName = "",
  initialsClassName = "",
}: InitialsAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const normalizedSrc = typeof src === "string" ? src.trim() : "";
  const initials = useMemo(() => getInitials(name), [name]);

  useEffect(() => {
    setHasImageError(false);
  }, [normalizedSrc]);

  const shouldShowImage = Boolean(normalizedSrc) && !hasImageError;

  return (
    <div className={`rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}>
      {shouldShowImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={normalizedSrc}
          alt={alt ?? String(name ?? "profile")}
          className={`w-[40px] h-[40px] object-cover ${imageClassName}`}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span className={`text-gray-500 font-semibold ${initialsClassName}`}>{initials}</span>
      )}
    </div>
  );
}
