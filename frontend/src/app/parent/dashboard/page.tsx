import { ParentHome } from "@/modules/parent/page/ParentHome/parentHome";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parent Dashboard",
};

export default function Dashboard() {
  return <ParentHome />;
}








