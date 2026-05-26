/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DialogTitle, DialogContent, IconButton, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { motion } from "framer-motion";
import { Button } from "../Button";
import DownloadIcon from "@/modules/shared/assets/svgs/download-icon-1.svg.svg";
import { DataRenderer } from "../DataRenderer";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import { useSearchParams } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import { invoiceDynamicEndpoints } from "@/services/invoice.service";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { getInvoiceStatus } from "@/utils/helper";
import { useRef, useState } from "react";
import client from "@/utils/client";
import { InvoicePreviewContent, INVOICE_STATUS_STYLES } from "./InvoicePreviewContent";

export default function InvoicePreviewModal() {
  const { closeModal } = useModalRoute();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const invoiceRef = useRef<HTMLDivElement>(null);

  const invoiceQuery = useQueryService({
    service: invoiceDynamicEndpoints.getInvoiceById(invoiceId as string),
  });
  const { isLoading } = invoiceQuery;
  const invoice = unwrapQueryDataBody<Record<string, any>>(invoiceQuery.data);

  const normalizeStatusLabel = (rawStatus?: string) => {
    if (!rawStatus) return "";
    const withSpaces = rawStatus.replace(/_/g, " ").toLowerCase();
    return withSpaces
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const status =
    normalizeStatusLabel(invoice?.status) ||
    capitalizeFirstLetter(
      getInvoiceStatus({
        total: +invoice?.total,
        balance: +invoice?.balance,
        dueDate: invoice?.dueDate,
      }),
    );

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
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
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  return (
    <>
      <DialogTitle className="flex justify-end items-start px-6 py-4 absolute w-full ">
        <IconButton className="!bg-white" onClick={() => closeModal()}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className="px-6 pb-6 !min-h-[50vh] max-h-[90vh] min-w-[55vw]">
        <DataRenderer isLoading={isLoading} isEmpty={!invoice}>
          {() => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white"
            >
              <InvoicePreviewContent
                ref={invoiceRef}
                invoice={invoice}
                status={status}
                statusStyles={INVOICE_STATUS_STYLES}
              />

              <div className="mt-4 flex justify-end gap-3">
                <Button
                  className="!bg-transparent !text-[#022F2F] !rounded-md !border !border-[#D0D5DD]"
                  onClick={() => closeModal()}
                >
                  Cancel
                </Button>
                <Button className="flex items-center gap-2 !rounded-md" onClick={handleDownloadPDF}>
                  <DownloadIcon />
                  <span className="flex items-center gap-2">
                    {isDownloading && <CircularProgress size={18} className="!text-white" />}
                    Download PDF
                  </span>
                </Button>
              </div>
            </motion.div>
          )}
        </DataRenderer>
      </DialogContent>
    </>
  );
}
