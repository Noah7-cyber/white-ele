import { Metadata } from "next";
import { ChildrenPage } from "@/modules/parent/page/ChildrenPage/childrenPage";

export const metadata: Metadata = {
  title: "Children",
};

export default function Page() {
    return <ChildrenPage />;
}