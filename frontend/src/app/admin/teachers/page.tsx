import { Metadata } from "next";
import TeachersPage from "@/modules/admin/page/TeacherPage/TeacherPage";

export const metadata: Metadata = {
  title: "Teachers",
};

const Page = () => <TeachersPage />;

export default Page;
