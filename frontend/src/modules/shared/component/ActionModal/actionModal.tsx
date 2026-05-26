/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useRef, useState, useEffect } from "react";
import { CustomModal } from "../CustomModal";
import { useNavigation } from "@/utils/hooks/useNavigation";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

interface ActionItem {
  label: string;
  onClick: (navigate: ReturnType<typeof useNavigation>) => void;
  ref?: React.Ref<HTMLButtonElement>;
  color?: string;
}

interface ActionModalProps {
  actions: ActionItem[];
  width?: number;
  edgePadding?: number;
  classNames?: string;
  buttonClassNames?: string;
  customModalclassNames?: string;
  Iconcomponent?: (props: {
    onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    ref?: React.Ref<HTMLButtonElement>;
  }) => React.ReactNode;
  externalTrigger?: React.RefObject<HTMLButtonElement | null>;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  actions,
  width = 180,
  edgePadding = 40,
  classNames = "",
  buttonClassNames = "hover:bg-gray-100 w-full text-left",
  customModalclassNames = "!cursor-pointer",
  Iconcomponent,
  externalTrigger,
}) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigation();

  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    const triggerElement = externalTrigger?.current ?? buttonRef.current;
    if (triggerElement) {
      const rect = triggerElement.getBoundingClientRect();
      let left = rect.left + window.scrollX;
      const modalHeight = actions.length * 34 + 16; // same estimate
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top: number;

      // Fit horizontally within screen width
      const maxLeft = window.innerWidth - width - edgePadding;
      if (left > maxLeft) {
        left = maxLeft;
      }

      // Position above or below depending on space
      if (spaceBelow < modalHeight && spaceAbove > modalHeight) {
        top = rect.top + window.scrollY - modalHeight;
      } else {
        top = rect.bottom + window.scrollY;
      }

      setCoords({ top, left });
    } else if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      let left = rect.right + window.scrollX;

      // Prevent overflow horizontally
      const maxLeft = window.innerWidth - width - edgePadding;
      if (left > maxLeft) {
        left = maxLeft;
      }

      // Check available space
      const modalHeight = actions.length * 34 + 16; // rough estimate: 34px per item + padding
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top: number;

      if (spaceBelow < modalHeight && spaceAbove > modalHeight) {
        top = rect.top + window.scrollY - modalHeight;
      } else {
        top = rect.bottom + window.scrollY;
      }
      setCoords({ top, left });
    }
    setOpen(true);
  };

  const handleAction = (action: ActionItem["onClick"]) => {
    action(navigate);
    setOpen(false);
  };

  const isLarge = useMediaQuery("(min-width: 640px)");

  useEffect(() => {
    if (externalTrigger?.current) {
      const btn = externalTrigger.current;
      const handleNativeClick = (event: MouseEvent) => {
        handleOpen(event as unknown as React.MouseEvent<HTMLElement>);
      };
      btn.addEventListener("click", handleNativeClick);
      return () => btn.removeEventListener("click", handleNativeClick);
    }
  }, [externalTrigger, handleOpen]);

  return (
    <>
      {Iconcomponent ? <Iconcomponent onClick={handleOpen} ref={buttonRef} /> : <></>}

      <CustomModal
        isOpen={open}
        className={customModalclassNames}
        onClose={() => setOpen(false)}
        height="fit-content"
        radius="8px"
        width={width}
        defaultTop={false}
        backdropBlur={0}
        anchorRef={externalTrigger}
        position="anchor"
        contentStyle={
          isLarge
            ? {
                top: coords.top,
                left: coords.left,
                transform: "translate(15%)",
                position: "absolute",
              }
            : {}
        }
        modalStyle={{ justifyContent: "flex-start" }}
      >
        <div className={`flex flex-col gap-1 p-2 ${classNames}`}>
          {actions.map((item, idx) => (
            <button
              key={idx}
              className={`px-4 py-2.5 rounded text-sm cursor-pointer ${item.color ?? ""} ${buttonClassNames}`}
              onClick={() => handleAction(item.onClick)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </CustomModal>
    </>
  );
};
