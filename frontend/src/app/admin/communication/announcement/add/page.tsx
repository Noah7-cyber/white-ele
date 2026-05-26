import { Metadata } from "next";
import { Suspense } from "react";
import { CreateAnnouncementPage } from "@/modules/admin/page/CreateAnnouncementPage";

export const metadata: Metadata = {
  title: "Create Announcement",
};

const Page = () => (
  <Suspense fallback={null}>
    <CreateAnnouncementPage />
  </Suspense>
);

export default Page;
