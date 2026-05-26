import { ReactNode } from "react";

import { DropdownOptionProps, DropdownValue } from "@/modules/shared/component/Dropdown";
import { DEFAULT_DROPDOWN_MAX_HEIGHT } from "@/constants";

export function getDialogRenderPosition({
  rect,
  dialogWidth,
  dialogHeight,
  alignDialog = {},
  offset: dialogOffset = {},
}: {
  dialogWidth: number;
  dialogHeight: number;
  offset?: {
    vertical?: number;
    horizontal?: number;
  };
  alignDialog?: {
    vertical?: "top" | "bottom" | "center" | "screen";
    horizontal?: "left" | "right" | "center" | "screen";
  };
  rect: DOMRect;
}) {
  const { vertical: offsetVertical = 8, horizontal: offsetHorizontal = 4.1 } = dialogOffset;
  const { vertical: alignVertical = "bottom", horizontal: alignHorizontal = "center" } =
    alignDialog;

  // const rect = event.currentTarget.getBoundingClientRect();
  const centerOffsetY = (rect.height - dialogHeight) / 2;
  const centerOffsetX =
    rect.width > dialogWidth ? (rect.width - dialogWidth) / 2 : -((dialogWidth - rect.width) / 2);

  let left: number | undefined;
  let right: number | undefined;
  let top: number | undefined;
  let bottom: number | undefined;

  const horizontalPositionMap: Record<string, number | undefined> = {
    left: rect.left - dialogWidth - offsetHorizontal,
    right: rect.right + offsetHorizontal,
    screen: undefined,
    center: rect.left + centerOffsetX + (offsetHorizontal === 4.1 ? 0 : offsetHorizontal),
  };

  left = horizontalPositionMap[alignHorizontal];

  if ((left || 0) + dialogWidth > window.innerWidth) {
    right = 16;
    left = undefined;
  }

  const verticalPositionMap: Record<string, number | undefined> = {
    top: rect.top - dialogHeight - offsetVertical,
    bottom: rect.bottom + offsetVertical,
    center: rect.top + centerOffsetY + offsetVertical,
    screen: undefined,
  };

  top = verticalPositionMap[alignVertical];

  if ((top || 0) + dialogHeight > window.innerHeight) {
    bottom = 16;
    top = undefined;
  }

  return { top, left, right, bottom };
}

export function getDropdownHeight<T extends DropdownValue>(
  options: DropdownOptionProps<T>,
  hasSearch?: boolean,
  maxHeight?: number,
  title?: ReactNode,
) {
  if (maxHeight) return maxHeight;

  const optionsHeight = options?.length * 48;

  if (hasSearch && title) {
    return optionsHeight + 140 > DEFAULT_DROPDOWN_MAX_HEIGHT
      ? DEFAULT_DROPDOWN_MAX_HEIGHT
      : optionsHeight + 160;
  }
  if (hasSearch) {
    return optionsHeight + 80 > DEFAULT_DROPDOWN_MAX_HEIGHT
      ? DEFAULT_DROPDOWN_MAX_HEIGHT
      : optionsHeight;
  }

  return optionsHeight > DEFAULT_DROPDOWN_MAX_HEIGHT
    ? DEFAULT_DROPDOWN_MAX_HEIGHT
    : optionsHeight + 20;
}
