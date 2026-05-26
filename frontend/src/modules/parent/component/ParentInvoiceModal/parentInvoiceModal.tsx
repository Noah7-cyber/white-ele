/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DialogTitle, DialogContent, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { motion } from "framer-motion";
import { Button } from "../../../shared/component/Button";
import DownloadIcon from "@/modules/shared/assets/svgs/download-icon-1.svg.svg";
import { DataRenderer } from "../../../shared/component/DataRenderer";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import client from "@/utils/client";
import { showToast } from "@/modules/shared/component/Toast";
import { capitalizeFirstLetter } from "@/utils/helpers";
import Image from "next/image";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import { invoiceDynamicEndpoints } from "@/services/invoice.service";
import { getInvoiceStatus } from "@/utils/helper";
import { InvoicePreviewContent } from "@/modules/shared/component/InvoicePreviewModal/InvoicePreviewContent";

export default function ParentInvoiceModal() {
  const { closeModal } = useModalRoute();
  const searchParams = useSearchParams();

  const invoiceId = searchParams.get("invoiceId");

  const invoiceQuery = useQueryService({
    service: invoiceId
      ? invoiceDynamicEndpoints.getInvoiceById(invoiceId)
      : { path: "", method: "GET" as const },
    options: {
      keys: ["invoice", invoiceId || ""],
      enabled: !!invoiceId,
    },
  });
  const { isLoading } = invoiceQuery;
  const invoice = unwrapQueryDataBody<Record<string, any>>(invoiceQuery.data);

  const status = getInvoiceStatus({
    total: +invoice?.total,
    balance: +invoice?.balance,
    dueDate: invoice?.dueDate,
  });

  const invoiceRef = useRef<HTMLDivElement>(null);
  const handleDownloadPDF = async () => {
    try {
      const id = invoiceId || invoice?.id;
      if (!id) return;

      const blobUrl = await client.request({
        ...invoiceDynamicEndpoints.downloadInvoicePdf(id),
        options: { isPdf: true },
      });

      const a = document.createElement("a");
      a.href = blobUrl as string;
      a.download = `Invoice-${invoice?.invoiceNumber || id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(blobUrl as string);

      showToast({
        message: "Invoice downloaded successfully",
        severity: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      showToast({
        message: "Failed to download invoice",
        severity: "error",
        duration: 3000,
      });
    }
  };

  return (
    <>
      <DialogTitle className="flex justify-end items-start px-6 py-4">
        
        {/* <WhitepenguinLogo /> */}
        <IconButton onClick={() => closeModal()}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className="px-6 pb-6 !min-h-[50vh] min-w-[55vw] max-h-[80vh] overflow-y-auto">
        <DataRenderer isLoading={isLoading} isEmpty={!invoice}>
          {() => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <InvoicePreviewContent
                ref={invoiceRef}
                invoice={invoice}
                status={capitalizeFirstLetter(status)}
              />

              {/* FOOTER BUTTONS */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  className="!bg-transparent !text-[#022F2F] !rounded-md !border !border-[#D0D5DD]"
                  onClick={() => closeModal()}
                >
                  Cancel
                </Button>

                <Button className="flex items-center gap-2 !rounded-md" onClick={handleDownloadPDF}>
                  <DownloadIcon />
                  <span>Download PDF</span>
                </Button>
              </div>
            </motion.div>
          )}
        </DataRenderer>
      </DialogContent>
    </>
  );
}
