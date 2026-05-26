import { Metadata } from "next";
import { Parents } from "@/modules/admin/page/Parents";

export const metadata: Metadata = {
  title: "Parents",
};

const ParentsPage = () => <Parents />;

export default ParentsPage;
