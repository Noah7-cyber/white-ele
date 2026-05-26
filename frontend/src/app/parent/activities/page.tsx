import { Metadata } from "next";
import { ActivitiesPage } from "@/modules/parent/page/Activities/activities";

export const metadata: Metadata = {
  title: "Activities",
};

const Page = () => <ActivitiesPage  />;

export default Page;
