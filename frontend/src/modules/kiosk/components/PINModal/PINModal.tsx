"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Modal } from "@/modules/shared/component/modal";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import DeletePinIcon from "@/modules/shared/assets/svgs/delete-pin.svg";
import CheckPinIcon from "@/modules/shared/assets/svgs/confirm-pin.svg";
import { KioskTeacher } from "../TeachersKiosk/hooks/useTeachersKiosk";

interface PINModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: KioskTeacher | null;
  onPINConfirm: (pin: string) => void;
  onForgotPin?: () => void;
}

const PINModal: React.FC<PINModalProps> = ({ isOpen, onClose, teacher, onPINConfirm, onForgotPin }) => {
  const [pin, setPin] = useState<string[]>(Array(4).fill(""));
  const [isConfirming, setIsConfirming] = useState(false);
  const maxPinLength = 4;

  const handleNumberClick = useCallback((num: string) => {
    if (isConfirming) return;
    const emptyIndex = pin.findIndex((digit) => digit === "");
    if (emptyIndex !== -1) {
      const newPin = [...pin];
      newPin[emptyIndex] = num;
      setPin(newPin);
    }
  }, [isConfirming, pin]);

  const handleBackspace = useCallback(() => {
    if (isConfirming) return;
    const lastFilledIndex = pin.findLastIndex((digit) => digit !== "");
    if (lastFilledIndex !== -1) {
      const newPin = [...pin];
      newPin[lastFilledIndex] = "";
      setPin(newPin);
    }
  }, [isConfirming, pin]);

  const handleConfirm = useCallback(async (enteredPin?: string) => {
    const pinToCheck = enteredPin || pin.join("");
    if (pinToCheck.length < 4 || pinToCheck.length > maxPinLength || isConfirming) return;
    setIsConfirming(true);
    try {
      await Promise.resolve(onPINConfirm(pinToCheck));
      setPin(Array(maxPinLength).fill(""));
    } finally {
      setIsConfirming(false);
    }
  }, [isConfirming, maxPinLength, onPINConfirm, pin]);

  const handleClose = () => {
    setPin(Array(maxPinLength).fill(""));
    onClose();
  };

  useEffect(() => {
    if (teacher) {
      setPin(Array(maxPinLength).fill(""));
    }
  }, [teacher, maxPinLength]);

  useEffect(() => {
    if (!isOpen || !teacher) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isConfirming) return;

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        handleNumberClick(event.key);
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        handleBackspace();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleBackspace, handleConfirm, handleNumberClick, isConfirming, isOpen, pin, teacher]);

  if (!teacher) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-[92vw] max-w-[340px] rounded-xl md:max-w-[420px]">
      <Box className="flex max-h-[85dvh] flex-col gap-3 overflow-y-auto p-3 md:gap-4 md:p-5">
        {/* Modal Header */}
        <Box className="flex items-center justify-between pb-3 px-2 md:px-0">
          <Typography className="text-base! font-semibold! text-gray-800!">Enter PIN</Typography>
          <button
            onClick={handleClose}
            className="cursor-pointer"
            aria-label="Close modal"
            title="Close"
          >
            <CloseIcon />
          </button>
        </Box>

        {/* PIN Input Fields */}
        <Box className="mb-1 flex flex-wrap justify-center gap-2 md:mb-2 md:gap-3">
          {pin.map((digit, index) => (
            <div
              key={index}
              className={`flex h-11 w-10 items-center justify-center rounded-lg border-2 text-base font-semibold md:h-14 md:w-12 md:text-xl ${
                digit
                  ? "border-[#008080] bg-[#008080]/5 text-gray-800"
                  : "border-[#0250504D] bg-white"
              }`}
            >
              {digit ? "•" : ""}
            </div>
          ))}
        </Box>

        {/* Numeric Keypad */}
        <Box className="mx-auto grid w-full max-w-[252px] grid-cols-3 justify-items-center gap-2 md:max-w-[320px] md:gap-3">
          {/* Numbers 1-9 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumberClick(num.toString())}
              disabled={isConfirming}
              className="flex h-12 w-full max-w-[78px] cursor-pointer items-center justify-center rounded-xl border border-[#001F1FB2] bg-white text-lg font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 md:h-16 md:max-w-[96px] md:rounded-2xl md:text-2xl"
            >
              {num}
            </button>
          ))}

          {/* Backspace, 0, Confirm */}
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isConfirming}
            className="flex h-12 w-full max-w-[78px] cursor-pointer items-center justify-center rounded-xl bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 md:h-16 md:max-w-[96px] md:rounded-2xl"
            aria-label="Backspace"
            title="Backspace"
          >
            <DeletePinIcon />
          </button>
          <button
            type="button"
            onClick={() => handleNumberClick("0")}
            disabled={isConfirming}
            className="flex h-12 w-full max-w-[78px] cursor-pointer items-center justify-center rounded-xl border border-[#001F1FB2] bg-white text-lg font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 md:h-16 md:max-w-[96px] md:rounded-2xl md:text-2xl"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleConfirm()}
            disabled={isConfirming}
            className="flex h-12 w-full max-w-[78px] min-h-[44px] cursor-pointer items-center justify-center rounded-xl bg-[#008080] font-semibold text-white transition-colors hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-[#008080] md:h-16 md:max-w-[96px] md:rounded-2xl"
            aria-label="Confirm"
            title="Confirm"
          >
            {isConfirming ? (
              <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckPinIcon />
            )}
          </button>
        </Box>

        {/* Forgot PIN Link */}
        {onForgotPin ? (
          <Box className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onForgotPin}
              className="text-xs! text-gray-500! hover:text-gray-700! transition-colors cursor-pointer"
            >
              Forgot PIN?
            </button>
          </Box>
        ) : null}
      </Box>
    </Modal>
  );
};

export default PINModal;
