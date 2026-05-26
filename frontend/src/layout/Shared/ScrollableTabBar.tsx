"use client";

import type { ReactNode } from "react";

type ScrollableTabBarProps = {
  children: ReactNode;
  /** Classes on the scroll container (e.g. border-b, full width). */
  className?: string;
  /** Classes on the inner flex row. */
  innerClassName?: string;
};

/**
 * Horizontal tab row that scrolls on narrow viewports instead of stretching the page.
 * Add `shrink-0 whitespace-nowrap` (or `shrink-0` for pill tabs) to each tab control.
 */
export default function ScrollableTabBar({
  children,
  className = "",
  innerClassName = "flex flex-nowrap items-center gap-2 min-w-min",
}: ScrollableTabBarProps) {
  return (
    <div
      className={`w-full max-w-full overflow-x-auto hide-scrollbar touch-pan-x ${className}`}
    >
      <div className={innerClassName}>{children}</div>
    </div>
  );
}
