import { AnnouncementsPage } from "@/modules/admin/page/Announcement";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Announcements",
};

const Page = () => <AnnouncementsPage />;

export default Page;
