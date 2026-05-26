"use client";

import React, { useRef, useState } from "react";
import { CustomModal } from "../CustomModal";
import { useNavigation } from "@/utils/hooks/useNavigation";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

interface ActionItem {
  label: string;
  icon?: React.ReactNode;
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
  Iconcomponent?: React.ForwardRefExoticComponent<
    {
      onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    } & React.RefAttributes<HTMLButtonElement>
  >;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  actions,
  width = 180,
  edgePadding = 60,
  classNames = "",
  buttonClassNames = "hover:bg-gray-100 w-full text-left",
  customModalclassNames = "",
  Iconcomponent,
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
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      let left = rect.right + window.scrollX;

      // Prevent overflow horizontally
      const maxLeft = window.innerWidth - width - edgePadding;
      if (left > maxLeft) {
        left = maxLeft;
      }

      // Check available space
      const modalHeight = actions.length * 46 + 16; // rough estimate: 55px per item + padding
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
    action?.(navigate);
    setOpen(false);
  };

  const isLarge = useMediaQuery("(min-width: 640px)");

  return (
    <>
      {Iconcomponent && <Iconcomponent onClick={handleOpen} ref={buttonRef} />}

      <CustomModal
        isOpen={open}
        className={customModalclassNames}
        onClose={() => setOpen(false)}
        height="fit-content"
        radius="8px"
        width={width}
        defaultTop={false}
        backdropBlur={0}
        backdropColor="rgba(0,0,0,0.03)"
        contentStyle={
          isLarge
            ? {
                top: coords.top,
                left: coords.left,
                transform: "none",
                position: "absolute",
              }
            : {}
        }
        modalStyle={{ justifyContent: "flex-start" }}
      >
        <div className={`flex flex-col gap-2 p-2 ${classNames}`}>
          {actions.map((item, idx) => (
            <div
              key={idx}
              className={`px-3 py-2 rounded text-sm cursor-pointer ${
                item.color ?? ""
              } ${buttonClassNames}`}
              onClick={() => handleAction(item.onClick)}
            >
              <button className="relative flex flex-row items-center justify-start gap-4 w-full cursor-pointer">
                {item.icon && <span className="relative top-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      </CustomModal>
    </>
  );
};
