"use client";

import React from "react";

import classNames from "classnames";

import { Modal } from "../modal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ClearIcon from "@/modules/shared/assets/svgs/clear-icon.svg";
import { ModalRoute, modalLayouts } from "@/routes/modalRoutes";

export const ModalProvider = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const modalKey = searchParams.get("modal") as keyof typeof modalLayouts;

  const onDismiss = () => {
    if (modalLayouts?.[modalKey]?.isKeepOpen) return;
    const params = new URLSearchParams(searchParams.toString());

    params.delete("modal");
    if (
      modalKey === ModalRoute.invoiceReceipt ||
      modalKey === ModalRoute.parentInvoiceReceipt ||
      modalKey === ModalRoute.sendInvoice
    ) {
      params.delete("invoiceId");
    }
    router.replace(`${pathname}?${params}`);
  };

  const modalProps = modalLayouts?.[modalKey]?.modalProps || {}

  return (
    <Modal
      isOpen={!!(modalKey && modalLayouts[modalKey])}
      onClose={onDismiss}
      className={classNames("rounded-[10px] max-h-[99vh] flex flex-col")}
      {...modalProps}
    >
      {modalLayouts[modalKey]?.hasCloseIcon && (
        <ClearIcon onClick={onDismiss} className="absolute right-5 top-5" />
      )}
      <div className={classNames("overflow-y-auto flex-1")}>
        {modalLayouts?.[modalKey]?.component}
      </div>
    </Modal>
  );
};
