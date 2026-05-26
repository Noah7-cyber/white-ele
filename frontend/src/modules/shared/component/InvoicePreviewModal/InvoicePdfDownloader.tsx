"use client";

import { useEffect } from "react";
import client from "@/utils/client";
import { invoiceDynamicEndpoints } from "@/services/invoice.service";

interface InvoicePdfDownloaderProps {
  invoiceId: string | number | null;
  onComplete: () => void;
}

export function InvoicePdfDownloader({ invoiceId, onComplete }: InvoicePdfDownloaderProps) {
  useEffect(() => {
    if (!invoiceId) return;

    let isMounted = true;

    const downloadPdf = async () => {
      try {
        const blobUrl = await client.request({
          ...invoiceDynamicEndpoints.downloadInvoicePdf(invoiceId),
          options: { isPdf: true },
        });

        if (isMounted) {
          const a = document.createElement("a");
          a.href = blobUrl as string;
          a.download = `Invoice-${invoiceId}.pdf`;
          a.click();
          window.URL.revokeObjectURL(blobUrl as string);
        }
      } catch (error) {
        console.error("Error downloading PDF:", error);
      } finally {
        if (isMounted) {
          onComplete();
        }
      }
    };

    downloadPdf();

    return () => {
      isMounted = false;
    };
  }, [invoiceId, onComplete]);

  return null;
}
