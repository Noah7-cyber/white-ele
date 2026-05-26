"use client";

import { useParams, useRouter } from "next/navigation";
import { MobileInvoiceDetail } from "@/modules/admin/component/MobileInvoiceCard";

const ParentInvoiceDetailPage = () => {
  const { invoiceId } = useParams();
  const router = useRouter();

  return (
    <MobileInvoiceDetail
      invoiceId={invoiceId as string}
      onBack={() => router.back()}
    />
  );
};

export default ParentInvoiceDetailPage;
