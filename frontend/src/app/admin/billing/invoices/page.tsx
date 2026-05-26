import { BillingInvoice } from "@/screens/BillingInvoice";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing Invoices",
};

const Page = () => <BillingInvoice />

export default Page;