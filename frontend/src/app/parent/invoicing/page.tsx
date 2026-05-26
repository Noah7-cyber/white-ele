import { Metadata } from "next";
import { ParentInvoicingPage } from "@/modules/parent/page/Invoicing/invoicing";

export const metadata: Metadata = {
  title: "Invoices",
};

export default function InvoicingPage() {
  return <ParentInvoicingPage />;
}
