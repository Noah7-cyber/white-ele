/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, IconButton, Typography, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import { invoiceDynamicEndpoints } from "@/services/invoice.service";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { getInvoiceStatus } from "@/utils/helper";
import {
  InvoicePreviewContent,
  INVOICE_STATUS_STYLES,
} from "@/modules/shared/component/InvoicePreviewModal/InvoicePreviewContent";
import { InvoiceViewMobile } from "@/modules/shared/component/InvoiceViewMobile/InvoiceViewMobile";
import { Button } from "@/modules/shared/component/Button";
import DownloadIcon from "@/modules/shared/assets/svgs/download-icon-1.svg.svg";
import client from "@/utils/client";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

export default function InvoiceViewPageContent() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = typeof params?.invoiceId === "string" ? params.invoiceId : "";
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const isMobile = useMediaQuery("(max-width:768px)");

  const invoiceQuery = useQueryService({
    service: invoiceDynamicEndpoints.getInvoiceById(invoiceId),
    options: { enabled: Boolean(invoiceId) },
  });
  const { isLoading } = invoiceQuery;
  const invoice = unwrapQueryDataBody<Record<string, any>>(invoiceQuery.data);

  const normalizeStatusLabel = (rawStatus?: string) => {
    if (!rawStatus) return "";
    return rawStatus
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
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

  const headerTitle = isMobile
    ? "Invoice"
    : invoice?.invoiceNumber
      ? `Invoice #${invoice.invoiceNumber}`
      : "Invoice";

  return (
    <div
      className={
        isMobile
          ? "flex flex-col h-[100dvh] max-h-[100dvh] min-h-0 bg-[#F5F7F9]"
          : "flex flex-col min-h-screen bg-[#F5F7F9]"
      }
    >
      <div className="shrink-0 z-10 bg-white px-4 py-3 flex items-center gap-3 border-b border-[#E4E7EC] shadow-sm">
        <IconButton
          onClick={() => router.back()}
          size="small"
          className="!p-1.5 !rounded-full !bg-[#E8F6F4] !border !border-brandColor-active/20"
        >
          <ArrowBackIcon fontSize="small" className="!text-brandColor-active" />
        </IconButton>
        <Typography className="!font-semibold !text-base !text-[#022F2F] flex-1 truncate">
          {headerTitle}
        </Typography>
        {!isMobile && invoice && (
          <Button
            className="!rounded-full !px-4 !py-1.5 !text-xs flex items-center gap-1.5"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <CircularProgress size={14} className="!text-white" />
            ) : (
              <DownloadIcon className="" />
            )}
            <span className="!text-sm !font-medium">Download</span>
          </Button>
        )}
      </div>

      <div className={`flex-1 min-h-0 overflow-y-auto px-4 py-4 ${isMobile ? "pb-24" : ""}`}>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <CircularProgress />
          </div>
        ) : invoice ? (
          isMobile ? (
            <InvoiceViewMobile invoice={invoice} status={status} />
          ) : (
            <Box className="bg-white rounded-xl shadow-sm overflow-hidden">
              <InvoicePreviewContent
                ref={invoiceRef}
                invoice={invoice}
                status={status}
                statusStyles={INVOICE_STATUS_STYLES}
              />
            </Box>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Typography className="!text-gray-400">Invoice not found</Typography>
          </div>
        )}
      </div>

      {isMobile && (
        <div className="shrink-0 fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <Button
            variant="outlined"
            className="!flex-1 !rounded-xl !bg-transparent !py-3 !border-gray-300 !text-[#022F2F] !font-medium"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            className="!flex-1 !rounded-xl !py-3 !bg-brandColor-active !text-white !font-medium flex items-center justify-center gap-2"
            onClick={handleDownloadPDF}
            disabled={isDownloading || !invoice}
            startIcon={
              isDownloading ? (
                <CircularProgress size={16} className="!text-white" />
              ) : (
                <DownloadIcon className="w-4 h-4 [&_path]:fill-current" />
              )
            }
          >
            Download PDF
          </Button>
        </div>
      )}
    </div>
  );
}
