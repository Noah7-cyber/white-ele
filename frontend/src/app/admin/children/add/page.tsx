import { ManageChildPage } from "@/modules/admin/page/ManageChildren";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Child",
};

export default function Page() {
  return <ManageChildPage />;
}
